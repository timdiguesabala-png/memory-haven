import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import NotificationBell from '../components/NotificationBell'
import CommentSection from '../components/CommentSection'
import { useTheme } from '../context/ThemeContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const { darkMode, setDarkMode } = useTheme()

  const [souvenirs, setSouvenirs] = useState([])
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreType, setFiltreType] = useState('TOUS')
  const [commentairesOuverts, setCommentairesOuverts] = useState({})
  const [reactions, setReactions] = useState({})
  const [recherche, setRecherche] = useState('')
  const [hoveredCard, setHoveredCard] = useState(null)
  
  const [imageViewer, setImageViewer] = useState({
    open: false,
    currentImage: null,
    currentIndex: 0,
    images: []
  })

  const openImageViewer = (souvenir, imageUrl) => {
    let allImages = []
    if (souvenir.fichier_url) allImages.push(souvenir.fichier_url)
    if (souvenir.fichiers_multiple && souvenir.fichiers_multiple.length > 0) {
      allImages = [...allImages, ...souvenir.fichiers_multiple]
    }
    
    const currentIndex = allImages.findIndex(url => url === imageUrl)
    
    setImageViewer({
      open: true,
      currentImage: imageUrl,
      currentIndex: currentIndex,
      images: allImages.map(url => ({ url, titre: souvenir.titre, id: souvenir.id }))
    })
  }

  const closeImageViewer = () => {
    setImageViewer({ open: false, currentImage: null, currentIndex: 0, images: [] })
  }

  const prevImage = () => {
    if (imageViewer.currentIndex > 0) {
      const newIndex = imageViewer.currentIndex - 1
      setImageViewer({
        ...imageViewer,
        currentImage: imageViewer.images[newIndex].url,
        currentIndex: newIndex
      })
    }
  }

  const nextImage = () => {
    if (imageViewer.currentIndex < imageViewer.images.length - 1) {
      const newIndex = imageViewer.currentIndex + 1
      setImageViewer({
        ...imageViewer,
        currentImage: imageViewer.images[newIndex].url,
        currentIndex: newIndex
      })
    }
  }

  const saveImage = async (url) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      const objectUrl = URL.createObjectURL(blob)
      link.href = objectUrl
      link.download = `memory_haven_${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
      alert('Image sauvegardée !')
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      alert('Impossible de sauvegarder l\'image')
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!imageViewer.open) return
      if (e.key === 'Escape') closeImageViewer()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageViewer.open, imageViewer.currentIndex, imageViewer.images])

  const styles = {
    page: {
      minHeight: '100vh',
      background: darkMode ? '#1a1a2e' : '#FDF6EE',
      fontFamily: "'Inter', sans-serif",
      transition: 'background 0.3s ease'
    },
    nav: {
      background: darkMode ? '#16213e' : '#3D2410',
      padding: '0 1.5rem',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.1)'
    },
    navLogo: {
      color: darkMode ? '#e0e0e0' : '#FDF6EE',
      fontSize: '20px',
      fontFamily: "'Playfair Display', serif",
      fontWeight: '600',
      flex: 1,
      letterSpacing: '-0.5px'
    },
    navLinks: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    navBtn: {
      background: 'none',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(253,246,238,0.2)'}`,
      color: darkMode ? '#e0e0e0' : '#FDF6EE',
      padding: '6px 14px',
      borderRadius: '40px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    themeToggle: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: darkMode ? '#e0e0e0' : '#FDF6EE',
      transition: 'transform 0.2s ease'
    },
    navAvatar: {
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #C8956C, #9B6240)',
      color: '#FFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'transform 0.2s ease'
    },
    navNom: { color: darkMode ? '#e0e0e0' : '#E8C9A0', fontSize: '12px', fontWeight: '500' },
    btnLogout: {
      background: 'transparent',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(253,246,238,0.2)'}`,
      color: darkMode ? '#e0e0e0' : '#FDF6EE',
      padding: '6px 14px',
      borderRadius: '40px',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'all 0.2s ease'
    },
    btnAdd: {
      background: 'linear-gradient(135deg, #9B6240, #6B3F20)',
      color: '#FFF',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '40px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    app: { display: 'flex', minHeight: 'calc(100vh - 60px)' },
    sidebar: {
      width: '260px',
      background: darkMode ? 'rgba(15,52,96,0.95)' : '#F5E6D3',
      borderRight: `1px solid ${darkMode ? 'rgba(233,69,96,0.2)' : '#E8C9A0'}`,
      padding: '1.25rem',
      flexShrink: 0,
      overflowY: 'auto',
      backdropFilter: 'blur(10px)'
    },
    sideLabel: {
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: darkMode ? '#a0a0a0' : '#B08060',
      fontWeight: '600',
      marginBottom: '10px',
      marginTop: '20px'
    },
    sideItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      borderRadius: '12px',
      cursor: 'pointer',
      color: darkMode ? '#e0e0e0' : '#7A5035',
      fontSize: '13px',
      fontWeight: '500',
      marginBottom: '4px',
      transition: 'all 0.2s ease'
    },
    sideItemActive: {
      background: `linear-gradient(135deg, ${darkMode ? '#e94560' : '#C8956C'}, ${darkMode ? '#c84b6c' : '#9B6240'})`,
      color: '#FFF',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    },
    sideBadge: {
      marginLeft: 'auto',
      background: darkMode ? '#e94560' : '#9B6240',
      color: '#FFF',
      fontSize: '10px',
      padding: '2px 8px',
      borderRadius: '20px',
      fontWeight: '600'
    },
    memberItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 12px',
      borderRadius: '10px',
      cursor: 'pointer',
      marginBottom: '4px',
      transition: 'background 0.2s ease'
    },
    mAvatar: {
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '600',
      flexShrink: 0,
      background: 'linear-gradient(135deg, #E8C9A0, #C8956C)',
      color: '#6B3F20'
    },
    mName: { fontSize: '12px', color: darkMode ? '#e0e0e0' : '#7A5035', flex: 1, fontWeight: '500' },
    mOnline: { width: '8px', height: '8px', borderRadius: '50%', background: '#7A9E5A', flexShrink: 0, boxShadow: '0 0 0 2px #FDF6EE' },
    main: { 
      flex: 1, 
      padding: '2rem',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    header: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '1.5rem', 
      flexWrap: 'wrap', 
      gap: '12px',
      width: '100%'
    },
    titre: { fontSize: '28px', color: darkMode ? '#e0e0e0' : '#3D2410', fontFamily: "'Playfair Display', serif", margin: 0, fontWeight: '600', letterSpacing: '-0.5px' },
    sousTitre: { fontSize: '13px', color: darkMode ? '#a0a0a0' : '#7A5035', marginTop: '4px' },
    searchBar: { display: 'flex', gap: '10px', marginBottom: '1.25rem', width: '100%' },
    searchInput: {
      flex: 1,
      padding: '12px 18px',
      borderRadius: '40px',
      border: `1px solid ${darkMode ? 'rgba(233,69,96,0.3)' : '#E8C9A0'}`,
      background: darkMode ? 'rgba(26,26,46,0.8)' : '#FFF',
      color: darkMode ? '#e0e0e0' : '#3D2410',
      outline: 'none',
      fontSize: '13px',
      transition: 'all 0.2s ease',
      backdropFilter: 'blur(10px)'
    },
    filters: { display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap', width: '100%' },
    chip: {
      padding: '6px 16px',
      borderRadius: '40px',
      border: `1px solid ${darkMode ? 'rgba(233,69,96,0.3)' : '#E8C9A0'}`,
      fontSize: '12px',
      cursor: 'pointer',
      color: darkMode ? '#e0e0e0' : '#7A5035',
      background: darkMode ? 'rgba(15,52,96,0.8)' : '#FFF9F3',
      transition: 'all 0.2s ease',
      fontWeight: '500'
    },
    chipActive: { background: 'linear-gradient(135deg, #9B6240, #6B3F20)', color: '#FFF', borderColor: 'transparent' },
    loading: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#7A5035' },
    vide: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#7A5035' },
    anneeLabel: {
      fontFamily: "'Playfair Display', serif",
      fontSize: '18px',
      color: darkMode ? '#e94560' : '#B08060',
      fontStyle: 'italic',
      padding: '1rem 0 0.75rem',
      borderTop: `1px solid ${darkMode ? 'rgba(233,69,96,0.3)' : '#E8C9A0'}`,
      marginTop: '12px',
      fontWeight: '500'
    },
    card: {
      background: darkMode ? 'rgba(22,33,62,0.95)' : '#FFF9F3',
      border: `1px solid ${darkMode ? 'rgba(233,69,96,0.2)' : '#E8C9A0'}`,
      borderRadius: '20px',
      padding: '1.25rem',
      marginBottom: '1rem',
      maxWidth: '600px',
      width: '100%',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(107,63,32,0.05)',
      animation: 'fadeIn 0.3s ease forwards'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    cardMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    avatar: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #E8C9A0, #C8956C)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '15px',
      color: '#6B3F20'
    },
    cardAuteur: {
      fontSize: '14px',
      fontWeight: '600',
      color: darkMode ? '#e0e0e0' : '#3D2410'
    },
    cardDate: {
      fontSize: '11px',
      color: darkMode ? '#a0a0a0' : '#B08060',
      marginTop: '2px'
    },
    typeBadge: {
      fontSize: '11px',
      padding: '4px 14px',
      borderRadius: '40px',
      fontWeight: '600',
      background: '#FFF0E0',
      color: '#8B5E30',
      border: 'none'
    },
    cardTitre: {
      fontSize: '17px',
      fontWeight: '600',
      color: darkMode ? '#e0e0e0' : '#3D2410',
      marginBottom: '8px',
      fontFamily: "'Playfair Display', serif"
    },
    cardDesc: {
      fontSize: '13px',
      color: darkMode ? '#a0a0a0' : '#7A5035',
      lineHeight: '1.6',
      marginBottom: '10px'
    },
    cardLieu: {
      fontSize: '12px',
      color: darkMode ? '#a0a0a0' : '#B08060',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    tagsContainer: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '10px'
    },
    tag: {
      background: darkMode ? 'rgba(233,69,96,0.15)' : '#F5E6D3',
      color: darkMode ? '#e94560' : '#7A5035',
      fontSize: '11px',
      padding: '4px 12px',
      borderRadius: '40px',
      border: 'none',
      fontWeight: '500'
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      paddingTop: '12px',
      borderTop: `1px solid ${darkMode ? 'rgba(233,69,96,0.2)' : '#F0DCC8'}`,
      flexWrap: 'wrap'
    },
    actionBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      color: darkMode ? '#a0a0a0' : '#B08060',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '40px',
      transition: 'all 0.2s ease',
      fontWeight: '500'
    },
    actionBtnActive: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      color: '#C06060',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '40px'
    },
    galleryContainer: {
      marginBottom: '12px',
      borderRadius: '16px',
      overflow: 'hidden',
      maxWidth: '100%'
    },
    galleryGrid: {
      display: 'grid',
      gap: '2px',
      backgroundColor: darkMode ? '#e94560' : '#E8C9A0',
      borderRadius: '16px',
      overflow: 'hidden'
    },
    galleryItem: {
      position: 'relative',
      cursor: 'pointer',
      aspectRatio: '1 / 1',
      overflow: 'hidden',
      backgroundColor: darkMode ? '#16213e' : '#F5E6D3'
    },
    galleryImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.3s ease',
      maxHeight: '280px'
    },
    galleryOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFF',
      fontSize: '20px',
      fontWeight: 'bold',
      backdropFilter: 'blur(4px)'
    },
    singleImage: {
      width: '100%',
      borderRadius: '16px',
      maxHeight: '380px',
      objectFit: 'cover',
      cursor: 'pointer',
      transition: 'transform 0.3s ease'
    },
    imageModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      cursor: 'pointer',
      animation: 'fadeIn 0.2s ease'
    },
    imageModalContent: {
      maxWidth: '90vw',
      maxHeight: '90vh',
      objectFit: 'contain',
      cursor: 'default'
    },
    navButton: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(255,255,255,0.15)',
      border: 'none',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      fontSize: '30px',
      cursor: 'pointer',
      color: '#FFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      transition: 'background 0.2s ease'
    },
    navButtonLeft: { left: '20px' },
    navButtonRight: { right: '20px' },
    closeButton: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(255,255,255,0.15)',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#FFF',
      backdropFilter: 'blur(10px)'
    },
    saveButton: {
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.7)',
      border: 'none',
      borderRadius: '40px',
      padding: '10px 18px',
      cursor: 'pointer',
      color: '#FFF',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backdropFilter: 'blur(10px)',
      fontWeight: '500'
    },
    imageCounter: {
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.6)',
      borderRadius: '40px',
      padding: '6px 14px',
      color: '#FFF',
      fontSize: '12px',
      backdropFilter: 'blur(10px)'
    }
  }

  // Fonction pour recharger les souvenirs
  const rechargerSouvenirs = () => {
    chargerSouvenirs()
  }

  useEffect(() => {
    chargerSouvenirs()
    chargerMembres()
    chargerReactions()
    
    // Écouter l'événement de rechargement depuis la page Ajouter
    window.addEventListener('reloadSouvenirs', rechargerSouvenirs)
    
    return () => {
      window.removeEventListener('reloadSouvenirs', rechargerSouvenirs)
    }
  }, [])

  const chargerSouvenirs = async () => {
    try {
      setLoading(true)
      const rep = await api.get('/souvenirs')
      console.log('Souvenirs chargés:', rep.data.data.length)
      setSouvenirs(rep.data.data)
    } catch (err) {
      console.error('Erreur souvenirs:', err)
    } finally {
      setLoading(false)
    }
  }

  const chargerMembres = async () => {
    try {
      const rep = await api.get('/membres')
      setMembres(rep.data.data.slice(0, 5))
    } catch (err) {
      console.error('Erreur membres:', err)
    }
  }

  const chargerReactions = async () => {
    try {
      const rep = await api.get('/souvenirs')
      const reactionsData = {}
      rep.data.data.forEach(s => {
        reactionsData[s.id] = s.reactions || []
      })
      setReactions(reactionsData)
    } catch (err) {
      console.error('Erreur chargement reactions:', err)
    }
  }

  const deconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('utilisateur')
    navigate('/login')
  }

  const reagir = async (souvenirId, type) => {
    try {
      await api.post(`/reactions/${souvenirId}`, { type })
      await chargerSouvenirs()
      await chargerReactions()
    } catch (err) {
      console.error('Erreur reaction:', err)
    }
  }

  const supprimerSouvenir = async (id) => {
    if (!window.confirm('Supprimer ce souvenir ?')) return
    try {
      await api.delete('/souvenirs/' + id)
      chargerSouvenirs()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const compterReactions = (souvenirId, type) => {
    const count = reactions[souvenirId]?.filter(r => r.type === type).length || 0
    return count > 0 ? count : ''
  }

  const getMaReaction = (souvenirId) => {
    return reactions[souvenirId]?.find(r => r.utilisateur_id === utilisateur.id)?.type
  }

  const filtrerSouvenirs = () => {
    let resultats = [...souvenirs]
    if (recherche.trim()) {
      const searchLower = recherche.toLowerCase()
      resultats = resultats.filter(s =>
        s.titre.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower) ||
        s.lieu?.toLowerCase().includes(searchLower)
      )
    }
    if (filtreType !== 'TOUS') {
      resultats = resultats.filter(s => s.type === filtreType)
    }
    return resultats
  }

  const souvenirsFiltres = filtrerSouvenirs()
  console.log('📦 Tous les souvenirs:', souvenirs)
console.log('🔍 Souvenirs filtrés:', souvenirsFiltres)
console.log('🏷️ Filtre actif:', filtreType)

  const grouperParAnnee = (liste) => {
    const groupes = {}
    console.log('📅 Groupes par année:', groupes)
    liste.forEach(s => {
      const annee = new Date(s.date_souvenir).getFullYear()
      if (!groupes[annee]) groupes[annee] = []
      groupes[annee].push(s)
    })
    return Object.entries(groupes).sort((a, b) => b[0] - a[0])
  }

  const initiales = (nom, prenom) => (prenom?.[0] || '') + (nom?.[0] || '')
  const getTypeLabel = (type) => {
    if (type === 'PHOTO') return '📷 Photo'
    if (type === 'AUDIO') return '🎙️ Audio'
    if (type === 'VIDEO') return '🎬 Vidéo'
    return '📝 Texte'
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.navLogo}>🏡 Famille <span style={{ color: '#E8C9A0', fontStyle: 'italic' }}>{utilisateur.famille}</span></span>
        <div style={styles.navLinks}>
          <button style={styles.navBtn} onClick={() => navigate('/dashboard')}>Fil</button>
          <button style={styles.navBtn} onClick={() => navigate('/albums')}>Albums</button>
          <button style={styles.navBtn} onClick={() => navigate('/arbre')}>Arbre</button>
          <button style={styles.navBtn} onClick={() => navigate('/membres')}>Membres</button>
          <button style={styles.navBtn} onClick={() => navigate('/discussion')}>💬 Discussion</button>
        </div>
        <div style={styles.navRight}>
          <NotificationBell />
          <button onClick={() => setDarkMode(!darkMode)} style={styles.themeToggle}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <div style={styles.navAvatar}>{initiales(utilisateur.nom, utilisateur.prenom)}</div>
          <span style={styles.navNom}>{utilisateur.prenom} {utilisateur.nom}</span>
          <button onClick={deconnecter} style={styles.btnLogout}>Déconnexion</button>
        </div>
      </nav>

      <div style={styles.app}>
        <div style={styles.sidebar}>
          <div style={styles.sideLabel}>Navigation</div>
          <div style={{ ...styles.sideItem, ...styles.sideItemActive }}>📄 Fil<span style={styles.sideBadge}>{souvenirs.length}</span></div>
          <div style={styles.sideItem} onClick={() => navigate('/albums')}>📸 Albums</div>
          <div style={styles.sideItem} onClick={() => navigate('/arbre')}>🌳 Arbre</div>
          <div style={styles.sideItem} onClick={() => navigate('/membres')}>👪 Membres</div>
          <div style={styles.sideItem} onClick={() => navigate('/discussion')}>💬 Discussion</div>

          <div style={styles.sideLabel}>En ligne</div>
          {membres.map(m => (
            <div key={m.id} style={styles.memberItem}>
              <div style={styles.mAvatar}>{initiales(m.nom, m.prenom)}</div>
              <span style={styles.mName}>{m.prenom} {m.nom[0]}.</span>
              <div style={styles.mOnline}></div>
            </div>
          ))}

          <div style={styles.sideLabel}>Filtrer</div>
          {[
            { type: 'PHOTO', label: 'Photos' },
            { type: 'AUDIO', label: 'Audios' },
            { type: 'VIDEO', label: 'Vidéos' },
            { type: 'TEXTE', label: 'Textes' }
          ].map(({ type, label }) => (
            <div key={type} style={filtreType === type ? { ...styles.sideItem, ...styles.sideItemActive } : styles.sideItem} onClick={() => setFiltreType(type === filtreType ? 'TOUS' : type)}>
              {label}
            </div>
          ))}
        </div>

        <div style={styles.main}>
          <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
            <div style={styles.header}>
              <div>
                <h1 style={styles.titre}>🏡 Nos souvenirs</h1>
                <p style={styles.sousTitre}>{utilisateur.famille} · {souvenirs.length} souvenir{souvenirs.length > 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => navigate('/ajouter')} style={styles.btnAdd}>
                + Ajouter un souvenir
              </button>
            </div>

            <div style={styles.searchBar}>
              <input
                type="text"
                placeholder="🔍 Rechercher un souvenir..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.filters}>
              {['TOUS', 'PHOTO', 'AUDIO', 'VIDEO', 'TEXTE'].map(type => (
                <span key={type} onClick={() => setFiltreType(type)} style={filtreType === type ? { ...styles.chip, ...styles.chipActive } : styles.chip}>
                  {type === 'TOUS' ? 'Tous' : type.charAt(0) + type.slice(1).toLowerCase() + 's'}
                </span>
              ))}
            </div>

            {loading ? (
              <div style={styles.loading}>Chargement...</div>
            ) : souvenirsFiltres.length === 0 ? (
              <div style={styles.vide}>
                <p>Aucun souvenir trouvé. Cliquez sur "+ Ajouter" pour commencer !</p>
              </div>
            ) : (
              grouperParAnnee(souvenirsFiltres).map(([annee, liste]) => (
                <div key={annee}>
                  <div style={styles.anneeLabel}>{annee}</div>
                  {liste.map((souvenir, idx) => (
                    <div 
                      key={souvenir.id} 
                      style={{
                        ...styles.card,
                        ...(hoveredCard === souvenir.id ? { transform: 'translateY(-4px)', boxShadow: darkMode ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 24px rgba(107,63,32,0.15)' } : {})
                      }}
                      onMouseEnter={() => setHoveredCard(souvenir.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div style={styles.cardHeader}>
                        <div style={styles.cardMeta}>
                          <div style={styles.avatar}>{souvenir.auteur?.prenom?.[0] || '?'}{souvenir.auteur?.nom?.[0] || ''}</div>
                          <div>
                            <div style={styles.cardAuteur}>{souvenir.auteur?.prenom || '?'} {souvenir.auteur?.nom || ''}</div>
                            <div style={styles.cardDate}>{new Date(souvenir.date_souvenir).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                          </div>
                        </div>
                        <span style={styles.typeBadge}>{getTypeLabel(souvenir.type)}</span>
                      </div>

                      <div style={styles.cardTitre}>{souvenir.titre}</div>
                      {souvenir.description && <div style={styles.cardDesc}>{souvenir.description}</div>}
                      {souvenir.lieu && <div style={styles.cardLieu}>📍 {souvenir.lieu}</div>}

                      {souvenir.type === 'PHOTO' && (souvenir.fichier_url || (souvenir.fichiers_multiple && souvenir.fichiers_multiple.length > 0)) && (
                        <div style={styles.galleryContainer}>
                          {(() => {
                            let allImages = []
                            if (souvenir.fichier_url) allImages.push(souvenir.fichier_url)
                            if (souvenir.fichiers_multiple && souvenir.fichiers_multiple.length > 0) {
                              allImages = [...allImages, ...souvenir.fichiers_multiple]
                            }
                            
                            const imageCount = allImages.length
                            const displayImages = allImages.slice(0, 4)
                            const remainingCount = imageCount - 4
                            
                            if (imageCount === 1) {
                              return (
                                <img 
                                  src={allImages[0]} 
                                  alt={souvenir.titre} 
                                  style={styles.singleImage}
                                  onClick={() => openImageViewer(souvenir, allImages[0])}
                                />
                              )
                            }
                            
                            let gridTemplate = '1fr'
                            if (imageCount === 2) gridTemplate = 'repeat(2, 1fr)'
                            if (imageCount === 3) gridTemplate = 'repeat(2, 1fr)'
                            if (imageCount >= 4) gridTemplate = 'repeat(2, 1fr)'
                            
                            return (
                              <div style={{ ...styles.galleryGrid, gridTemplateColumns: gridTemplate }}>
                                {displayImages.map((imgUrl, imgIdx) => (
                                  <div 
                                    key={imgIdx} 
                                    style={{
                                      ...styles.galleryItem,
                                      ...(imageCount === 3 && imgIdx === 0 ? { gridRow: 'span 2', aspectRatio: 'auto', height: '100%' } : {})
                                    }}
                                    onClick={() => openImageViewer(souvenir, imgUrl)}
                                  >
                                    <img 
                                      src={imgUrl} 
                                      alt={`${souvenir.titre} - ${imgIdx + 1}`} 
                                      style={styles.galleryImage}
                                    />
                                    {imgIdx === 3 && remainingCount > 0 && (
                                      <div style={styles.galleryOverlay}>
                                        +{remainingCount}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {souvenir.fichier_url && souvenir.type === 'AUDIO' && (
                        <audio controls style={{ width: '100%', marginBottom: '10px', borderRadius: '12px' }}><source src={souvenir.fichier_url} /></audio>
                      )}
                      {souvenir.fichier_url && souvenir.type === 'VIDEO' && (
                        <video controls style={{ width: '100%', borderRadius: '16px', marginBottom: '10px', maxHeight: '250px' }}><source src={souvenir.fichier_url} /></video>
                      )}

                      {souvenir.tags?.length > 0 && (
                        <div style={styles.tagsContainer}>
                          {souvenir.tags.map(t => (<span key={t.tag_id} style={styles.tag}>#{t.tag?.libelle || t}</span>))}
                        </div>
                      )}

                      <div style={styles.actions}>
                        <button onClick={() => reagir(souvenir.id, 'COEUR')} style={getMaReaction(souvenir.id) === 'COEUR' ? styles.actionBtnActive : styles.actionBtn}>
                          ❤️ {compterReactions(souvenir.id, 'COEUR')}
                        </button>
                        <button onClick={() => reagir(souvenir.id, 'LIKE')} style={getMaReaction(souvenir.id) === 'LIKE' ? styles.actionBtnActive : styles.actionBtn}>
                          👍 {compterReactions(souvenir.id, 'LIKE')}
                        </button>
                        <button onClick={() => reagir(souvenir.id, 'LARME')} style={getMaReaction(souvenir.id) === 'LARME' ? styles.actionBtnActive : styles.actionBtn}>
                          😢 {compterReactions(souvenir.id, 'LARME')}
                        </button>
                        <button onClick={() => reagir(souvenir.id, 'RIRE')} style={getMaReaction(souvenir.id) === 'RIRE' ? styles.actionBtnActive : styles.actionBtn}>
                          😄 {compterReactions(souvenir.id, 'RIRE')}
                        </button>

                        <button onClick={() => setCommentairesOuverts({ ...commentairesOuverts, [souvenir.id]: !commentairesOuverts[souvenir.id] })} style={styles.actionBtn}>
                          💬 {souvenir.commentaires?.length || 0}
                        </button>

                        {souvenir.auteur_id === utilisateur.id && (
                          <button onClick={() => supprimerSouvenir(souvenir.id)} style={{ ...styles.actionBtn, marginLeft: 'auto', color: '#C06060' }}>🗑️</button>
                        )}
                      </div>

                      {commentairesOuverts[souvenir.id] && (
                        <CommentSection souvenirId={souvenir.id} utilisateur={utilisateur} />
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {imageViewer.open && (
        <div style={styles.imageModal} onClick={closeImageViewer}>
          <button style={{ ...styles.closeButton }} onClick={closeImageViewer}>✕</button>
          
          {imageViewer.currentIndex > 0 && (
            <button 
              style={{ ...styles.navButton, ...styles.navButtonLeft }}
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >‹</button>
          )}
          
          <img 
            src={imageViewer.currentImage} 
            alt="Agrandie" 
            style={styles.imageModalContent}
            onClick={(e) => e.stopPropagation()}
          />
          
          {imageViewer.currentIndex < imageViewer.images.length - 1 && (
            <button 
              style={{ ...styles.navButton, ...styles.navButtonRight }}
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >›</button>
          )}
          
          <button 
            style={styles.saveButton}
            onClick={(e) => { e.stopPropagation(); saveImage(imageViewer.currentImage); }}
          >💾 Enregistrer</button>
          
          {imageViewer.images.length > 1 && (
            <div style={styles.imageCounter}>
              {imageViewer.currentIndex + 1} / {imageViewer.images.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}