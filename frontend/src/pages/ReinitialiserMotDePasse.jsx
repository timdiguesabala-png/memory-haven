import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthSceneBackground from '../components/AuthSceneBackground'
import MemoryHavenLogo from '../components/MemoryHavenLogo'
import AuthPasswordField from '../components/AuthPasswordField'
import { supabaseUpdatePassword } from '../services/supabaseAuth'
import { isSupabaseMode } from '../lib/supabaseClient'
import '../styles/auth-scene.css'

export default function ReinitialiserMotDePasse() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setErreur('Le mot de passe doit faire au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setErreur('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    setErreur('')
    try {
      await supabaseUpdatePassword(password)
      navigate('/login', { replace: true })
    } catch (err) {
      setErreur(err.message || 'Impossible de mettre à jour le mot de passe')
    } finally {
      setLoading(false)
    }
  }

  if (!isSupabaseMode()) {
    return (
      <div className="auth-page auth-page--scene">
        <p>Activez VITE_USE_SUPABASE pour cette page.</p>
      </div>
    )
  }

  return (
    <div className="auth-page auth-page--scene">
      <AuthSceneBackground />
      <div className="auth-panel auth-panel--scene">
        <div className="auth-card auth-glass-card">
          <MemoryHavenLogo size="md" showWordmark showTagline={false} />
          <h2 style={{ marginTop: '1rem' }}>Nouveau mot de passe</h2>
          <form onSubmit={handleSubmit}>
            <AuthPasswordField
              label="Nouveau mot de passe"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <AuthPasswordField
              label="Confirmer"
              name="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {erreur && <p className="auth-error">{erreur}</p>}
            <button type="submit" className="mh-btn mh-btn--primary auth-submit" disabled={loading}>
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
