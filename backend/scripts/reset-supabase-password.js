/**
 * Reinitialise le mot de passe Supabase Auth (admin API).
 * Usage: node scripts/reset-supabase-password.js --email user@x.com --password NouveauMdp
 */
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

function parseArgs() {
  const args = process.argv.slice(2)
  let email = null
  let password = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email') email = args[++i]
    else if (args[i] === '--password') password = args[++i]
  }
  return { email, password }
}

async function findAuthUserByEmail(admin, email) {
  let page = 1
  const target = email.trim().toLowerCase()
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === target)
    if (hit) return hit
    if (data.users.length < 200) break
    page++
  }
  return null
}

async function main() {
  const { email, password } = parseArgs()
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Manque SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY dans backend/.env')
    process.exit(1)
  }
  if (!email || !password || password.length < 6) {
    console.error('Usage: node scripts/reset-supabase-password.js --email x@y.z --password ***')
    process.exit(1)
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const user = await findAuthUserByEmail(admin, email)
  if (!user) {
    console.error(`Aucun compte Supabase Auth pour ${email}`)
    process.exit(1)
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true
  })
  if (error) throw error

  console.log(`OK mot de passe mis a jour pour ${email}`)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
