/**
 * Lie les Utilisateur Prisma existants à Supabase Auth (auth.users + auth_user_id).
 *
 * Prérequis backend/.env :
 *   DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage :
 *   node scripts/link-supabase-auth.js --dry-run
 *   node scripts/link-supabase-auth.js --email marie@demo.local --password demo1234
 *   node scripts/link-supabase-auth.js --all --password MemoryHaven2026!
 *   node scripts/link-supabase-auth.js --all --password MemoryHaven2026! --send-reset
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({
  path: path.join(__dirname, '../.env.supabase.local'),
  override: true
})
const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {
    email: null,
    password: null,
    all: false,
    dryRun: false,
    sendReset: false,
    includeInactive: false
  }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email') out.email = args[++i]
    else if (args[i] === '--password') out.password = args[++i]
    else if (args[i] === '--all') out.all = true
    else if (args[i] === '--dry-run') {
      out.dryRun = true
      out.all = true
    }
    else if (args[i] === '--send-reset') out.sendReset = true
    else if (args[i] === '--include-inactive') out.includeInactive = true
  }
  return out
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

async function ensureAuthUser(admin, email, password) {
  const existing = await findAuthUserByEmail(admin, email)
  if (existing) {
    if (password) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true
      })
      if (error) throw error
    }
    return { id: existing.id, created: false }
  }
  if (!password) {
    throw new Error(`Compte Auth absent pour ${email} — fournissez --password`)
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true
  })
  if (error) throw error
  return { id: data.user.id, created: true }
}

async function sendResetEmail(admin, email) {
  const site = process.env.FRONTEND_URL || 'https://memory-haven-frontend.vercel.app'
  const { error } = await admin.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${site.replace(/\/$/, '')}/reinitialiser-mot-de-passe`
  })
  if (error) throw error
}

async function fetchRows({ all, email, includeInactive }) {
  const activeOnly = includeInactive ? {} : { is_active: true }
  if (all) {
    const rows = await prisma.utilisateur.findMany({
      where: { auth_user_id: null, ...activeOnly },
      select: { id: true, email: true, prenom: true, nom: true, role: true },
      orderBy: { id: 'asc' }
    })
    return { rows, alreadyLinked: null }
  }
  if (email) {
    const row = await prisma.utilisateur.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true, prenom: true, nom: true, role: true, auth_user_id: true }
    })
    if (!row) return { rows: [], alreadyLinked: null }
    if (row.auth_user_id) return { rows: [], alreadyLinked: row }
    return { rows: [row], alreadyLinked: null }
  }
  return { rows: null, alreadyLinked: null }
}

async function linkOne(admin, row, password, sendReset) {
  const { id: authId, created } = await ensureAuthUser(admin, row.email, password)
  await prisma.utilisateur.update({
    where: { id: row.id },
    data: { auth_user_id: authId }
  })
  let reset = ''
  if (sendReset) {
    await sendResetEmail(admin, row.email)
    reset = ' + email reset'
  }
  const tag = created ? 'créé' : 'lié'
  console.log(`OK  [${tag}] ${row.email} (${row.prenom} ${row.nom}, ${row.role})${reset}`)
}

async function main() {
  const { email, password, all, dryRun, sendReset, includeInactive } = parseArgs()

  const { rows, alreadyLinked } = await fetchRows({ all, email, includeInactive })
  if (rows === null) {
    console.error(
      'Usage:\n' +
        '  --dry-run\n' +
        '  --email x@y.z --password ***\n' +
        '  --all --password *** [--send-reset] [--include-inactive]'
    )
    process.exit(1)
  }

  if (alreadyLinked) {
    console.log(`Déjà lié : ${alreadyLinked.email} (auth_user_id présent)`)
    return
  }

  const linked = await prisma.utilisateur.count({
    where: { auth_user_id: { not: null }, is_active: true }
  })
  const pending = rows.length

  console.log('')
  console.log(`Comptes actifs déjà liés : ${linked}`)
  console.log(`Comptes à traiter        : ${pending}`)
  console.log('')

  if (!pending) {
    console.log('Rien à faire — tous les comptes actifs ont déjà auth_user_id.')
    return
  }

  if (dryRun) {
    console.log('--- Aperçu (--dry-run, aucune modification) ---')
    for (const row of rows) {
      console.log(`  ${row.id}\t${row.email}\t${row.prenom} ${row.nom}\t${row.role}`)
    }
    console.log('')
    console.log('Lancer la migration :')
    console.log('  node scripts/link-supabase-auth.js --all --password VotreMotDePasseTemporaire')
    return
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Manque SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans backend/.env')
    process.exit(1)
  }
  if (!password || password.length < 6) {
    console.error('Indiquez --password (min. 6 caractères) pour créer ou mettre à jour Auth')
    process.exit(1)
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log('--- Migration en cours ---')
  for (const row of rows) {
    await linkOne(admin, row, password, sendReset)
  }

  const restants = await prisma.utilisateur.count({
    where: { auth_user_id: null, is_active: true }
  })

  console.log('')
  console.log('Terminé.')
  console.log(`Comptes actifs encore sans lien : ${restants}`)
  if (sendReset) {
    console.log('Emails « mot de passe oublié » envoyés — vérifiez les spams.')
  } else {
    console.log(
      `Connexion : email + mot de passe temporaire « ${password} » (communiquez-le à la famille).`
    )
    console.log('Ou relancez avec --send-reset pour que chacun choisisse son mot de passe.')
  }
}

main()
  .catch((e) => {
    console.error(e.message || e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
