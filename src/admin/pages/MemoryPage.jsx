import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createOfficeMemory, deleteOfficeMemory } from '../../lib/officeApi'
import { MEMORY_CATEGORY_LABEL, useOfficeData } from '../OfficeDataContext'
import '../office/office.css'

export default function MemoryPage() {
  const { memory, activeProjects, refresh, loading } = useOfficeData()
  const [projectId, setProjectId] = useState(activeProjects[0]?.id || '')
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'business_info',
    importance: 'normal',
  })

  const filtered = useMemo(() => {
    if (!projectId) return memory
    return memory.filter((m) => m.projectId === projectId)
  }, [memory, projectId])

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">워크스페이스</p>
      <h2 className="office-page__title">Memory</h2>
      <p className="office-page__lead">프로젝트 메모리를 한곳에서 확인합니다.</p>
      {loading ? <p>불러오는 중…</p> : null}

      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ marginRight: 8 }}>프로젝트</span>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">전체</option>
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <form
        className="office-card"
        style={{ marginBottom: 14 }}
        onSubmit={async (e) => {
          e.preventDefault()
          if (!projectId) {
            window.alert('프로젝트를 선택하세요.')
            return
          }
          await createOfficeMemory({ ...form, projectId })
          setForm({ title: '', content: '', category: 'business_info', importance: 'normal' })
          await refresh()
        }}
      >
        <h3>메모리 추가</h3>
        <div className="office-form" style={{ marginTop: 10 }}>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="제목"
            required
          />
          <textarea
            rows={3}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="내용"
            required
          />
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {Object.entries(MEMORY_CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button type="submit" className="office-btn office-btn--primary">
            추가
          </button>
        </div>
      </form>

      {filtered.map((item) => (
        <div key={item.id} className="office-card" style={{ marginBottom: 10 }}>
          <p className="office-badge">{MEMORY_CATEGORY_LABEL[item.category] || item.category}</p>
          <h3>{item.title}</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
          <p>
            <Link to={`/admin/projects/${item.projectId}`}>
              {activeProjects.find((p) => p.id === item.projectId)?.name || '프로젝트'}
            </Link>
          </p>
          <button
            type="button"
            className="office-btn"
            onClick={async () => {
              if (!window.confirm('삭제할까요?')) return
              await deleteOfficeMemory(item.id)
              await refresh()
            }}
          >
            삭제
          </button>
        </div>
      ))}
    </div>
  )
}
