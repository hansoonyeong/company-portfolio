import { NavLink } from 'react-router-dom'

const titles = {
  '/admin/office': '오피스',
  '/admin/dashboard': '대시보드',
  '/admin/today': '오늘',
  '/admin/inbox': '수신함',
  '/admin/ai-team': 'AI 팀',
  '/admin/tasks': '작업',
  '/admin/notes': '노트',
  '/admin/files': '파일',
  '/admin/settings': '설정',
  '/admin/projects': '프로젝트',
  '/admin/website/quotes': '견적',
  '/admin/website/news': '소식',
  '/admin/website/hero': '히어로',
  '/admin/website/portfolio': '포트폴리오',
}

export default function AdminTopbar({ pathname }) {
  let title = titles[pathname]
  if (!title && pathname.startsWith('/admin/projects/')) title = '프로젝트'
  if (!title) title = 'AI Office'

  return (
    <header className="office-topbar">
      <div className="office-topbar__left">
        <h1 className="office-topbar__title">{title}</h1>
      </div>
      <div className="office-topbar__switch" role="tablist" aria-label="오피스 또는 대시보드">
        <NavLink
          to="/admin/office"
          className={({ isActive }) => `office-topbar__switch-btn${isActive ? ' is-active' : ''}`}
          role="tab"
        >
          오피스
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
