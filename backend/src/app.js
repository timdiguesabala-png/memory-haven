const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
const { UPLOAD_DIR, mediaUploadReady, mediaProvider } = require('./services/mediaStorage')

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://memory-haven-frontend.vercel.app',
  'https://frontend-one-ashen-17.vercel.app'
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

app.use(express.json({ limit: '2mb' }))

// Fichiers locaux (dev sans Cloudinary)
app.use('/uploads', express.static(UPLOAD_DIR))

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
    const { cloudinaryConfigured } = require('./services/cloudinary')
    const cloudOk = cloudinaryConfigured()
    res.json({
      succes: true,
      api: 'OK',
      database: 'OK',
      cloudinary: cloudOk ? 'OK' : 'KO',
      media: {
        ready: mediaUploadReady(),
        provider: mediaProvider()
      },
      version: '15-discussion-photos-reactions',
      features: {
        arbreUnions: false,
        arbreCoupleRacine: false,
        uploadMultipart: true,
        uploadDocuments: true,
        favoris: true,
        discussionSocket: true,
        discussionPhotos: true,
        discussionReactions: true,
        visibiliteSouvenirs: true
      },
      deployedAt: new Date().toISOString()
    })
  } catch (err) {
    console.error('Health check:', err.message)
    res.status(503).json({ succes: false, api: 'OK', database: 'KO', message: err.message })
  }
})

app.get('/api/config', (req, res) => {
  const { cloudinaryConfigured } = require('./services/cloudinary')
  res.json({
    succes: true,
    uploadRoute: 'POST /api/souvenirs',
    media: {
      ready: mediaUploadReady(),
      provider: mediaProvider(),
      cloudinary: cloudinaryConfigured() ? 'OK' : 'KO'
    }
  })
})

// Erreurs Express → toujours du JSON (évite "<!DOCTYPE" côté frontend)
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ succes: false, message: 'Fichier trop volumineux (max 50 Mo)' })
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({
      succes: false,
      message: err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Nom de champ fichier invalide. Utilisez le champ « file ».'
        : err.message
    })
  }
  console.error('Erreur API:', err.message || err)
  res.status(err.status || 500).json({
    succes: false,
    message: err.message || 'Erreur serveur'
  })
})

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
  console.log(`📁 Médias: provider=${mediaProvider()}, ready=${mediaUploadReady()}`)
  if (process.env.NODE_ENV === 'production' && !mediaUploadReady()) {
    console.warn('⚠️  PRODUCTION: Cloudinary non configuré — les uploads échoueront.')
  }
})