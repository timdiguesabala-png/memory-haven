import { createContext, useContext, useEffect } from 'react'
import { initSocket, disconnectSocket, getSocket } from '../services/socket'
import { getSupabase, isSupabaseMode } from '../lib/supabaseClient'
import { subscribeNotifications } from '../services/notificationsApi'
import { getStoredUser } from '../lib/userStorage'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  useEffect(() => {
    let cancelled = false
    const onNotification = (notif) => {
      window.dispatchEvent(new CustomEvent('mh-new-notification', { detail: notif }))
    }

    let cleanupRealtime = () => {}

    ;(async () => {
      if (isSupabaseMode()) {
        const u = getStoredUser()
        if (u?.id && !cancelled) {
          cleanupRealtime = subscribeNotifications(u.id, onNotification) || (() => {})
        }
        return
      }

      let token = localStorage.getItem('token')
      if (!token) {
        const sb = getSupabase()
        if (sb) {
          const { data } = await sb.auth.getSession()
          token = data.session?.access_token
        }
      }
      if (!token || cancelled) return

      const socket = initSocket(token)
      socket.on('new_notification', onNotification)
    })()

    return () => {
      cancelled = true
      cleanupRealtime()
      const socket = getSocket()
      if (socket) socket.off('new_notification', onNotification)
      disconnectSocket()
    }
  }, [])

  return (
    <SocketContext.Provider value={getSocket}>
      {children}
    </SocketContext.Provider>
  )
}

export function useAppSocket() {
  return useContext(SocketContext)
}
