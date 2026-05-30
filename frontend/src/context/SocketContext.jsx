import { createContext, useContext, useEffect } from 'react'
import { initSocket, disconnectSocket, getSocket } from '../services/socket'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined

    const socket = initSocket(token)

    const onNotification = (notif) => {
      window.dispatchEvent(new CustomEvent('mh-new-notification', { detail: notif }))
    }

    socket.on('new_notification', onNotification)

    return () => {
      socket.off('new_notification', onNotification)
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
