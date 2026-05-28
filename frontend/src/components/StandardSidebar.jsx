import { useNavigate } from 'react-router-dom'
import { SideNav } from './AppLayout'
import { SIDEBAR_NAV } from '../lib/navigation'

export default function StandardSidebar({ active, children }) {
  const navigate = useNavigate()
  return (
    <>
      <SideNav items={SIDEBAR_NAV} active={active} onNavigate={navigate} />
      {children}
    </>
  )
}
