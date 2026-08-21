import { useState } from 'react'
import { createOfficeNote, createOfficeTask } from '../../lib/officeApi'
import { useOfficeData } from '../OfficeDataContext'

export default function InboxPage() {
  const { activeProjects, refresh } = useOfficeData()
  const [type, setType] = useState('task')
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [msg, setMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg('')
    try {
      if (type === 'task') {
        await createOfficeTask({
          title,
          projectId: projectId || null,
          mode: 'queue',
          status: 'inbox',
        })
      } else {
        await createOfficeNote({
          title,
          content: '',
          projectId: projectId || null,
          type: type === 'idea' ? 'idea' : 'note',
        })
      }
      setTitle('')
      setMsg('저장되었습니다.')
      await refresh()
    } catch (err) {
      setMsg(err.message || '저장 실패')
    }
  }

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">홈</p>
      <h2 className="office-page__title">수신함</h2>
      <p className="office-page__lead">빠른 캡처 — 작업 / 노트 / 아이디어를 저장합니다.</p>

      <form className="office-card" onSubmit={handleSubmit}>
        <div className="office-form">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="task">작업</option>
            <option value="note">노트</option>
            <option value="idea">아이디어</option>
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="내용을 입력하세요"
            required
          />
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">프로젝트 (선택)</option>
            {activeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" className="office-btn office-btn--primary">
            저장
          </button>
          {msg ? <p>{msg}</p> : null}
        </div>
      </form>
    </div>
  )
}
