import { createContext, useContext, useEffect } from 'react'
import { initSocket, disconnectSocket, getSocket } from '../services/socket'
import { getSupabase, isSupabaseMode } from '../lib/supabaseClient'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  useEffect(() => {
    let cancelled = false
    const onNotification = (notif) => {
      window.dispatchEvent(new CustomEvent('mh-new-notification', { detail: notif }))
    }

    ;(async () => {
      let token = localStorage.getItem('token')
      if (isSupabaseMode() && !token) {
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
