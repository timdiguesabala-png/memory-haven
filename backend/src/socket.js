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

async function loadSocketUser(decoded) {
  const prisma = require('./lib/prisma')
  return prisma.utilisateur.findFirst({
    where: { id: decoded.id, is_active: true },
    select: { id: true, famille_id: true, role: true }
  })
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

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Non authentifié'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await loadSocketUser(decoded)
      if (!user) return next(new Error('Utilisateur introuvable ou inactif'))
      socket.userId = user.id
      socket.familleId = user.famille_id
      socket.userRole = user.role
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

    socket.on('send_message', async (data) => {
      if (socket.userRole === 'LECTEUR') return

      const message = data?.message || data?.contenu
      if (!message?.trim()) return

      const prisma = require('./lib/prisma')
      try {
        const user = await loadSocketUser({ id: socket.userId })
        if (!user || user.role === 'LECTEUR') return
        socket.familleId = user.famille_id

        const nouveauMessage = await prisma.messageDiscussion.create({
          data: {
            contenu: message.trim(),
            famille_id: user.famille_id,
            utilisateur_id: user.id
          },
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true, avatar_url: true }
            }
          }
        })
        const { emitNewMessage } = require('./lib/discussionSocket')
        emitNewMessage(user.famille_id, nouveauMessage)
      } catch (err) {
        console.error('Erreur socket message:', err)
      }
    })

    socket.on('typing', (data) => {
      if (socket.userRole === 'LECTEUR') return
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
