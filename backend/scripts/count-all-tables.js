require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

p.$queryRawUnsafe(`
  SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1
`).then(async (tables) => {
  for (const { tablename } of tables) {
    const r = await p.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "${tablename}"`)
    console.log(tablename, r[0].n)
  }
  const auth = await p.$queryRawUnsafe(`SELECT count(*)::int AS n FROM auth.users`)
  console.log('auth.users', auth[0].n)
}).finally(() => p.$disconnect())
