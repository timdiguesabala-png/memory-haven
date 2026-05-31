const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')

let io

function getAllowedOrigins() {
  const origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://memory-haven-frontend.vercel.app'
  ]
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL)
  }
  return origins
}

function initSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        const allowed = getAllowedOrigins()
        if (allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
          return callback(null, true)
        }
        callback(new Error('CORS non autorisé'))
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket']
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Non authentifié'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.id
      socket.familleId = decoded.famille_id
      next()
    } catch {
      next(new Error('Token invalide'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(`famille_${socket.familleId}`)
    if (socket.userId) {
      socket.join(`user_${socket.userId}`)
    }

  })

  return io
}

module.exports = { initSocket, getIo: () => io }
