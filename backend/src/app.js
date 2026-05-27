const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://memory-haven-frontend.vercel.app'
]
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true)
    }
    callback(null, false)
  },
  credentials: true
}))

app.use(express.json())

// Routes
const authRoutes = require('./routes/auth')
const souvenirRoutes = require('./routes/souvenirs')
const commentaireRoutes = require('./routes/commentaires')
const reactionRoutes = require('./routes/reactions')
const albumRoutes = require('./routes/albums')
const arbreRoutes = require('./routes/arbre')
const membreRoutes = require('./routes/membres')
const uploadRoutes = require('./routes/upload')
const discussionRoutes = require('./routes/discussion')
const notificationRoutes = require('./routes/notifications')
const favorisRoutes = require('./routes/favoris')
const exportRoutes = require('./routes/export')

app.use('/api/auth', authRoutes)
app.use('/api/souvenirs', souvenirRoutes)
app.use('/api/commentaires', commentaireRoutes)
app.use('/api/reactions', reactionRoutes)
app.use('/api/albums', albumRoutes)
app.use('/api/arbre', arbreRoutes)
app.use('/api/membres', membreRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/discussion', discussionRoutes)
app.use('/api/notifications', notificationRoutes.router)
app.use('/api/favoris', favorisRoutes)
app.use('/api/export', exportRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'API Memory Haven en ligne !', status: 'OK' })
})

app.get('/api/health', async (req, res) => {
  try {
    const prisma = require('./lib/prisma')
    await prisma.utilisateur.count()
    res.json({ succes: true, api: 'OK', database: 'OK' })
  } catch (err) {
    console.error('Health check:', err.message)
    res.status(503).json({ succes: false, api: 'OK', database: 'KO', message: err.message })
  }
})

// Route 404
app.use((req, res) => {
  res.status(404).json({ succes: false, message: 'Route introuvable' })
})

const http = require('http')
const server = http.createServer(app)
const { initSocket } = require('./socket')
initSocket(server)

const PORT = process.env.PORT || 3000
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} déjà utilisé. Fermez l'autre serveur ou changez PORT dans .env`)
    process.exit(1)
  }
  throw err
})
server.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`)
  console.log(`🔌 Socket.io prêt`)
})