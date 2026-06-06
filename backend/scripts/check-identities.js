require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

p.$queryRawUnsafe(`
  SELECT u.email, i.id, i.user_id, (i.id = i.user_id) AS broken
  FROM auth.users u
  JOIN auth.identities i ON i.user_id = u.id
  ORDER BY u.email
`).then((r) => {
  console.log(r)
  return p.$disconnect()
})
