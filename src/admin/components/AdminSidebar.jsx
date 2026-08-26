import { NavLink } from 'react-router-dom'
import { useAdminAuth } from '../AdminAuthContext'
import { useOfficeData } from '../OfficeDataContext'

const AI_TEAM = [
  { id: 'chief-of-staff', label: '총괄 매니저' },
  { id: 'marketing', label: '마케팅' },
  { id: 'copywriter', label: '카피라이터' },
  { id: 'design-director', label: '디자인 디렉터' },
  { id: 'research', label: '리서치' },
  { id: 'sales-cs', label: '세일즈 · CS' },
  { id: 'web-developer', label: '웹 개발' },
  { id: 'operations', label: '운영' },
]

function Item({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `office-nav__link${isActive ? ' is-active' : ''}`}
    >
      {children}
    </NavLink>
  )
}

export default function AdminSidebar() {
  const { logout } = useAdminAuth()
  const { activeProjects, tasks, schedule } = useOfficeData()

  const waitingCount =
    tasks.filter((t) => t.status === 'waiting').length +
    (schedule || []).filter((s) => s.status === 'waiting').length

  return (
    <aside className="office-nav" aria-label="AI Office 내비게이션">
      <div className="office-nav__brand">
        <span className="office-nav__brand-name">soono</span>
        <span className="office-nav__brand-sub">운영 본부</span>
      </div>

      <nav className="office-nav__scroll">
        <p className="office-nav__section">홈</p>
        <Item to="/admin/today">오늘</Item>
        <Item to="/admin/schedule">일정</Item>
        <Item to="/admin/timeline">타임라인</Item>
        <Item to="/admin/office">Office</Item>
        <Item to="/admin/dashboard">Dashboard</Item>

        <p className="office-nav__section">프로젝트</p>
        {activeProjects.map((project) => (
          <Item key={project.id} to={`/admin/projects/${project.id}`}>
            {project.name}
          </Item>
        ))}
        <Item to="/admin/projects">+ 새 프로젝트</Item>

        <p className="office-nav__section">워크스페이스</p>
        <Item to="/admin/tasks">업무</Item>
        <Item to="/admin/waiting">
          대기 중{waitingCount ? ` (${waitingCount})` : ''}
        </Item>
        <Item to="/admin/notes">Notes</Item>
        <Item to="/admin/memory">Memory</Item>
        <Item to="/admin/files">Files</Item>
        <Item to="/admin/chat">채팅</Item>

        <p className="office-nav__section">AI 팀</p>
        {AI_TEAM.map((agent) => (
          <Item key={agent.id} to={`/admin/ai-team#${agent.id}`}>
            {agent.label}
          </Item>
        ))}

        <p className="office-nav__section">웹사이트</p>
        <Item to="/admin/website/quotes">견적</Item>
        <Item to="/admin/website/news">소식</Item>
        <Item to="/admin/website/hero">히어로</Item>
        <Item to="/admin/website/portfolio">포트폴리오</Item>
        <a className="office-nav__link" href="/wedding/admin" target="_blank" rel="noreferrer">
          웨딩 RSVP ↗
        </a>

        <p className="office-nav__section">시스템</p>
        <Item to="/admin/settings">Settings</Item>
        <button type="button" className="office-nav__link office-nav__action" onClick={logout}>
          Logout
        </button>
      </nav>
    </aside>
  )
}
