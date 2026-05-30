import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import ProfilePhotoPicker from '../components/ProfilePhotoPicker'
import { getStoredUser } from '../lib/userStorage'
import { updateProfile, changePassword, refreshCurrentUser } from '../services/profileApi'
import '../styles/compte.css'

export default function Compte() {
  const [utilisateur, setUtilisateur] = useState(() => getStoredUser())
  const [profil, setProfil] = useState({
    prenom: '',
    nom: '',
    email: '',
    biographie: ''
  })
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [savingProfil, setSavingProfil] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    refreshCurrentUser()
      .then(({ utilisateur: u }) => {
        setUtilisateur(u)
        setProfil({
          prenom: u.prenom || '',
          nom: u.nom || '',
          email: u.email || '',
          biographie: u.biographie || ''
        })
      })
      .catch(() => {})
  }, [])

  const syncUser = (data) => {
    setUtilisateur(data)
    setProfil({
      prenom: data.prenom || '',
      nom: data.nom || '',
      email: data.email || '',
      biographie: data.biographie || ''
    })
  }

  const handleProfil = async (e) => {
    e.preventDefault()
    setErreur('')
    setMessage('')
    setSavingProfil(true)
    try {
      const data = await updateProfile(profil)
      syncUser(data)
      setMessage('Profil enregistré.')
    } catch (err) {
      setErreur(err.response?.data?.message || err.message || 'Erreur lors de l’enregistrement')
    } finally {
      setSavingProfil(false)
    }
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setErreur('')
    setMessage('')
    if (pwd.next !== pwd.confirm) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }
    setSavingPwd(true)
    try {
      await changePassword(pwd.current, pwd.next)
      setPwd({ current: '', next: '', confirm: '' })
      setMessage('Mot de passe mis à jour.')
    } catch (err) {
      setErreur(err.response?.data?.message || 'Impossible de changer le mot de passe')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <AppLayout activePath="/compte">
      <div className="mh-compte-page fade-in-up">
        <header className="mh-compte-header">
          <h1 className="mh-title">Mon compte</h1>
          <p className="mh-subtitle">Photo, identité, biographie et sécurité</p>
        </header>

        {message && <div className="mh-form-alert mh-compte-alert--ok">{message}</div>}
        {erreur && <div className="mh-form-alert">{erreur}</div>}

        <section className="mh-card mh-glass-card mh-compte-section mh-mirror-surface">
          <h2 className="mh-compte-section-title">Photo de profil</h2>
          <div className="mh-compte-photo">
            <ProfilePhotoPicker
              size={96}
              nom={utilisateur.nom}
              prenom={utilisateur.prenom}
              avatarUrl={utilisateur.avatar_url}
              onUpdated={syncUser}
            />
            <p className="mh-compte-hint">Cliquez sur l’avatar pour changer ou supprimer la photo.</p>
          </div>
        </section>

        <section className="mh-card mh-glass-card mh-compte-section mh-mirror-surface">
          <h2 className="mh-compte-section-title">Informations</h2>
          <form onSubmit={handleProfil}>
            <div className="mh-form-grid mh-compte-grid">
              <div className="mh-form-field">
                <label className="mh-label">Prénom</label>
                <input
                  className="mh-input"
                  value={profil.prenom}
                  onChange={(e) => setProfil({ ...profil, prenom: e.target.value })}
                  required
                />
              </div>
              <div className="mh-form-field">
                <label className="mh-label">Nom</label>
                <input
                  className="mh-input"
                  value={profil.nom}
                  onChange={(e) => setProfil({ ...profil, nom: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="mh-form-field">
              <label className="mh-label">Email</label>
              <input
                type="email"
                className="mh-input"
                value={profil.email}
                onChange={(e) => setProfil({ ...profil, email: e.target.value })}
                required
              />
            </div>
            <div className="mh-form-field">
              <label className="mh-label">Biographie</label>
              <textarea
                className="mh-input mh-compte-bio"
                rows={4}
                maxLength={500}
                placeholder="Quelques mots sur vous pour la famille…"
                value={profil.biographie}
                onChange={(e) => setProfil({ ...profil, biographie: e.target.value })}
              />
              <span className="mh-compte-char">{profil.biographie.length}/500</span>
            </div>
            <button type="submit" className="mh-btn mh-btn--primary" disabled={savingProfil}>
              {savingProfil ? 'Enregistrement…' : 'Enregistrer le profil'}
            </button>
          </form>
        </section>

        <section className="mh-card mh-glass-card mh-compte-section mh-mirror-surface">
          <h2 className="mh-compte-section-title">Mot de passe</h2>
          <form onSubmit={handlePassword}>
            <div className="mh-form-field">
              <label className="mh-label">Mot de passe actuel</label>
              <input
                type="password"
                className="mh-input"
                autoComplete="current-password"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                required
              />
            </div>
            <div className="mh-form-grid mh-compte-grid">
              <div className="mh-form-field">
                <label className="mh-label">Nouveau mot de passe</label>
                <input
                  type="password"
                  className="mh-input"
                  autoComplete="new-password"
                  minLength={6}
                  value={pwd.next}
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                  required
                />
              </div>
              <div className="mh-form-field">
                <label className="mh-label">Confirmer</label>
                <input
                  type="password"
                  className="mh-input"
                  autoComplete="new-password"
                  value={pwd.confirm}
                  onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="mh-btn mh-btn--secondary" disabled={savingPwd}>
              {savingPwd ? 'Mise à jour…' : 'Changer le mot de passe'}
            </button>
          </form>
        </section>

        {utilisateur.famille && (
          <p className="mh-compte-family">
            Famille : <strong>{utilisateur.famille}</strong> · rôle {utilisateur.role}
          </p>
        )}
      </div>
    </AppLayout>
  )
}
