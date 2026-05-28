import { useNavigate } from 'react-router-dom'
import { SideNav } from './AppLayout'
import { SIDEBAR_NAV } from '../lib/navigation'

export default function StandardSidebar({ active, children, badges = {} }) {
  const navigate = useNavigate()
  const items = SIDEBAR_NAV.map((item) =>
    badges[item.key] != null ? { ...item, badge: badges[item.key] } : item
  )
  return (
    <>
      <SideNav items={items} active={active} onNavigate={navigate} />
      {children}
    </>
  )
}
