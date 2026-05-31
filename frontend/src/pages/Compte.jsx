import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import ProfilePhotoPicker from '../components/ProfilePhotoPicker'
import { getStoredUser } from '../lib/userStorage'
import { updateProfile, changePassword, refreshCurrentUser } from '../services/profileApi'
import '../styles/compte.css'
import { enable2FA, fetch2FAStatus, confirm2FA, disable2FA } from '../lib/platformApi'
import { useTheme } from '../context/ThemeContext'
import PageHeader from '../components/PageHeader'

export default function Compte() {
  const [utilisateur, setUtilisateur] = useState(() => getStoredUser())
  const [profil, setProfil] = useState({
    prenom: '',
    nom: '',
    email: '',
    biographie: '',
    interets: '',
    ville_actuelle: '',
    lieu_naissance: '',
    latitude: '',
    longitude: ''
  })
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [savingProfil, setSavingProfil] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const { comfortMode, setComfortMode } = useTheme()
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [twoFA, setTwoFA] = useState({ enabled: false, loading: true })
  const [twoFASetup, setTwoFASetup] = useState(null)
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFADisable, setTwoFADisable] = useState({ code: '', password: '' })
  const [twoFAWorking, setTwoFAWorking] = useState(false)

  useEffect(() => {
    refreshCurrentUser()
      .then(({ utilisateur: u }) => {
        setUtilisateur(u)
        setProfil({
          prenom: u.prenom || '',
          nom: u.nom || '',
          email: u.email || '',
          biographie: u.biographie || '',
          interets: Array.isArray(u.interets) ? u.interets.join(', ') : '',
          ville_actuelle: u.ville_actuelle || '',
          lieu_naissance: u.lieu_naissance || '',
          latitude: u.latitude ?? '',
          longitude: u.longitude ?? ''
        })
      })
      .catch(() => {})
    fetch2FAStatus()
      .then((s) => setTwoFA({ enabled: s?.enabled || false, loading: false }))
      .catch(() => setTwoFA({ enabled: false, loading: false }))
  }, [])

  const syncUser = (data) => {
    setUtilisateur(data)
    setProfil({
      prenom: data.prenom || '',
      nom: data.nom || '',
      email: data.email || '',
      biographie: data.biographie || '',
      interets: Array.isArray(data.interets) ? data.interets.join(', ') : '',
      ville_actuelle: data.ville_actuelle || '',
      lieu_naissance: data.lieu_naissance || '',
      latitude: data.latitude ?? '',
      longitude: data.longitude ?? ''
    })
  }

  const handleProfil = async (e) => {
    e.preventDefault()
    setErreur('')
    setMessage('')
    setSavingProfil(true)
    try {
      const data = await updateProfile({
        ...profil,
        interets: profil.interets.split(',').map((s) => s.trim()).filter(Boolean)
      })
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
        <PageHeader
          title="Mon compte"
          family={utilisateur.famille}
          subtitle="Profil et sécurité"
        />

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
                maxLength={2000}
                placeholder="Quelques mots sur vous pour la famille…"
                value={profil.biographie}
                onChange={(e) => setProfil({ ...profil, biographie: e.target.value })}
              />
              <span className="mh-compte-char">{profil.biographie.length}/2000</span>
            </div>
            <div className="mh-form-field">
              <label className="mh-label">Centres d&apos;intérêt (séparés par des virgules)</label>
              <input
                className="mh-input"
                value={profil.interets}
                onChange={(e) => setProfil({ ...profil, interets: e.target.value })}
                placeholder="Cuisine, voyages, musique…"
              />
            </div>
            <div className="mh-form-grid mh-compte-grid">
              <div className="mh-form-field">
                <label className="mh-label">Ville actuelle</label>
                <input className="mh-input" value={profil.ville_actuelle} onChange={(e) => setProfil({ ...profil, ville_actuelle: e.target.value })} />
              </div>
              <div className="mh-form-field">
                <label className="mh-label">Lieu de naissance</label>
                <input className="mh-input" value={profil.lieu_naissance} onChange={(e) => setProfil({ ...profil, lieu_naissance: e.target.value })} />
              </div>
            </div>
            <div className="mh-form-grid mh-compte-grid">
              <div className="mh-form-field">
                <label className="mh-label">Latitude (carte)</label>
                <input className="mh-input" type="number" step="any" value={profil.latitude} onChange={(e) => setProfil({ ...profil, latitude: e.target.value })} />
              </div>
              <div className="mh-form-field">
                <label className="mh-label">Longitude (carte)</label>
                <input className="mh-input" type="number" step="any" value={profil.longitude} onChange={(e) => setProfil({ ...profil, longitude: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="mh-btn mh-btn--primary" disabled={savingProfil}>
              {savingProfil ? 'Enregistrement…' : 'Enregistrer le profil'}
            </button>
          </form>
        </section>

        <section className="mh-card mh-glass-card mh-compte-section mh-mirror-surface">
          <h2 className="mh-compte-section-title">Accessibilité & sécurité</h2>
          <label className="mh-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={comfortMode} onChange={(e) => setComfortMode(e.target.checked)} />
            Mode confort (texte et boutons agrandis)
          </label>

          <div style={{ marginTop: '1rem' }}>
            <h3 className="mh-compte-section-title" style={{ fontSize: '1rem' }}>
              Authentification à deux facteurs (2FA)
            </h3>
            {twoFA.loading ? (
              <p className="mh-compte-hint">Vérification…</p>
            ) : twoFA.enabled ? (
              <div>
                <p className="mh-compte-hint">✅ 2FA activée — votre compte est protégé par une application d&apos;authentification.</p>
                <div className="mh-form-grid mh-compte-grid" style={{ marginTop: '0.75rem' }}>
                  <div className="mh-form-field">
                    <label className="mh-label">Code actuel (6 chiffres)</label>
                    <input
                      className="mh-input"
                      inputMode="numeric"
                      maxLength={6}
                      value={twoFADisable.code}
                      onChange={(e) => setTwoFADisable({ ...twoFADisable, code: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="mh-form-field">
                    <label className="mh-label">Mot de passe</label>
                    <input
                      type="password"
                      className="mh-input"
                      value={twoFADisable.password}
                      onChange={(e) => setTwoFADisable({ ...twoFADisable, password: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="mh-btn mh-btn--secondary"
                  disabled={twoFAWorking}
                  onClick={async () => {
                    setErreur('')
                    setMessage('')
                    setTwoFAWorking(true)
                    try {
                      await disable2FA(twoFADisable.code, twoFADisable.password)
                      setTwoFA({ enabled: false, loading: false })
                      setTwoFASetup(null)
                      setTwoFADisable({ code: '', password: '' })
                      setMessage('2FA désactivée.')
                    } catch (err) {
                      setErreur(err.response?.data?.message || 'Impossible de désactiver la 2FA')
                    } finally {
                      setTwoFAWorking(false)
                    }
                  }}
                >
                  Désactiver la 2FA
                </button>
              </div>
            ) : twoFASetup ? (
              <div>
                <p className="mh-compte-hint">
                  Scannez ce QR code avec Google Authenticator, Authy ou une app compatible TOTP.
                </p>
                {twoFASetup.qrDataUrl && (
                  <img
                    src={twoFASetup.qrDataUrl}
                    alt="QR code 2FA"
                    width={200}
                    height={200}
                    style={{ display: 'block', margin: '0.75rem 0', borderRadius: 8 }}
                  />
                )}
                {twoFASetup.secret && (
                  <p className="mh-compte-hint">
                    Clé manuelle : <code>{twoFASetup.secret}</code>
                  </p>
                )}
                <div className="mh-form-field">
                  <label className="mh-label">Code de vérification</label>
                  <input
                    className="mh-input"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="mh-btn mh-btn--primary"
                    disabled={twoFAWorking || twoFACode.length < 6}
                    onClick={async () => {
                      setErreur('')
                      setMessage('')
                      setTwoFAWorking(true)
                      try {
                        await confirm2FA(twoFACode)
                        setTwoFA({ enabled: true, loading: false })
                        setTwoFASetup(null)
                        setTwoFACode('')
                        setMessage('Authentification à deux facteurs activée.')
                      } catch (err) {
                        setErreur(err.response?.data?.message || 'Code incorrect')
                      } finally {
                        setTwoFAWorking(false)
                      }
                    }}
                  >
                    Confirmer l&apos;activation
                  </button>
                  <button
                    type="button"
                    className="mh-btn mh-btn--secondary"
                    onClick={() => {
                      setTwoFASetup(null)
                      setTwoFACode('')
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="mh-btn mh-btn--secondary"
                style={{ marginTop: '0.5rem' }}
                disabled={twoFAWorking}
                onClick={async () => {
                  setErreur('')
                  setMessage('')
                  setTwoFAWorking(true)
                  try {
                    const setup = await enable2FA()
                    setTwoFASetup(setup)
                  } catch (err) {
                    setErreur(err.response?.data?.message || '2FA indisponible — mettez l’API à jour.')
                  } finally {
                    setTwoFAWorking(false)
                  }
                }}
              >
                Activer la 2FA
              </button>
            )}
          </div>
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
