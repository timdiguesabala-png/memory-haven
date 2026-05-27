import { io } from 'socket.io-client'

let socket

export const initSocket = (token) => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const socketUrl = import.meta.env.VITE_SOCKET_URL || apiBase.replace(/\/api\/?$/, '')
  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  })
  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
  }
}