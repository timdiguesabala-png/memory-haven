import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthSceneBackground from '../components/AuthSceneBackground'
import MemoryHavenLogo from '../components/MemoryHavenLogo'
import { isSupabaseMode } from '../lib/supabaseClient'
import { supabaseCompleteAuthCallback } from '../services/supabaseAuth'
import { prefetchAllAppPages } from '../lib/prefetchPages'
import '../styles/auth-scene.css'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!isSupabaseMode()) {
      navigate('/login', { replace: true })
      return undefined
    }

    let cancelled = false

    ;(async () => {
      try {
        const { session, utilisateur } = await supabaseCompleteAuthCallback()
        if (cancelled) return

        if (session && utilisateur) {
          prefetchAllAppPages()
          navigate('/accueil', { replace: true })
          return
        }

        if (session) {
          navigate('/login', {
            replace: true,
            state: {
              message:
                'Email confirmé. Connectez-vous avec votre mot de passe pour finaliser votre espace famille.'
            }
          })
          return
        }

        setErreur(
          'Lien invalide ou expiré. Connectez-vous avec votre email et mot de passe — ' +
            'votre compte est peut‑être déjà confirmé.'
        )
      } catch (err) {
        if (!cancelled) {
          setErreur(err.message || 'Impossible de valider le lien de confirmation.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="auth-page auth-page--scene">
      <AuthSceneBackground />
      <div className="auth-panel auth-panel--scene">
        <div className="auth-card auth-glass-card">
          <MemoryHavenLogo size="md" showWordmark showTagline={false} />
          <h2 style={{ marginTop: '1rem' }}>Confirmation en cours…</h2>
          {!erreur ? (
            <p className="auth-glass-subtitle">Patientez quelques secondes.</p>
          ) : (
            <>
              <p className="auth-error">{erreur}</p>
              <p className="auth-glass-footer" style={{ marginTop: '1rem' }}>
                <Link to="/login">Aller à la connexion</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
