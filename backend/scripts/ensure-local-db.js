/**
 * Aligne provider Prisma (sqlite vs postgresql) avec DATABASE_URL dans .env
 * — évite l’erreur « URL must start with postgresql:// » en dev local (file:./dev.db)
 */
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({
  path: path.join(__dirname, '../.env.supabase.local'),
  override: true
})

const schemaPath = path.join(__dirname, '../prisma/schema.prisma')
const url = process.env.DATABASE_URL || ''

let provider = 'postgresql'
if (url.startsWith('file:')) {
  provider = 'sqlite'
} else if (!url.startsWith('postgres')) {
  console.warn('[Memory Haven] DATABASE_URL non reconnu — PostgreSQL par défaut')
}

let schema = fs.readFileSync(schemaPath, 'utf8')
const current = schema.match(/provider\s*=\s*"(postgresql|sqlite)"/)
if (current && current[1] === provider) {
  process.exit(0)
}

schema = schema.replace(/provider\s*=\s*"(postgresql|sqlite)"/, `provider = "${provider}"`)

if (provider === 'postgresql') {
  if (!/directUrl/.test(schema)) {
    schema = schema.replace(
      /url\s*=\s*env\("DATABASE_URL"\)/,
      'url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")'
    )
  }
} else {
  schema = schema.replace(/\r?\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)/, '')
}

fs.writeFileSync(schemaPath, schema)
console.log(`[Memory Haven] Prisma → ${provider} (${url ? 'DATABASE_URL ok' : 'pas de DATABASE_URL'})`)
