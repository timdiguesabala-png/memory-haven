require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const grants = await p.$queryRawUnsafe(`
    SELECT grantee, privilege_type
    FROM information_schema.role_usage_grants
    WHERE object_schema = 'public' AND grantee IN ('anon', 'authenticated', 'service_role')
    ORDER BY grantee
  `)
  console.log('schema usage grants:', grants)

  const fn = await p.$queryRawUnsafe(`
    SELECT p.proname, r.rolname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_proc_acl pa ON pa.oid = p.oid
    JOIN pg_roles r ON r.oid = pa.grantee
    WHERE n.nspname = 'public' AND p.proname = 'get_my_profile'
  `).catch(() => null)
  console.log('fn acl query skipped if fails')

  const hasFn = await p.$queryRawUnsafe(`
    SELECT has_function_privilege('authenticated', 'public.get_my_profile()', 'EXECUTE') AS can_exec
  `)
  console.log('authenticated can exec get_my_profile:', hasFn)

  const hasSchema = await p.$queryRawUnsafe(`
    SELECT has_schema_privilege('authenticated', 'public', 'USAGE') AS can_use
  `)
  console.log('authenticated schema usage:', hasSchema)
}

main().finally(() => p.$disconnect())
