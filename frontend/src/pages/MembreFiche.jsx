import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import MembreFicheContent from '../components/MembreFicheContent'
import { fetchMembreComplet } from '../lib/fetchMembreComplet'
import { getCachedMembre } from '../lib/membresProfilCache'
import { getStoredUser } from '../lib/userStorage'
import '../styles/membre-fiche.css'

export default function MembreFiche() {
  const { id } = useParams()
  const navigate = useNavigate()
  const utilisateur = getStoredUser()
  const [membre, setMembre] = useState(() => getCachedMembre(id))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const numId = parseInt(id, 10)
    if (!Number.isFinite(numId)) {
      navigate('/membres', { replace: true })
      return
    }
    if (Number(numId) === Number(utilisateur?.id)) {
      navigate('/compte', { replace: true })
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      const base = getCachedMembre(id) || { id: numId }
      setMembre(base)
      try {
        const { membre: complet } = await fetchMembreComplet(base)
        if (!cancelled) setMembre(complet)
      } catch {
        /* garde le cache */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, navigate, utilisateur?.id])

  return (
    <AppLayout>
      <MembreFicheContent
        membre={membre}
        loading={loading}
        currentUserId={utilisateur?.id}
        onBack={() => navigate('/membres')}
      />
    </AppLayout>
  )
}
