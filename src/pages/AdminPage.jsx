import { Navigate } from 'react-router-dom'

/** Legacy entry — redirects into soono AI Office */
export default function AdminPage() {
  return <Navigate to="/admin/office" replace />
}
