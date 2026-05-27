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

    socket.on('send_message', async (data) => {
      const message = data?.message || data?.contenu
      if (!message?.trim()) return

      const prisma = require('./lib/prisma')
      try {
        const nouveauMessage = await prisma.messageDiscussion.create({
          data: {
            contenu: message.trim(),
            famille_id: socket.familleId,
            utilisateur_id: socket.userId
          },
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true, avatar_url: true }
            }
          }
        })
        io.to(`famille_${socket.familleId}`).emit('new_message', nouveauMessage)
      } catch (err) {
        console.error('Erreur socket message:', err)
      }
    })

    socket.on('typing', (data) => {
      socket.to(`famille_${socket.familleId}`).emit('user_typing', {
        userId: socket.userId,
        prenom: data?.prenom,
        isTyping: data?.isTyping
      })
    })
  })

  return io
}

module.exports = { initSocket, getIo: () => io }
