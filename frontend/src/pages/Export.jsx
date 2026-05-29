import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import html2pdf from 'html2pdf.js'
import { useTheme } from '../context/ThemeContext'

export default function Export() {
  const navigate = useNavigate()
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const { darkMode } = useTheme()
  
  const [souvenirs, setSouvenirs] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)
  const [exportsRecents, setExportsRecents] = useState([])

  useEffect(() => {
    chargerSouvenirs()
    chargerExportsRecents()
  }, [])

  const chargerSouvenirs = async () => {
    try {
      setLoading(true)
      const rep = await api.get('/souvenirs')
      setSouvenirs(rep.data.data)
    } catch (err) {
      console.error('Erreur chargement souvenirs:', err)
    } finally {
      setLoading(false)
    }
  }

  const chargerExportsRecents = () => {
    const saved = localStorage.getItem('exportsRecents')
    if (saved) {
      setExportsRecents(JSON.parse(saved))
    }
  }

  const sauvegarderExport = (nom, type) => {
    const nouveau = {
      id: Date.now(),
      nom,
      type,
      date: new Date().toISOString(),
      taille: `${Math.floor(Math.random() * 10) + 1}.${Math.random() > 0.5 ? 'MB' : 'KB'}`
    }
    const misAJour = [nouveau, ...exportsRecents].slice(0, 5)
    setExportsRecents(misAJour)
    localStorage.setItem('exportsRecents', JSON.stringify(misAJour))
  }

  const exporterPDF = async () => {
    setExporting('pdf')
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Souvenirs - ${utilisateur.famille}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #5B4D9E; text-align: center; border-bottom: 2px solid #C5B8E0; padding-bottom: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .date-export { color: #4A4568; font-size: 12px; margin-top: 5px; }
          .souvenir { border: 1px solid #C5B8E0; border-radius: 10px; margin-bottom: 20px; padding: 15px; page-break-inside: avoid; }
          .souvenir-title { font-size: 18px; font-weight: bold; color: #2A2640; margin-bottom: 5px; }
          .souvenir-meta { font-size: 12px; color: #7A7394; margin-bottom: 10px; }
          .souvenir-description { font-size: 14px; line-height: 1.5; margin-bottom: 10px; }
          .souvenir-lieu { font-size: 12px; color: #4A4568; margin-bottom: 5px; }
          .souvenir-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
          .tag { background: #C8B8DC; color: #4A4568; font-size: 11px; padding: 2px 8px; border-radius: 10px; }
          .footer { text-align: center; font-size: 11px; color: #7A7394; margin-top: 30px; border-top: 1px solid #C5B8E0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏡 Souvenirs de ${utilisateur.famille}</h1>
          <div class="date-export">Exporté le ${new Date().toLocaleDateString('fr-FR')}</div>
        </div>
        ${souvenirs.map(s => `
          <div class="souvenir">
            <div class="souvenir-title">${s.titre}</div>
            <div class="souvenir-meta">
              📅 ${new Date(s.date_souvenir).toLocaleDateString('fr-FR')}
              ${s.auteur ? ` · 👤 ${s.auteur.prenom} ${s.auteur.nom}` : ''}
            </div>
            ${s.description ? `<div class="souvenir-description">${s.description}</div>` : ''}
            ${s.lieu ? `<div class="souvenir-lieu">📍 ${s.lieu}</div>` : ''}
            ${s.tags && s.tags.length > 0 ? `
              <div class="souvenir-tags">
                ${s.tags.map(t => `<span class="tag">#${t.tag?.libelle || t}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
        <div class="footer">Généré par Memory Haven · ${souvenirs.length} souvenirs</div>
      </body>
      </html>
    `

    const element = document.createElement('div')
    element.innerHTML = html

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `souvenirs_${utilisateur.famille.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(element).save()
    sauvegarderExport(`souvenirs_${utilisateur.famille}.pdf`, 'PDF')
    setExporting(null)
  }

  const exporterCSV = () => {
    setExporting('csv')
    
    const headers = ['Titre', 'Type', 'Date', 'Lieu', 'Description', 'Tags', 'Auteur']
    const rows = souvenirs.map(s => [
      s.titre,
      s.type,
      new Date(s.date_souvenir).toLocaleDateString('fr-FR'),
      s.lieu || '',
      s.description || '',
      s.tags?.map(t => t.tag?.libelle || t).join(', ') || '',
      s.auteur ? `${s.auteur.prenom} ${s.auteur.nom}` : ''
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n')
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute('download', `souvenirs_${utilisateur.famille}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    sauvegarderExport(`souvenirs_${utilisateur.famille}.csv`, 'CSV')
    setExporting(null)
  }

  const exporterJSON = () => {
    setExporting('json')
    
    const data = souvenirs.map(s => ({
      id: s.id,
      titre: s.titre,
      type: s.type,
      date: s.date_souvenir,
      lieu: s.lieu,
      description: s.description,
      tags: s.tags?.map(t => t.tag?.libelle || t),
      auteur: s.auteur ? { prenom: s.auteur.prenom, nom: s.auteur.nom } : null
    }))
    
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute('download', `souvenirs_${utilisateur.famille}_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    sauvegarderExport(`souvenirs_${utilisateur.famille}.json`, 'JSON')
    setExporting(null)
  }

  const styles = {
    page: { minHeight: '100vh', background: darkMode ? '#1E1C2C' : '#E8E2F4', fontFamily: 'sans-serif' },
    nav: { background: darkMode ? '#16213e' : '#2A2640', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { color: darkMode ? '#e0e0e0' : '#F5F0FA', fontSize: '18px', fontFamily: 'Georgia,serif', fontWeight: '500', flex: 1 },
    navLinks: { display: 'flex', gap: '6px' },
    navBtn: { background: 'none', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#F5F0FA', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    navBtnActive: { background: '#7B6BB8', color: '#2A2640', borderColor: '#7B6BB8', fontWeight: '500' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    navAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#7B6BB8', color: '#2A2640', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' },
    btnLogout: { background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#F5F0FA', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    app: { display: 'flex', minHeight: 'calc(100vh - 56px)' },
    sidebar: { width: '200px', background: darkMode ? '#221F32' : '#C8B8DC', borderRight: `1px solid ${darkMode ? '#1E1C2C' : '#C5B8E0'}`, padding: '.75rem', flexShrink: 0 },
    sideLabel: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: darkMode ? '#a0a0a0' : '#7A7394', fontWeight: '500', marginBottom: '5px', marginTop: '12px' },
    sideItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', color: darkMode ? '#e0e0e0' : '#4A4568', fontSize: '13px', marginBottom: '2px' },
    sideItemActive: { background: darkMode ? '#e94560' : '#7B6BB8', color: '#FFF', fontWeight: '500' },
    main: { flex: 1, padding: '1.5rem', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' },
    titre: { fontSize: '22px', color: darkMode ? '#e0e0e0' : '#2A2640', fontFamily: 'Georgia,serif', margin: '0 0 3px' },
    sousTitre: { fontSize: '13px', color: darkMode ? '#a0a0a0' : '#4A4568', margin: 0 },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' },
    statCard: { background: darkMode ? '#16213e' : '#F8F6FC', border: `1px solid ${darkMode ? '#e94560' : '#C5B8E0'}`, borderRadius: '12px', padding: '1rem', textAlign: 'center' },
    statNum: { fontFamily: 'Georgia,serif', fontSize: '28px', color: '#5B4D9E', display: 'block' },
    statLabel: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A7394', marginTop: '4px' },
    exportGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' },
    exportCard: { background: darkMode ? '#16213e' : '#F8F6FC', border: `1px solid ${darkMode ? '#e94560' : '#C5B8E0'}`, borderRadius: '12px', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' },
    exportIcon: { fontSize: '32px', marginBottom: '10px' },
    exportName: { fontSize: '14px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#2A2640', marginBottom: '4px' },
    exportDesc: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A7394' },
    recentSection: { background: darkMode ? '#16213e' : '#F8F6FC', border: `1px solid ${darkMode ? '#e94560' : '#C5B8E0'}`, borderRadius: '12px', padding: '1.25rem', marginTop: '1.5rem' },
    recentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${darkMode ? '#e94560' : '#C5B8E0'}` },
    loading: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#4A4568' }
  }

  const initiales = (nom, prenom) => (prenom?.[0] || '') + (nom?.[0] || '')

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.navLogo}>🏡 Famille <span style={{ color: '#C5B8E0', fontStyle: 'italic' }}>{utilisateur.famille}</span></span>
        <div style={styles.navLinks}>
          <button style={styles.navBtn} onClick={() => navigate('/dashboard')}>Fil</button>
          <button style={styles.navBtn} onClick={() => navigate('/albums')}>Albums</button>
          <button style={styles.navBtn} onClick={() => navigate('/arbre')}>Arbre</button>
          <button style={styles.navBtn} onClick={() => navigate('/membres')}>Membres</button>
          <button style={styles.navBtn} onClick={() => navigate('/discussion')}>💬 Discussion</button>
          <button style={{ ...styles.navBtn, ...styles.navBtnActive }}>Export</button>
        </div>
        <div style={styles.navRight}>
          <div style={styles.navAvatar}>{initiales(utilisateur.nom, utilisateur.prenom)}</div>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('utilisateur'); navigate('/login') }} style={styles.btnLogout}>Déconnexion</button>
        </div>
      </nav>

      <div style={styles.app}>
        <div style={styles.sidebar}>
          <div style={styles.sideLabel}>Navigation</div>
          <div style={styles.sideItem} onClick={() => navigate('/dashboard')}>📄 Fil</div>
          <div style={styles.sideItem} onClick={() => navigate('/albums')}>📸 Albums</div>
          <div style={styles.sideItem} onClick={() => navigate('/arbre')}>🌳 Arbre</div>
          <div style={styles.sideItem} onClick={() => navigate('/membres')}>👪 Membres</div>
          <div style={{ ...styles.sideItem, ...styles.sideItemActive }}>📄 Export</div>
        </div>

        <div style={styles.main}>
          <div style={styles.header}>
            <h1 style={styles.titre}>📥 Exporter les souvenirs</h1>
          </div>

          <div style={styles.statsRow}>
            <div style={styles.statCard}><span style={styles.statNum}>{souvenirs.length}</span><div style={styles.statLabel}>Souvenirs</div></div>
            <div style={styles.statCard}><span style={styles.statNum}>{souvenirs.filter(s => s.type === 'PHOTO').length}</span><div style={styles.statLabel}>Photos</div></div>
            <div style={styles.statCard}><span style={styles.statNum}>{souvenirs.filter(s => s.type === 'AUDIO').length}</span><div style={styles.statLabel}>Audios</div></div>
            <div style={styles.statCard}><span style={styles.statNum}>{souvenirs.filter(s => s.type === 'VIDEO').length}</span><div style={styles.statLabel}>Vidéos</div></div>
          </div>

          <div style={styles.exportGrid}>
            <div style={styles.exportCard} onClick={exporterPDF}>
              <div style={styles.exportIcon}>📄</div>
              <div style={styles.exportName}>PDF</div>
              <div style={styles.exportDesc}>Livre illustré à imprimer</div>
              {exporting === 'pdf' && <span style={{ fontSize: '12px', color: '#5B4D9E' }}>⏳ Génération...</span>}
            </div>
            <div style={styles.exportCard} onClick={exporterCSV}>
              <div style={styles.exportIcon}>📊</div>
              <div style={styles.exportName}>CSV / Excel</div>
              <div style={styles.exportDesc}>Tableau des souvenirs</div>
              {exporting === 'csv' && <span style={{ fontSize: '12px', color: '#5B4D9E' }}>⏳ Génération...</span>}
            </div>
            <div style={styles.exportCard} onClick={exporterJSON}>
              <div style={styles.exportIcon}>📋</div>
              <div style={styles.exportName}>JSON</div>
              <div style={styles.exportDesc}>Données brutes</div>
              {exporting === 'json' && <span style={{ fontSize: '12px', color: '#5B4D9E' }}>⏳ Génération...</span>}
            </div>
          </div>

          {exportsRecents.length > 0 && (
            <div style={styles.recentSection}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#2A2640', marginBottom: '10px' }}>⏱️ Exports récents</div>
              {exportsRecents.map(exp => (
                <div key={exp.id} style={styles.recentItem}>
                  <span style={{ color: darkMode ? '#e0e0e0' : '#4A4568' }}>{exp.type === 'PDF' ? '📄' : exp.type === 'CSV' ? '📊' : '📋'} {exp.nom}</span>
                  <span style={{ color: darkMode ? '#a0a0a0' : '#7A7394', fontSize: '12px' }}>{new Date(exp.date).toLocaleDateString()} · {exp.taille}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}