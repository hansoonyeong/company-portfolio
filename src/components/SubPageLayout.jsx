import { Link } from 'react-router-dom'
import './SubPageLayout.css'

export default function SubPageLayout({ backLabel, children, className = '' }) {
  return (
    <div className={`sub-page ${className}`.trim()}>
      <div className="container sub-page__back">
        <Link to="/" className="sub-page__back-link">
          ← {backLabel}
        </Link>
      </div>
      {children}
    </div>
  )
}
