import { useNavigate } from 'react-router-dom'
import { SideNav } from './AppLayout'
import { SIDEBAR_GROUPS, SIDEBAR_NAV } from '../lib/navigation'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'

export default function StandardSidebar({ active, children, badges = {} }) {
  const navigate = useNavigate()
  const role = getStoredUser().role
  const groups = SIDEBAR_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => {
        if (item.key === 'ajouter' && !peutEcrire(role)) return false
        if (item.key === 'discussion' && !peutEcrire(role)) return false
        return true
      })
      .map((item) => (badges[item.key] != null ? { ...item, badge: badges[item.key] } : item))
  })).filter((g) => g.items.length > 0)

  return (
    <>
      <SideNav groups={groups} items={SIDEBAR_NAV} active={active} onNavigate={navigate} />
      {children}
    </>
  )
}
