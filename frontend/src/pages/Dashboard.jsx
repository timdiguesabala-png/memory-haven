import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import CommentSection from '../components/CommentSection'
import { useTheme } from '../context/ThemeContext'
import UserAvatar from '../components/UserAvatar'
import { parseSouvenirMedia } from '../lib/mediaUrl'
import SouvenirMediaGallery from '../components/SouvenirMediaGallery'
import { refreshCurrentUser } from '../services/profileApi'
import { getStoredUser } from '../lib/userStorage'
import { downloadMedia } from '../lib/downloadMedia'

export default function Dashboard() {
  const navigate = useNavigate()
  const [utilisateur, setUtilisateur] = useState(() => getStoredUser())
  const { darkMode } = useTheme()

  const [souvenirs, setSouvenirs] = useState([])
  const [membres, setMembres] = useState([])
  const [familleStats, setFamilleStats] = useState(null)
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
    const allImages = parseSouvenirMedia(souvenir).urls
    const currentIndex = allImages.findIndex((url) => url === imageUrl)
    setImageViewer({
      open: true,
      currentImage: imageUrl,
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      images: allImages.map((url) => ({ url, titre: souvenir.titre, id: souvenir.id }))
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

  const saveImage = (url, titre) => downloadMedia(url, titre || 'souvenir')

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
      background: darkMode ? '#1E1C2C' : '#E8E2F4',
      fontFamily: "'Inter', sans-serif",
      transition: 'background 0.3s ease'
    },
    nav: {
      background: darkMode ? '#1A1828' : '#2A2640',
      padding: '0 1.5rem',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(0,0,0,0.1)'
    },
    navLogo: {
      color: darkMode ? '#e0e0e0' : '#F5F0FA',
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
      color: darkMode ? '#e0e0e0' : '#F5F0FA',
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
      color: darkMode ? '#e0e0e0' : '#F5F0FA',
      transition: 'transform 0.2s ease'
    },
    navAvatar: {
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #7B6BB8, #5B4D9E)',
      color: '#FFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'transform 0.2s ease'
    },
    navNom: { color: darkMode ? '#e0e0e0' : '#C5B8E0', fontSize: '12px', fontWeight: '500' },
    btnLogout: {
      background: 'transparent',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(253,246,238,0.2)'}`,
      color: darkMode ? '#e0e0e0' : '#F5F0FA',
      padding: '6px 14px',
      borderRadius: '40px',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'all 0.2s ease'
    },
    btnAdd: {
      background: 'linear-gradient(135deg, #5B4D9E, #3D3268)',
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
      background: darkMode ? 'rgba(15,52,96,0.95)' : '#C8B8DC',
      borderRight: `1px solid ${darkMode ? 'rgba(233,69,96,0.2)' : '#C5B8E0'}`,
      padding: '1.25rem',
      flexShrink: 0,
      overflowY: 'auto'
    },
    sideLabel: {
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: darkMode ? '#a0a0a0' : '#7A7394',
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
      color: darkMode ? '#e0e0e0' : '#4A4568',
      fontSize: '13px',
      fontWeight: '500',
      marginBottom: '4px',
      transition: 'all 0.2s ease'
    },
    sideItemActive: {
      background: `linear-gradient(135deg, ${darkMode ? '#7B6BB8' : '#7B6BB8'}, ${darkMode ? '#c84b6c' : '#5B4D9E'})`,
      color: '#FFF',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    },
    sideBadge: {
      marginLeft: 'auto',
      background: darkMode ? '#7B6BB8' : '#5B4D9E',
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
      background: 'linear-gradient(135deg, #C5B8E0, #7B6BB8)',
      color: '#3D3268'
    },
    mName: { fontSize: '12px', color: darkMode ? '#e0e0e0' : '#4A4568', flex: 1, fontWeight: '500' },
    mOnline: { width: '8px', height: '8px', borderRadius: '50%', background: '#4E8A7A', flexShrink: 0, boxShadow: '0 0 0 2px #D4C6E8' },
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
    titre: { fontSize: '28px', color: darkMode ? '#e0e0e0' : '#2A2640', fontFamily: "'Playfair Display', serif", margin: 0, fontWeight: '600', letterSpacing: '-0.5px' },
    sousTitre: { fontSize: '13px', color: darkMode ? '#a0a0a0' : '#4A4568', marginTop: '4px' },
    searchBar: { display: 'flex', gap: '10px', marginBottom: '1.25rem', width: '100%' },
    searchInput: {
      flex: 1,
      padding: '12px 18px',
      borderRadius: '40px',
      border: `1px solid ${darkMode ? 'rgba(233,69,96,0.3)' : '#C5B8E0'}`,
      background: darkMode ? 'rgba(34, 31, 50, 0.55)' : 'rgba(255, 255, 255, 0.45)',
      color: darkMode ? '#e0e0e0' : '#2A2640',
      outline: 'none',
      fontSize: '13px',
      transition: 'all 0.2s ease'
    },
    filters: { display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap', width: '100%' },
    chip: {
      padding: '6px 16px',
      borderRadius: '40px',
      border: `1px solid ${darkMode ? 'rgba(233,69,96,0.3)' : '#C5B8E0'}`,
      fontSize: '12px',
      cursor: 'pointer',
      color: darkMode ? '#e0e0e0' : '#4A4568',
      background: darkMode ? 'rgba(34, 31, 50, 0.5)' : 'rgba(255, 255, 255, 0.38)',
      transition: 'all 0.2s ease',
      fontWeight: '500'
    },
    chipActive: { background: 'linear-gradient(135deg, #E8B4A0, #9B8EC4)', color: '#FFF', borderColor: 'transparent' },
    loading: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#4A4568' },
    vide: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#4A4568' },
    anneeLabel: {
      fontFamily: "'Playfair Display', serif",
      fontSize: '15px',
      color: darkMode ? '#7B6BB8' : '#7A7394',
      fontStyle: 'italic',
      padding: '0.65rem 0 0.5rem',
      borderTop: `1px solid ${darkMode ? 'rgba(233,69,96,0.3)' : '#C5B8E0'}`,
      marginTop: '12px',
      fontWeight: '500'
    },
    card: {
      background: darkMode ? 'rgba(34, 31, 50, 0.72)' : 'rgba(255, 255, 255, 0.42)',
      border: `1px solid ${darkMode ? 'rgba(233,69,96,0.2)' : '#C5B8E0'}`,
      borderRadius: '14px',
      padding: '0.85rem 1rem',
      marginBottom: '0.75rem',
      width: '100%',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(107,63,32,0.05)',
      animation: 'fadeIn 0.3s ease forwards'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
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
      background: 'linear-gradient(135deg, #C5B8E0, #7B6BB8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '15px',
      color: '#3D3268'
    },
    cardAuteur: {
      fontSize: '13px',
      fontWeight: '600',
      color: darkMode ? '#e0e0e0' : '#2A2640'
    },
    cardDate: {
      fontSize: '11px',
      color: darkMode ? '#a0a0a0' : '#7A7394',
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
      fontSize: '15px',
      fontWeight: '600',
      color: darkMode ? '#e0e0e0' : '#2A2640',
      marginBottom: '4px',
      fontFamily: "'Playfair Display', serif",
      lineHeight: 1.3
    },
    cardDesc: {
      fontSize: '12px',
      color: darkMode ? '#a0a0a0' : '#4A4568',
      lineHeight: '1.45',
      marginBottom: '6px'
    },
    cardLieu: {
      fontSize: '12px',
      color: darkMode ? '#a0a0a0' : '#7A7394',
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
      background: darkMode ? 'rgba(233,69,96,0.15)' : '#C8B8DC',
      color: darkMode ? '#7B6BB8' : '#4A4568',
      fontSize: '11px',
      padding: '4px 12px',
      borderRadius: '40px',
      border: 'none',
      fontWeight: '500'
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      paddingTop: '8px',
      borderTop: `1px solid ${darkMode ? 'rgba(233,69,96,0.2)' : '#F0DCC8'}`,
      flexWrap: 'wrap'
    },
    actionBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      color: darkMode ? '#a0a0a0' : '#7A7394',
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
      marginBottom: '6px',
      borderRadius: '4px',
      overflow: 'visible',
      maxWidth: '100%'
    },
    galleryGrid: {
      display: 'grid',
      gap: '2px',
      backgroundColor: 'transparent',
      borderRadius: '4px',
      overflow: 'visible'
    },
    galleryItem: {
      position: 'relative',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: 'rgba(0,0,0,0.15)',
      borderRadius: '3px'
    },
    galleryImage: {
      width: '100%',
      height: 'auto',
      maxHeight: '260px',
      objectFit: 'contain',
      transition: 'opacity 0.2s ease'
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
      fontWeight: 'bold'
    },
    singleImage: {
      width: '100%',
      borderRadius: '4px',
      maxHeight: '320px',
      height: 'auto',
      objectFit: 'contain',
      cursor: 'pointer',
      transition: 'opacity 0.2s ease',
      display: 'block'
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
      color: '#FFF'
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
      fontSize: '12px'
    }
  }

  // Fonction pour recharger les souvenirs
  const rechargerSouvenirs = () => {
    chargerSouvenirs()
  }

  useEffect(() => {
    const syncUser = (e) => setUtilisateur(e.detail || getStoredUser())
    window.addEventListener('mh-user-updated', syncUser)

    const init = async () => {
      try {
        const { utilisateur: u, famille_stats } = await refreshCurrentUser()
        setUtilisateur(u)
        setFamilleStats(famille_stats)
      } catch {
        /* profil local conservé */
      }
      chargerSouvenirs()
      chargerMembres()
      chargerReactions()
    }
    init()

    window.addEventListener('reloadSouvenirs', rechargerSouvenirs)
    return () => {
      window.removeEventListener('reloadSouvenirs', rechargerSouvenirs)
      window.removeEventListener('mh-user-updated', syncUser)
    }
  }, [])

  const chargerSouvenirs = async () => {
    try {
      setLoading(true)
      const rep = await api.get('/souvenirs')
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

  const grouperParAnnee = (liste) => {
    const groupes = {}
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

  const getTypeClass = (type) => {
    if (type === 'PHOTO') return 'mh-memory-type--photo'
    if (type === 'AUDIO') return 'mh-memory-type--audio'
    if (type === 'VIDEO') return 'mh-memory-type--video'
    return 'mh-memory-type--texte'
  }

  const getPostClass = (type) => {
    if (type === 'PHOTO') return 'mh-post--photo'
    if (type === 'AUDIO') return 'mh-post--audio'
    if (type === 'VIDEO') return 'mh-post--video'
    return 'mh-post--texte'
  }

  const FILTER_CHIPS = [
    { type: 'TOUS', label: 'Tous', icon: '✨' },
    { type: 'PHOTO', label: 'Photos', icon: '📷' },
    { type: 'AUDIO', label: 'Audios', icon: '🎵' },
    { type: 'VIDEO', label: 'Vidéos', icon: '🎬' },
    { type: 'TEXTE', label: 'Textes', icon: '📝' }
  ]

  return (
    <AppLayout
      activePath="/dashboard"
      sidebarBadges={{ dashboard: souvenirs.length }}
      sidebar={
        <>
          <div className="mh-side-label">En ligne</div>
          {membres.map((m) => (
            <div key={m.id} className="mh-member-row">
              <UserAvatar
                nom={m.nom}
                prenom={m.prenom}
                avatarUrl={m.avatar_url}
                size={28}
                className="mh-member-avatar"
              />
              <span className="mh-member-name">
                {m.prenom} {m.nom[0]}.
              </span>
              <span className="mh-member-online" />
            </div>
          ))}
        </>
      }
    >
          <div className="mh-feed mh-feed-layout">
            <header className="mh-feed-header">
              <div className="mh-feed-header-text">
                <h1 className="mh-title">🏡 Nos souvenirs</h1>
              </div>
              <div className="mh-feed-stats">
                <span className="mh-stat-pill mh-stat-pill--memories">
                  💜 {souvenirs.length} souvenir{souvenirs.length > 1 ? 's' : ''}
                </span>
                {familleStats?.membres != null && (
                  <span className="mh-stat-pill mh-stat-pill--members">
                    👥 {familleStats.membres} membre{familleStats.membres > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('/ajouter')}
                className="mh-btn mh-btn-primary mh-feed-add"
              >
                + Ajouter
              </button>
            </header>

            <div className="mh-feed-toolbar">
              <p className="mh-feed-toolbar-label">Rechercher</p>
              <div className="mh-search-bar">
                <span aria-hidden="true">🔍</span>
                <input
                  type="search"
                  placeholder="Titre, date, lieu, personne…"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
              <p className="mh-feed-toolbar-label">Filtrer par type</p>
              <div className="mh-feed-filters" role="tablist" aria-label="Filtrer par type">
                {FILTER_CHIPS.map(({ type, label, icon }) => (
                  <button
                    key={type}
                    type="button"
                    role="tab"
                    aria-selected={filtreType === type}
                    onClick={() => setFiltreType(type)}
                    className={`mh-chip mh-chip--${type.toLowerCase()} ${filtreType === type ? 'mh-chip--active' : ''}`}
                  >
                    <span aria-hidden="true">{icon}</span> {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="mh-feed-loading">Chargement des souvenirs…</div>
            ) : souvenirsFiltres.length === 0 ? (
              <div className="mh-form-alert mh-form-alert--warning" style={{ textAlign: 'left' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>
                  {souvenirs.length > 0 && filtreType !== 'TOUS'
                    ? `Aucun souvenir de type « ${filtreType} » — cliquez sur « Tous »`
                    : `Aucun souvenir visible pour « ${utilisateur.famille || 'votre famille'} »`}
                </p>
                {souvenirs.length === 0 && familleStats?.souvenirs > 0 ? (
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    La famille contient {familleStats.souvenirs} souvenir(s) mais votre session ne les
                    voit pas. Déconnectez-vous puis reconnectez-vous.
                  </p>
                ) : (
                  <>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
                      Tous les membres de la <strong>même famille</strong> voient les mêmes souvenirs
                      (y compris ceux publiés avant votre invitation).
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      Si vous ne voyez pas ceux d’un proche : vérifiez le <strong>code d’invitation</strong>{' '}
                      (menu Membres) et que vous utilisez le même site (
                      https://memory-haven-frontend.vercel.app).
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="mh-feed-list">
              {grouperParAnnee(souvenirsFiltres).map(([annee, liste]) => (
                <section key={annee} className="mh-feed-year">
                  <h2 className="mh-timeline-year">{annee}</h2>
                  {liste.map((souvenir) => (
                    <article
                      key={souvenir.id}
                      className={`memory-card mh-card mh-fb-post mh-mirror-surface ${getPostClass(souvenir.type)}`}
                    >
                      <header className="mh-post-head">
                        <UserAvatar
                          nom={souvenir.auteur?.nom}
                          prenom={souvenir.auteur?.prenom}
                          avatarUrl={souvenir.auteur?.avatar_url}
                          size={40}
                        />
                        <div className="mh-post-head-meta">
                          <p className="mh-post-author">
                            {souvenir.auteur?.prenom || '?'} {souvenir.auteur?.nom || ''}
                          </p>
                          <p className="mh-post-date">
                            <time dateTime={souvenir.date_souvenir}>
                              {new Date(souvenir.date_souvenir).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </time>
                            {souvenir.lieu && (
                              <span className="mh-post-date-lieu">📍 {souvenir.lieu}</span>
                            )}
                          </p>
                        </div>
                        <span className={`mh-memory-type mh-post-type ${getTypeClass(souvenir.type)}`}>
                          {getTypeLabel(souvenir.type)}
                        </span>
                      </header>

                      <div className="mh-fb-post-body mh-post-body-inner">
                      <h3 className="mh-post-title">{souvenir.titre}</h3>
                      {(() => {
                        const { cleanDescription, urls, layout } = parseSouvenirMedia(souvenir)
                        return (
                          <>
                      {cleanDescription && <p className="mh-post-desc">{cleanDescription}</p>}

                      {souvenir.type === 'PHOTO' && urls.length > 0 && (
                        <SouvenirMediaGallery
                          urls={urls}
                          layout={layout}
                          titre={souvenir.titre}
                          mediaKind="image"
                          onMediaClick={(url) => openImageViewer(souvenir, url)}
                        />
                      )}

                      {urls[0] && souvenir.type === 'AUDIO' && (
                        <audio controls style={{ width: '100%', marginBottom: '10px', borderRadius: '12px' }}>
                          <source src={urls[0]} />
                        </audio>
                      )}
                      {souvenir.type === 'VIDEO' && urls.length > 0 && (
                        <SouvenirMediaGallery
                          urls={urls}
                          layout={layout}
                          titre={souvenir.titre}
                          mediaKind="video"
                        />
                      )}
                          </>
                        )
                      })()}

                      {souvenir.tags?.length > 0 && (
                        <div style={styles.tagsContainer}>
                          {souvenir.tags.map(t => (
                            <span key={t.tag_id} className="mh-memory-tag">
                              #{t.tag?.libelle || t}
                            </span>
                          ))}
                        </div>
                      )}
                      </div>

                      <div className="mh-fb-actions" style={styles.actions}>
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

                        {(() => {
                          const { urls } = parseSouvenirMedia(souvenir)
                          return urls[0] ? (
                            <button
                              type="button"
                              onClick={() => downloadMedia(urls[0], souvenir.titre)}
                              style={styles.actionBtn}
                              title="Télécharger le fichier"
                            >
                              ⬇️ Télécharger
                            </button>
                          ) : null
                        })()}

                        {souvenir.auteur_id === utilisateur.id && (
                          <button type="button" onClick={() => supprimerSouvenir(souvenir.id)} style={{ ...styles.actionBtn, marginLeft: 'auto', color: '#C06060' }} title="Supprimer (auteur uniquement)">🗑️ Supprimer</button>
                        )}
                      </div>

                      {commentairesOuverts[souvenir.id] && (
                        <CommentSection souvenirId={souvenir.id} utilisateur={utilisateur} />
                      )}
                    </article>
                  ))}
                </section>
              ))}
              </div>
            )}
          </div>

      {imageViewer.open && (
        <div style={styles.imageModal} onClick={closeImageViewer}>
          <button type="button" style={styles.closeButton} onClick={closeImageViewer}>
            ✕
          </button>

          {imageViewer.currentIndex > 0 && (
            <button
              type="button"
              style={{ ...styles.navButton, ...styles.navButtonLeft }}
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
            >
              ‹
            </button>
          )}

          <img
            src={imageViewer.currentImage}
            alt="Agrandie"
            style={styles.imageModalContent}
            onClick={(e) => e.stopPropagation()}
          />

          {imageViewer.currentIndex < imageViewer.images.length - 1 && (
            <button
              type="button"
              style={{ ...styles.navButton, ...styles.navButtonRight }}
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
            >
              ›
            </button>
          )}

          <button
            type="button"
            style={styles.saveButton}
            onClick={(e) => {
              e.stopPropagation()
              saveImage(imageViewer.currentImage, 'souvenir')
            }}
          >
            💾 Enregistrer
          </button>

          {imageViewer.images.length > 1 && (
            <div style={styles.imageCounter}>
              {imageViewer.currentIndex + 1} / {imageViewer.images.length}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}