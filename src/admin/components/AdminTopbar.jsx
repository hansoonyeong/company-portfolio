import { NavLink } from 'react-router-dom'
import { useOfficeData } from '../OfficeDataContext'

const titles = {
  '/admin/office': '오피스',
  '/admin/dashboard': '대시보드',
  '/admin/today': '오늘',
  '/admin/schedule': '일정',
  '/admin/timeline': '타임라인',
  '/admin/waiting': '대기 중',
  '/admin/inbox': '수신함',
  '/admin/ai-team': 'AI 팀',
  '/admin/tasks': '업무',
  '/admin/chat': '채팅',
  '/admin/notes': 'Notes',
  '/admin/memory': 'Memory',
  '/admin/files': 'Files',
  '/admin/settings': 'Settings',
  '/admin/projects': '프로젝트',
  '/admin/website/quotes': '견적',
  '/admin/website/news': '소식',
  '/admin/website/hero': '히어로',
  '/admin/website/portfolio': '포트폴리오',
}

export default function AdminTopbar({ pathname }) {
  const { isManualMode, isAiMode } = useOfficeData()
  let title = titles[pathname]
  if (!title && pathname.startsWith('/admin/projects/')) title = '프로젝트'
  if (!title) title = 'AI Office'

  return (
    <header className="office-topbar">
      <div className="office-topbar__left">
        <h1 className="office-topbar__title">{title}</h1>
        <span
          className="office-mode-pill"
          title={
            isManualMode
              ? 'Manage work manually. AI generation can be enabled later.'
              : 'AI generation is available.'
          }
        >
          {isAiMode ? 'AI Mode' : 'Manual Mode'}
        </span>
      </div>
      <div className="office-topbar__switch" role="tablist" aria-label="주요 화면">
        <NavLink
          to="/admin/today"
          className={({ isActive }) => `office-topbar__switch-btn${isActive ? ' is-active' : ''}`}
          role="tab"
        >
          오늘
        </NavLink>
        <NavLink
          to="/admin/schedule"
          className={({ isActive }) => `office-topbar__switch-btn${isActive ? ' is-active' : ''}`}
          role="tab"
        >
          일정
        </NavLink>
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => `office-topbar__switch-btn${isActive ? ' is-active' : ''}`}
          role="tab"
        >
          대시보드
        </NavLink>
      </div>
    </header>
  )
}
