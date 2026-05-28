import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const navigate = useNavigate()
  const { darkMode } = useTheme()
  const [form, setForm] = useState({ email: '', password: '' })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const styles = {
    page: { 
      minHeight: '100vh', 
      display: 'flex', 
      fontFamily: 'sans-serif',
      background: darkMode ? '#1a1a2e' : '#FDF6EE'
    },
    left: { 
      flex: 1, 
      background: darkMode ? '#0f3460' : '#3D2410', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem'
    },
    leftContent: { maxWidth: '350px' },
    bigLogo: { fontSize: '48px', marginBottom: '16px' },
    bigTitre: { fontSize: '28px', color: darkMode ? '#e0e0e0' : '#FDF6EE', fontFamily: 'Georgia,serif', margin: '0 0 16px' },
    bigDesc: { fontSize: '14px', color: darkMode ? '#a0a0a0' : '#C8956C', lineHeight: '1.6', marginBottom: '1.5rem' },
    features: { display: 'flex', flexDirection: 'column', gap: '10px' },
    feature: { fontSize: '13px', color: darkMode ? '#e0e0e0' : '#E8C9A0' },
    right: { 
      flex: 1, 
      background: darkMode ? '#1a1a2e' : '#FDF6EE', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '1.5rem'
    },
    card: { 
      background: darkMode ? '#16213e' : '#FFF', 
      borderRadius: '16px', 
      padding: '1.5rem', 
      width: '100%', 
      maxWidth: '380px', 
      maxHeight: '85vh',
      overflowY: 'auto',
      boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
    },
    cardTitre: { fontSize: '20px', color: darkMode ? '#e0e0e0' : '#3D2410', fontFamily: 'Georgia,serif', margin: '0 0 6px' },
    cardDesc: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A5035', marginBottom: '1rem' },
    champ: { marginBottom: '12px' },
    label: { display: 'block', fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A5035', marginBottom: '4px', fontWeight: '500' },
    input: { 
      width: '100%', 
      padding: '8px 12px', 
      borderRadius: '8px', 
      border: `1px solid ${darkMode ? '#e94560' : '#E8C9A0'}`, 
      fontSize: '13px', 
      background: darkMode ? '#1a1a2e' : '#FFF9F3', 
      color: darkMode ? '#e0e0e0' : '#3D2410', 
      outline: 'none', 
      boxSizing: 'border-box' 
    },
    erreur: { background: '#FCEBEB', color: '#A32D2D', padding: '8px', borderRadius: '8px', fontSize: '12px', marginBottom: '10px' },
    btn: { width: '100%', padding: '10px', background: '#9B6240', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: '4px' },
    btnDisabled: { width: '100%', padding: '10px', background: '#C8956C', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'not-allowed', marginTop: '4px' },
    divider: { display: 'flex', alignItems: 'center', gap: '10px', margin: '1rem 0' },
    dividerLine: { flex: 1, height: '1px', background: darkMode ? '#e94560' : '#E8C9A0' },
    dividerText: { fontSize: '11px', color: darkMode ? '#a0a0a0' : '#B08060' },
    lien: { textAlign: 'center', fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A5035', margin: '0 0 1rem' },
    linkText: { color: '#9B6240', fontWeight: '500', textDecoration: 'none' },
    demoBox: { background: darkMode ? '#1a1a2e' : '#FFF9F3', border: `1px solid ${darkMode ? '#e94560' : '#E8C9A0'}`, borderRadius: '8px', padding: '10px', fontSize: '11px', color: darkMode ? '#a0a0a0' : '#B08060' }
  }

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || ''
    if (apiUrl.includes('onrender.com')) {
      setErreur(
        'Mauvaise API (Render). Utilisez https://memory-haven-frontend.vercel.app puis Ctrl+F5.'
      )
    }
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')

    try {
      const reponse = await api.post('/auth/connexion', form)
      localStorage.setItem('token', reponse.data.token)
      localStorage.setItem('utilisateur', JSON.stringify(reponse.data.utilisateur))
      navigate('/dashboard')
    } catch (err) {
      if (!err.response) {
        const apiUrl = import.meta.env.VITE_API_URL || ''
        if (apiUrl.includes('onrender.com')) {
          setErreur('API Render hors service. Ouvrez https://memory-haven-frontend.vercel.app (Ctrl+F5).')
        } else {
          setErreur(err.userMessage || 'Serveur inaccessible. Vérifiez que l’API Railway est en ligne.')
        }
      } else {
        setErreur(err.userMessage || err.response?.data?.message || 'Email ou mot de passe incorrect')
      }
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
          <p style={styles.bigDesc}>Votre espace famille privé pour préserver et partager vos souvenirs.</p>
          <div style={styles.features}>
            <div style={styles.feature}>📷 Photos et vidéos</div>
            <div style={styles.feature}>🎙️ Enregistrements audio</div>
            <div style={styles.feature}>🌳 Arbre généalogique</div>
            <div style={styles.feature}>👪 Partage privé</div>
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.cardTitre}>Bon retour !</h2>
          <p style={styles.cardDesc}>Connectez-vous à votre espace famille</p>

          <form onSubmit={handleSubmit}>
            <div style={styles.champ}>
              <label style={styles.label}>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="votre@email.com" style={styles.input} required />
            </div>
            <div style={styles.champ}>
              <label style={styles.label}>Mot de passe</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" style={styles.input} required />
            </div>
            {erreur && <p style={styles.erreur}>{erreur}</p>}
            <button type="submit" style={loading ? styles.btnDisabled : styles.btn} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>ou</span>
            <span style={styles.dividerLine}></span>
          </div>

          <p style={styles.lien}>Pas encore de compte ? <Link to="/register" style={styles.linkText}>Créer un compte</Link></p>

          <div style={styles.demoBox}>
            <div><strong>Compte démo</strong></div>
            <div>📧 marie@demo.local</div>
            <div>🔑 demo1234</div>
            <button type="button" onClick={() => setForm({ email: 'marie@demo.local', password: 'demo1234' })} style={{ background: 'none', border: 'none', color: '#9B6240', cursor: 'pointer', fontSize: '11px', marginTop: '6px' }}>Utiliser ce compte</button>
          </div>
        </div>
      </div>
    </div>
  )
}