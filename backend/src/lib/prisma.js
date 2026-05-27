const { PrismaClient } = require('@prisma/client')

// Configuration pour éviter l'erreur "prepared statement already exists"
const prisma = new PrismaClient({
  log: ['error'],
  // Désactive les prepared statements pour Supabase
})

prisma.$connect().then(() => {
  console.log('✅ Base de données connectée')
}).catch((e) => {
  console.error('❌ Erreur connexion Prisma:', e.message)
})

module.exports = prisma