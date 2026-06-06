require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const pwd = decodeURIComponent(
  (process.env.DIRECT_URL || process.env.DATABASE_URL || '').match(/postgres(?:\.\w+)?:([^@]+)@/)?.[1] || ''
)
const ref = 'qazdsbeyhryodbtytzik'
const regions = [
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1',
  'us-east-1', 'us-west-1', 'us-west-2', 'ap-southeast-1', 'ap-northeast-1', 'sa-east-1'
]

async function tryRegion(r) {
  const url = `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@aws-0-${r}.pooler.supabase.com:6543/postgres?pgbouncer=true`
  const prisma = new PrismaClient({ datasources: { db: { url } } })
  try {
    await prisma.$queryRaw`SELECT 1 as ok`
    return url
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  if (!pwd) {
    console.error('No password in DATABASE_URL/DIRECT_URL')
    process.exit(1)
  }
  for (const r of regions) {
    process.stdout.write(`try ${r}... `)
    try {
      const url = await tryRegion(r)
      console.log('OK')
      console.log(url)
      return
    } catch (e) {
      console.log('fail')
    }
  }
  console.error('No pooler region matched')
  process.exit(1)
}

main()
