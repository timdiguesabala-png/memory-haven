import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import LivrePreview from '../components/LivrePreview'
import { fetchLivreData, fetchLivres, saveLivre, deleteLivre } from '../lib/platformApi'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'
import { peutModifierContenuAuteur } from '../lib/contentOwnership'
import PlatformLocalNotice from '../components/PlatformLocalNotice'

export default function Livre() {
  const user = getStoredUser()
  const lectureSeule = !peutEcrire(user?.role)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [livres, setLivres] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [saveTitle, setSaveTitle] = useState('')

  const chargerListe = async () => {
    setLoadingList(true)
    try {
      setLivres(await fetchLivres())
    } catch {
      setLivres([])
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    chargerListe()
  }, [])

  const generer = async () => {
    setLoading(true)
    setSelectedId(null)
    try {
      const data = await fetchLivreData()
      setPreview(data)
      setSaveTitle(`Livre du ${new Date().toLocaleDateString('fr-FR')}`)
    } catch (err) {
      alert(err.userMessage || err.response?.data?.message || 'Impossible de charger les données du livre.')
    } finally {
      setLoading(false)
    }
  }

  const enregistrer = async () => {
    if (!preview) return
    try {
      await saveLivre({ titre: saveTitle.trim() || undefined, snapshot: preview })
      await chargerListe()
      alert('Livre enregistré.')
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Impossible d’enregistrer')
    }
  }

  const ouvrirLivre = (livre) => {
    setSelectedId(livre.id)
    setPreview(livre.snapshot)
    setSaveTitle(livre.titre)
  }

  const supprimerLivre = async (livre) => {
    if (!window.confirm(`Supprimer le livre « ${livre.titre} » ?`)) return
    try {
      await deleteLivre(livre.id)
      if (selectedId === livre.id) {
        setSelectedId(null)
        setPreview(null)
      }
      await chargerListe()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Impossible de supprimer')
    }
  }

  const exportPdf = async () => {
    if (!preview) return
    const el = document.getElementById('mh-livre-print')
    if (!el) return
    const html2pdf = (await import('html2pdf.js')).default
    html2pdf()
      .set({
        margin: 12,
        filename: `livre-famille-${user.famille || 'memory-haven'}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4' }
      })
      .from(el)
      .save()
  }

  return (
    <AppLayout activePath="/livre">
      <div className="mh-platform-page fade-in-up">
        <div className="mh-platform-hero">
          <h1>Livre familial</h1>
          <p>Générez, enregistrez et exportez un PDF avec photos, histoires et l&apos;arbre généalogique.</p>
        </div>
        <PlatformLocalNotice />

        <div className="mh-livre-toolbar">
          <button type="button" className="mh-btn mh-btn-primary" onClick={generer} disabled={loading}>
            {loading ? 'Préparation…' : 'Préparer un nouveau livre'}
          </button>
          {preview && (
            <>
              <button type="button" className="mh-btn" onClick={exportPdf}>
                Télécharger PDF
              </button>
              {!lectureSeule && (
                <button type="button" className="mh-btn mh-btn-secondary" onClick={enregistrer}>
                  Enregistrer ce livre
                </button>
              )}
              <button
                type="button"
                className="mh-btn mh-btn-secondary"
                onClick={() => {
                  setPreview(null)
                  setSelectedId(null)
                }}
              >
                Fermer l&apos;aperçu
              </button>
            </>
          )}
        </div>

        {!lectureSeule && preview && (
          <label className="mh-label mh-livre-save-title">
            Titre pour l&apos;enregistrement
            <input className="mh-input" value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} />
          </label>
        )}

        <h2 className="mh-section-subtitle">Mes livres enregistrés</h2>
        {loadingList ? (
          <p>Chargement…</p>
        ) : livres.length === 0 ? (
          <p className="mh-platform-card">Aucun livre enregistré. Préparez un livre puis cliquez « Enregistrer ».</p>
        ) : (
          <ul className="mh-livre-list">
            {livres.map((livre) => (
              <li key={livre.id} className="mh-platform-card mh-livre-list-item">
                <div>
                  <strong>{livre.titre}</strong>
                  <p className="mh-temoignage-meta">
                    Par {livre.auteur?.prenom} {livre.auteur?.nom} ·{' '}
                    {new Date(livre.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="mh-temoignage-actions">
                  <button type="button" className="mh-btn mh-btn-secondary" onClick={() => ouvrirLivre(livre)}>
                    Ouvrir
                  </button>
                  {peutModifierContenuAuteur(livre) && (
                    <button
                      type="button"
                      className="mh-btn mh-btn-ghost-danger"
                      onClick={() => supprimerLivre(livre)}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {preview && <LivrePreview data={preview} userFamille={user.famille} />}
      </div>
    </AppLayout>
  )
}
