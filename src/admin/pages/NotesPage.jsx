import { useMemo, useState } from 'react'
import { createOfficeNote, deleteOfficeNote } from '../../lib/officeApi'
import { useOfficeData } from '../OfficeDataContext'

export default function NotesPage() {
  const { notes, projects, refresh, loading, error } = useOfficeData()
  const [projectFilter, setProjectFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({ title: '', content: '', projectId: '' })

  const filtered = useMemo(
    () =>
      notes.filter((note) => {
        if (projectFilter !== 'all' && note.projectId !== projectFilter) return false
        if (query.trim()) {
          const q = query.toLowerCase()
          return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)
        }
        return true
      }),
    [notes, projectFilter, query],
  )

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">워크스페이스</p>
      <h2 className="office-page__title">노트</h2>
      <p className="office-page__lead">프로젝트에 연결할 수 있는 간단한 노트입니다.</p>
      {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}
      {loading ? <p>불러오는 중…</p> : null}

      <form
        className="office-card"
        style={{ marginBottom: 14 }}
        onSubmit={async (e) => {
          e.preventDefault()
          await createOfficeNote({
            ...form,
            projectId: form.projectId || null,
          })
          setForm({ title: '', content: '', projectId: '' })
          await refresh()
        }}
      >
        <h3>노트 작성</h3>
        <div className="office-form" style={{ marginTop: 10 }}>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="제목"
            required
          />
          <textarea
            rows={4}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="내용"
          />
          <select
            value={form.projectId}
            onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
          >
            <option value="">프로젝트 (선택)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" className="office-btn office-btn--primary">
            저장
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="all">전체 프로젝트</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색" />
      </div>

      {filtered.map((note) => (
        <div key={note.id} className="office-card" style={{ marginBottom: 10 }}>
          <h3>{note.title}</h3>
          <p style={{ color: '#888', fontSize: 12 }}>
            {projects.find((p) => p.id === note.projectId)?.name || '프로젝트 없음'}
            {note.type === 'idea' ? ' · 아이디어' : ''}
          </p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
          <button
            type="button"
            className="office-btn"
            onClick={async () => {
              if (!window.confirm('삭제할까요?')) return
              await deleteOfficeNote(note.id)
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
