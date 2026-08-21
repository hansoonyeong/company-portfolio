import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from './AdminAuthContext'
import { OfficeDataProvider } from './OfficeDataContext'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import AdminMobileNav from './components/AdminMobileNav'
import './admin-shell.css'
import '../pages/AdminPage.css'

export default function AdminLayout() {
  const { isAuthenticated, password, setPassword, loginError, loggingIn, login } = useAdminAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <div className="admin admin--login">
        <form className="admin__login" onSubmit={login}>
          <h1>soono AI Office</h1>
          <p>내부 워크스페이스 · 웹사이트 관리</p>
          <label>
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </label>
          {loginError && <p className="admin__error">{loginError}</p>}
          <button type="submit" disabled={loggingIn}>
            {loggingIn ? '로그인 중…' : '로그인'}
          </button>
          <Link to="/" className="admin__home-link">
            ← 홈으로
          </Link>
        </form>
      </div>
    )
  }

  return (
    <OfficeDataProvider>
      <div className="office-shell">
        <AdminSidebar />
        <div className="office-shell__main">
          <AdminTopbar pathname={location.pathname} />
          <AdminMobileNav />
          <div className="office-shell__content">
            <Outlet />
          </div>
        </div>
      </div>
    </OfficeDataProvider>
  )
}
