require('dotenv').config()
const { Client } = require('pg')

async function main() {
  const url = process.env.DATABASE_URL
  if (!url || url.startsWith('file:')) {
    console.error('DATABASE_URL postgres requis')
    process.exit(1)
  }
  const c = new Client({ connectionString: url })
  await c.connect()
  const u = await c.query('SELECT count(*)::int AS n FROM "Utilisateur"')
  const a = await c.query(
    'SELECT count(*)::int AS n FROM "Utilisateur" WHERE "auth_user_id" IS NOT NULL'
  )
  console.log('Utilisateur:', u.rows[0].n, '| lies:', a.rows[0].n)
  await c.end()
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
