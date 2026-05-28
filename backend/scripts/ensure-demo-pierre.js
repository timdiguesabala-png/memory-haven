/**
 * Crée le compte pierre@demo.local sur l'API (famille DEMO2026) si absent.
 * Usage: node scripts/ensure-demo-pierre.js [URL_API]
 */
const API = process.argv[2] || 'https://memory-haven-api-production.up.railway.app/api'

async function main() {
  const res = await fetch(`${API}/auth/rejoindre`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nom: 'Martin',
      prenom: 'Pierre',
      email: 'pierre@demo.local',
      password: 'demo1234',
      code: 'DEMO2026'
    })
  })
  const data = await res.json().catch(() => ({}))
  if (res.ok) {
    console.log('✅ Pierre créé ou déjà présent:', data.message)
    return
  }
  if (data.message?.includes('déjà utilisé')) {
    console.log('✅ Pierre existe déjà (email utilisé)')
    return
  }
  console.error('❌', data.message || res.status)
  process.exit(1)
}

main()
