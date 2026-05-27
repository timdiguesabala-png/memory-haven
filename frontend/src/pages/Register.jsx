import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'

export default function Register() {
  const navigate = useNavigate()
  const { darkMode } = useTheme()
  const [searchParams] = useSearchParams()
  const aCode = !!searchParams.get('code')

  const [form, setForm] = useState({
    nom: '', prenom: '', email: searchParams.get('email') || '',
    password: '', nom_famille: '', code: searchParams.get('code') || ''
  })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const styles = {
    page: { minHeight: '100vh', display: 'flex', fontFamily: 'sans-serif' },
    left: { flex: 1, background: darkMode ? '#0f3460' : '#3D2410', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' },
    leftContent: { maxWidth: '400px' },
    bigLogo: { fontSize: '56px', marginBottom: '16px' },
    bigTitre: { fontSize: '32px', color: darkMode ? '#e0e0e0' : '#FDF6EE', fontFamily: 'Georgia,serif', margin: '0 0 16px' },
    bigDesc: { fontSize: '15px', color: darkMode ? '#a0a0a0' : '#C8956C', lineHeight: '1.7', marginBottom: '2rem' },
    features: { display: 'flex', flexDirection: 'column', gap: '12px' },
    feature: { fontSize: '14px', color: darkMode ? '#e0e0e0' : '#E8C9A0' },
    right: { flex: 1, background: darkMode ? '#1a1a2e' : '#FDF6EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
    card: { background: darkMode ? '#16213e' : '#FFF', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' },
    cardTitre: { fontSize: '22px', color: darkMode ? '#e0e0e0' : '#3D2410', fontFamily: 'Georgia,serif', margin: '0 0 6px' },
    cardDesc: { fontSize: '13px', color: darkMode ? '#a0a0a0' : '#7A5035', marginBottom: '1.5rem' },
    codeBox: { background: '#EAF3DE', border: '1px solid #97C459', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#27500A', marginBottom: '1.25rem' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    champ: { marginBottom: '14px' },
    label: { display: 'block', fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A5035', marginBottom: '5px', fontWeight: '500' },
    input: { width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1.5px solid ${darkMode ? '#e94560' : '#E8C9A0'}`, fontSize: '14px', background: darkMode ? '#1a1a2e' : '#FFF9F3', color: darkMode ? '#e0e0e0' : '#3D2410', outline: 'none', boxSizing: 'border-box' },
    erreur: { background: '#FCEBEB', color: '#A32D2D', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
    btn: { width: '100%', padding: '12px', background: '#9B6240', color: '#FFF', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', marginTop: '4px' },
    btnDisabled: { width: '100%', padding: '12px', background: '#C8956C', color: '#FFF', border: 'none', borderRadius: '10px', fontSize: '15px', cursor: 'not-allowed', marginTop: '4px' },
    divider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '1.25rem 0' },
    dividerLine: { flex: 1, height: '1px', background: darkMode ? '#e94560' : '#E8C9A0' },
    dividerText: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#B08060' },
    lien: { textAlign: 'center', fontSize: '13px', color: darkMode ? '#a0a0a0' : '#7A5035', marginTop: '1.25rem' },
    linkText: { color: '#9B6240', fontWeight: '500', textDecoration: 'none' }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')

    try {
      let reponse
      if (aCode) {
        reponse = await api.post('/auth/rejoindre', {
          nom: form.nom, prenom: form.prenom, email: form.email,
          password: form.password, code: form.code
        })
      } else {
        reponse = await api.post('/auth/inscription', {
          nom: form.nom, prenom: form.prenom, email: form.email,
          password: form.password, nom_famille: form.nom_famille
        })
      }
      localStorage.setItem('token', reponse.data.token)
      localStorage.setItem('utilisateur', JSON.stringify(reponse.data.utilisateur))
      navigate('/dashboard')
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.bigLogo}>🏡</div>
          <h1 style={styles.bigTitre}>Memory Haven</h1>
          <p style={styles.bigDesc}>Préservez les souvenirs de votre famille pour les générations futures.</p>
          <div style={styles.features}>
            <div style={styles.feature}>📷 Photos et vidéos de famille</div>
            <div style={styles.feature}>🎙️ Enregistrements audio précieux</div>
            <div style={styles.feature}>🌳 Arbre généalogique interactif</div>
            <div style={styles.feature}>👪 Partage privé entre membres</div>
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.cardTitre}>{aCode ? 'Rejoindre la famille' : 'Créer mon espace famille'}</h2>
          <p style={styles.cardDesc}>{aCode ? 'Tu as été invité à rejoindre un espace famille' : 'Commencez à préserver vos souvenirs aujourd\'hui'}</p>

          {aCode && <div style={styles.codeBox}>Code d'invitation : <strong>{form.code}</strong></div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.row}>
              <div style={styles.champ}>
                <label style={styles.label}>Prénom</label>
                <input name="prenom" value={form.prenom} onChange={handleChange} placeholder="Afi" style={styles.input} required />
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>Nom</label>
                <input name="nom" value={form.nom} onChange={handleChange} placeholder="Koffi" style={styles.input} required />
              </div>
            </div>
            <div style={styles.champ}>
              <label style={styles.label}>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="votre@email.com" style={styles.input} required />
            </div>
            <div style={styles.champ}>
              <label style={styles.label}>Mot de passe</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 caractères" style={styles.input} required />
            </div>
            {!aCode && (
              <div style={styles.champ}>
                <label style={styles.label}>Nom de votre famille</label>
                <input name="nom_famille" value={form.nom_famille} onChange={handleChange} placeholder="Ex: Famille Koffi" style={styles.input} required />
              </div>
            )}
            {erreur && <p style={styles.erreur}>{erreur}</p>}
            <button type="submit" style={loading ? styles.btnDisabled : styles.btn} disabled={loading}>
              {loading ? 'Création...' : (aCode ? 'Rejoindre la famille' : 'Créer mon compte')}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>ou</span>
            <span style={styles.dividerLine}></span>
          </div>

          <p style={styles.lien}>Déjà un compte ? <Link to="/login" style={styles.linkText}>Se connecter</Link></p>
        </div>
      </div>
    </div>
  )
}