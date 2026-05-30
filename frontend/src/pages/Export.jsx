import { useState, useEffect } from 'react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import { getStoredUser } from '../lib/userStorage'

export default function Export() {
  const utilisateur = getStoredUser()
  const [souvenirs, setSouvenirs] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    chargerSouvenirs()
  }, [])

  const chargerSouvenirs = async () => {
    try {
      setLoading(true)
      setErreur('')
      const rep = await api.get('/souvenirs')
      setSouvenirs(rep.data.data)
    } catch (err) {
      setErreur(err.userMessage || 'Impossible de charger les souvenirs')
    } finally {
      setLoading(false)
    }
  }

  const exporterHTML = async () => {
    setExporting('html')
    try {
      const rep = await api.get('/export/pdf', { responseType: 'text' })
      const w = window.open('', '_blank')
      if (!w) {
        alert('Autorisez les fenêtres popup pour afficher l\'export.')
        return
      }
      w.document.write(rep.data)
      w.document.close()
    } catch (err) {
      alert(err.userMessage || 'Erreur export HTML')
    } finally {
      setExporting(null)
    }
  }

  const exporterCSV = () => {
    setExporting('csv')
    const headers = ['Titre', 'Type', 'Date', 'Lieu', 'Description', 'Tags', 'Auteur']
    const rows = souvenirs.map((s) => [
      s.titre,
      s.type,
      new Date(s.date_souvenir).toLocaleDateString('fr-FR'),
      s.lieu || '',
      (s.description || '').replace(/\n/g, ' '),
      s.tags?.map((t) => t.tag?.libelle || t).join(', ') || '',
      s.auteur ? `${s.auteur.prenom} ${s.auteur.nom}` : ''
    ])
    const csvContent = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `souvenirs_${utilisateur.famille || 'famille'}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    setExporting(null)
  }

  const exporterJSON = () => {
    setExporting('json')
    const data = souvenirs.map((s) => ({
      id: s.id,
      titre: s.titre,
      type: s.type,
      date: s.date_souvenir,
      lieu: s.lieu,
      description: s.description,
      epingle: s.epingle,
      tags: s.tags?.map((t) => t.tag?.libelle || t),
      auteur: s.auteur ? { prenom: s.auteur.prenom, nom: s.auteur.nom } : null
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `souvenirs_${utilisateur.famille || 'famille'}_${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setExporting(null)
  }

  return (
    <AppLayout activePath="/export">
      <div className="mh-page-content">
        <header className="mh-feed-header">
          <h1 className="mh-title">📥 Exporter les souvenirs</h1>
          <p className="mh-subtitle">
            {souvenirs.length} souvenir{souvenirs.length > 1 ? 's' : ''} — {utilisateur.famille}
          </p>
        </header>

        {erreur && <div className="mh-form-alert">{erreur}</div>}

        {loading ? (
          <div className="mh-feed-loading">Chargement…</div>
        ) : (
          <>
            <div
              className="mh-stats-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}
            >
              <div className="mh-stat-card">
                <div className="mh-stat-num">{souvenirs.length}</div>
                <div className="mh-stat-label">Total</div>
              </div>
              <div className="mh-stat-card">
                <div className="mh-stat-num">{souvenirs.filter((s) => s.type === 'PHOTO').length}</div>
                <div className="mh-stat-label">Photos</div>
              </div>
              <div className="mh-stat-card">
                <div className="mh-stat-num">{souvenirs.filter((s) => s.type === 'VIDEO').length}</div>
                <div className="mh-stat-label">Vidéos</div>
              </div>
              <div className="mh-stat-card">
                <div className="mh-stat-num">{souvenirs.filter((s) => s.type === 'AUDIO').length}</div>
                <div className="mh-stat-label">Audios</div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '1rem'
              }}
            >
              <button type="button" className="mh-btn mh-btn-primary" style={{ padding: '1.25rem' }} onClick={exporterHTML} disabled={!!exporting}>
                📄 Page imprimable
                {exporting === 'html' && ' …'}
              </button>
              <button type="button" className="mh-btn" style={{ padding: '1.25rem' }} onClick={exporterCSV} disabled={!!exporting}>
                📊 CSV / Excel
                {exporting === 'csv' && ' …'}
              </button>
              <button type="button" className="mh-btn" style={{ padding: '1.25rem' }} onClick={exporterJSON} disabled={!!exporting}>
                📋 JSON
                {exporting === 'json' && ' …'}
              </button>
            </div>

            <p className="mh-subtitle" style={{ marginTop: '1.25rem' }}>
              L&apos;export « Page imprimable » s&apos;ouvre dans un nouvel onglet : utilisez Imprimer → Enregistrer en PDF du navigateur.
            </p>
          </>
        )}
      </div>
    </AppLayout>
  )
}
