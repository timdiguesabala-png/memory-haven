import { useEffect, useState } from 'react'
import { isPlatformLocalMode } from '../lib/platformApi'

export default function PlatformLocalNotice() {
  const [local, setLocal] = useState(() => isPlatformLocalMode())

  useEffect(() => {
    const sync = () => setLocal(isPlatformLocalMode())
    window.addEventListener('mh-platform-local', sync)
    return () => window.removeEventListener('mh-platform-local', sync)
  }, [])

  if (!local) return null

  return (
    <p className="mh-platform-local-notice" role="status">
      Mode local : ces sections fonctionnent avec vos souvenirs et l&apos;arbre. Les ajouts
      (héritage, capsules, hommages, événements) sont enregistrés sur cet appareil jusqu&apos;à la
      mise à jour complète de l&apos;API.
    </p>
  )
}
