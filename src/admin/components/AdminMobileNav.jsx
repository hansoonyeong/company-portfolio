import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/admin/office', label: '오피스' },
  { to: '/admin/dashboard', label: '대시보드' },
  { to: '/admin/website/quotes', label: '견적' },
  { to: '/admin/website/portfolio', label: '포트폴리오' },
  { to: '/admin/ai-team', label: '팀' },
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
