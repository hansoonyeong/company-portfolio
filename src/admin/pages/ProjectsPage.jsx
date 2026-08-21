import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createOfficeProject,
  deleteOfficeProject,
  updateOfficeProject,
} from '../../lib/officeApi'
import {
  PROJECT_STATUS_LABEL,
  useOfficeData,
} from '../OfficeDataContext'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { activeProjects, projects, refresh, loading, error } = useOfficeData()
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'active',
    currentGoal: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const archived = useMemo(() => projects.filter((p) => p.archived), [projects])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const created = await createOfficeProject(form)
      setForm({ name: '', description: '', status: 'active', currentGoal: '' })
      await refresh()
      navigate(`/admin/projects/${created.id}`)
    } catch (err) {
      setMsg(err.message || '생성 실패')
    } finally {
      setSaving(false)
    }
  }

  async function archiveProject(project) {
    await updateOfficeProject(project.id, { archived: true })
    await refresh()
  }

  async function removeProject(project) {
    if (!window.confirm(`「${project.name}」 프로젝트를 삭제할까요?`)) return
    await deleteOfficeProject(project.id)
    await refresh()
  }

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">프로젝트</p>
      <h2 className="office-page__title">오피스 프로젝트</h2>
      <p className="office-page__lead">
        비즈니스 워크스페이스 프로젝트입니다. 공개 포트폴리오 CMS와는 별개입니다.
      </p>

      {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}
      {loading ? <p>불러오는 중…</p> : null}

      <form className="office-card" onSubmit={handleCreate} style={{ marginBottom: 18 }}>
        <h3>새 프로젝트</h3>
        <div className="office-form" style={{ marginTop: 12 }}>
          <label>
            <span>이름</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label>
            <span>설명</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label>
            <span>현재 목표</span>
            <input
              value={form.currentGoal}
              onChange={(e) => setForm((f) => ({ ...f, currentGoal: e.target.value }))}
            />
          </label>
          <label>
            <span>상태</span>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {Object.entries(PROJECT_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {msg ? <p style={{ color: '#8b3a3a' }}>{msg}</p> : null}
          <button type="submit" className="office-btn office-btn--primary" disabled={saving}>
            {saving ? '저장 중…' : '프로젝트 만들기'}
          </button>
        </div>
      </form>

      <div className="office-card-grid">
        {activeProjects.map((project) => (
          <section key={project.id} className="office-card">
            <h3>
              <Link to={`/admin/projects/${project.id}`}>{project.name}</Link>
            </h3>
            <p>
              <span className="office-badge">{PROJECT_STATUS_LABEL[project.status] || project.status}</span>
            </p>
            <p style={{ marginTop: 8 }}>{project.description || '설명 없음'}</p>
            <p style={{ marginTop: 8 }}>목표: {project.currentGoal || '—'}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Link className="office-btn" to={`/admin/projects/${project.id}`}>
                열기
              </Link>
              <button type="button" className="office-btn" onClick={() => archiveProject(project)}>
                보관
              </button>
              <button type="button" className="office-btn" onClick={() => removeProject(project)}>
                삭제
              </button>
            </div>
          </section>
        ))}
      </div>

      {archived.length > 0 && (
        <>
          <h3 style={{ marginTop: 28 }}>보관됨</h3>
          <ul>
            {archived.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/projects/${p.id}`}>{p.name}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
