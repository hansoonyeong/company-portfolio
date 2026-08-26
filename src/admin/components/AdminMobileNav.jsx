import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/admin/today', label: '오늘' },
  { to: '/admin/schedule', label: '일정' },
  { to: '/admin/waiting', label: '대기' },
  { to: '/admin/tasks', label: '업무' },
  { to: '/admin/office', label: 'Office' },
]

export default function AdminMobileNav() {
  return (
    <nav className="office-mobile-nav" aria-label="모바일 바로가기">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => `office-mobile-nav__link${isActive ? ' is-active' : ''}`}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
