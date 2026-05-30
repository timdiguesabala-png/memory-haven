import { useNavigate } from 'react-router-dom'
import { SideNav } from './AppLayout'
import { SIDEBAR_NAV } from '../lib/navigation'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'

export default function StandardSidebar({ active, children, badges = {} }) {
  const navigate = useNavigate()
  const role = getStoredUser().role
  const nav = SIDEBAR_NAV.filter((item) => item.key !== 'ajouter' || peutEcrire(role))
  const items = nav.map((item) =>
    badges[item.key] != null ? { ...item, badge: badges[item.key] } : item
  )
  return (
    <>
      <SideNav items={items} active={active} onNavigate={navigate} />
      {children}
    </>
  )
}
