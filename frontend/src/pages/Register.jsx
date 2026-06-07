import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { isSupabaseMode } from '../lib/supabaseClient'
import {
  supabaseVerifyInviteCode,
  supabaseSignUpCreateFamily,
  supabaseSignUpJoinFamily,
  persistSupabaseUser
} from '../services/supabaseAuth'
import AuthSceneBackground from '../components/AuthSceneBackground'
import MemoryHavenLogo from '../components/MemoryHavenLogo'
import AuthPasswordField from '../components/AuthPasswordField'
import '../styles/auth-scene.css'
import { prefetchAllAppPages } from '../lib/prefetchPages'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codeUrl = searchParams.get('code') || ''
  const modeUrl = searchParams.get('mode')
  const roleUrl = searchParams.get('role') || 'MEMBRE'
  const lienInvite = !!(codeUrl || modeUrl === 'rejoindre')

  const [famillePreview, setFamillePreview] = useState(null)

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: searchParams.get('email') || '',
    password: '',
    nom_famille: '',
    code: codeUrl
  })
  const [erreur, setErreur] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const rejoindre = lienInvite

  useEffect(() => {
    if (!lienInvite) return
    const code = String(form.code || codeUrl).trim().toUpperCase()
    if (!code) {
      setFamillePreview(null)
      return
    }
    const t = setTimeout(async () => {
      try {
        if (isSupabaseMode()) {
          const data = await supabaseVerifyInviteCode(code)
          setFamillePreview(data?.succes ? data : null)
        } else {
          const rep = await api.get('/auth/verifier-code', { params: { code } })
          setFamillePreview(rep.data)
        }
        setErreur('')
      } catch {
        setFamillePreview(null)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [form.code, codeUrl, lienInvite])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    setInfo('')

    try {
      if (isSupabaseMode()) {
        const code = String(form.code || '').trim().toUpperCase()
        if (rejoindre) {
          if (!code) {
            setErreur("Entrez le code d'invitation.")
            setLoading(false)
            return
          }
          const result = await supabaseSignUpJoinFamily({
            email: form.email,
            password: form.password,
            prenom: form.prenom,
            nom: form.nom,
            code,
            role: roleUrl
          })
          if (result.needsEmailConfirmation) {
            setInfo(result.message)
            return
          }
          persistSupabaseUser(result.utilisateur)
        } else {
          const result = await supabaseSignUpCreateFamily({
            email: form.email,
            password: form.password,
            prenom: form.prenom,
            nom: form.nom,
            nom_famille: form.nom_famille
          })
          if (result.needsEmailConfirmation) {
            setInfo(result.message)
            return
          }
          persistSupabaseUser(result.utilisateur)
        }
        prefetchAllAppPages()
        navigate('/accueil')
        return
      }

      let reponse
      if (rejoindre) {
        const code = String(form.code || '').trim().toUpperCase()
        if (!code) {
          setErreur('Entrez le code d\'invitation.')
          setLoading(false)
          return
        }
        reponse = await api.post('/auth/rejoindre', {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          password: form.password,
          code,
          role: roleUrl
        })
      } else {
        reponse = await api.post('/auth/inscription', {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          password: form.password,
          nom_famille: form.nom_famille
        })
      }
      localStorage.setItem('token', reponse.data.token)
      localStorage.setItem('utilisateur', JSON.stringify(reponse.data.utilisateur))
      const code =
        reponse.data.utilisateur?.code_invitation ||
        reponse.data.code_invitation ||
        (rejoindre ? String(form.code).trim().toUpperCase() : null)
      if (code) localStorage.setItem('mh_family_invite_code', code)
      prefetchAllAppPages()
      navigate('/accueil')
    } catch (err) {
      setErreur(
        err.message || err.userMessage || err.response?.data?.message || "Erreur lors de l'inscription"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-page--scene">
      <AuthSceneBackground />

      <div className="auth-panel auth-panel--scene">
        <div className="auth-card auth-glass-card">
          <div className="auth-card-logo auth-card-logo--hero">
            <MemoryHavenLogo size="md" showWordmark showTagline={false} />
          </div>

          <h2>{rejoindre ? 'Rejoindre une famille' : 'Créer un espace famille'}</h2>

          {famillePreview?.famille && (
            <p className="auth-invite-preview">
              Famille <strong>{famillePreview.famille.nom}</strong>
            </p>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {rejoindre && (
              <label className="mh-label">
                Code d&apos;invitation
                <input
                  name="code"
                  className="mh-input"
                  value={form.code}
                  onChange={handleChange}
                  required
                  readOnly={!!codeUrl}
                  style={{ textTransform: 'uppercase' }}
                />
              </label>
            )}
            <div className="auth-name-row">
              <label className="mh-label">
                Prénom
                <input name="prenom" className="mh-input" value={form.prenom} onChange={handleChange} required />
              </label>
              <label className="mh-label">
                Nom
                <input name="nom" className="mh-input" value={form.nom} onChange={handleChange} required />
              </label>
            </div>
            <label className="mh-label">
              Email
              <input type="email" name="email" className="mh-input" value={form.email} onChange={handleChange} required />
            </label>
            <label className="mh-label">
              Mot de passe
              <AuthPasswordField
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </label>
            {!rejoindre && (
              <label className="mh-label">
                Nom de famille
                <input name="nom_famille" className="mh-input" value={form.nom_famille} onChange={handleChange} required />
              </label>
            )}
            {info && (
              <div className="auth-error-block">
                <p className="auth-info">{info}</p>
                <p className="auth-error-hint">
                  <Link
                    to={`/login${form.email ? `?email=${encodeURIComponent(form.email)}` : ''}`}
                  >
                    Se connecter avec {form.email || 'cet email'}
                  </Link>
                </p>
              </div>
            )}
            {erreur && (
              <div className="auth-error-block">
                <p className="auth-error">{erreur}</p>
                {(erreur.includes('Trop de tentatives') ||
                  erreur.includes('déjà inscrit') ||
                  erreur.includes('Confirmez votre email') ||
                  erreur.includes('Vérifiez votre boîte mail')) && (
                  <p className="auth-error-hint">
                    <Link
                      to={`/login${form.email ? `?email=${encodeURIComponent(form.email)}` : ''}`}
                    >
                      Se connecter avec {form.email || 'cet email'}
                    </Link>
                  </p>
                )}
              </div>
            )}
            <button type="submit" className="mh-btn auth-btn-glass auth-submit" disabled={loading}>
              {loading ? '…' : rejoindre ? 'Rejoindre' : 'Créer le compte'}
            </button>
          </form>

          <p className="auth-glass-footer">
            <Link to={lienInvite ? `/login?code=${encodeURIComponent(String(form.code || codeUrl).trim().toUpperCase())}${form.email ? `&email=${encodeURIComponent(form.email)}` : ''}` : '/login'}>
              Déjà un compte ? Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
