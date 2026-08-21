import { Outlet } from 'react-router-dom'
import './styles/wedding.css'

export default function WeddingLayout() {
  return (
    <div className="wedding-root">
      <Outlet />
    </div>
  )
}
