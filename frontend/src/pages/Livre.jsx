import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { fetchLivreData } from '../lib/platformApi'
import { getStoredUser } from '../lib/userStorage'

export default function Livre() {
  const user = getStoredUser()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const generer = async () => {
    setLoading(true)
    try {
      const data = await fetchLivreData()
      setPreview(data)
    } catch {
      alert('Impossible de charger les données du livre. Vérifiez que l’API est à jour.')
    } finally {
      setLoading(false)
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
          <p>Générez un PDF avec photos, histoires et extraits de l&apos;arbre généalogique.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button type="button" className="mh-btn mh-btn-primary" onClick={generer} disabled={loading}>
            {loading ? 'Préparation…' : 'Préparer le livre'}
          </button>
          {preview && (
            <button type="button" className="mh-btn" onClick={exportPdf}>
              Télécharger PDF
            </button>
          )}
        </div>

        {preview && (
          <div id="mh-livre-print" className="mh-platform-card" style={{ background: '#fff', color: '#222' }}>
            <header style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #8b5a3c', paddingBottom: '1rem' }}>
              <h1 style={{ fontFamily: 'Georgia, serif', margin: 0 }}>{preview.famille?.nom || user.famille}</h1>
              <p style={{ margin: '0.5rem 0 0', fontStyle: 'italic' }}>Livre de mémoire familiale</p>
              <p style={{ fontSize: '0.85rem' }}>
                Généré le {new Date(preview.generatedAt).toLocaleDateString('fr-FR')}
              </p>
            </header>

            <section style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', color: '#8b5a3c' }}>Souvenirs</h2>
              {(preview.souvenirs || []).slice(0, 20).map((s) => (
                <div key={s.id} style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{s.titre}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                    {new Date(s.date_souvenir).getFullYear()} — {s.auteur?.prenom} {s.auteur?.nom}
                  </p>
                  {s.description && <p style={{ fontSize: '0.9rem' }}>{s.description.slice(0, 300)}</p>}
                </div>
              ))}
            </section>

            <section style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', color: '#8b5a3c' }}>Arbre généalogique</h2>
              {(preview.membres || []).slice(0, 15).map((m) => (
                <p key={m.id} style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>{m.nom}</strong>
                  {m.date_naissance && ` (${new Date(m.date_naissance).getFullYear()})`}
                  {m.biographie && ` — ${m.biographie.slice(0, 80)}…`}
                </p>
              ))}
            </section>

            {(preview.heritage || []).length > 0 && (
              <section>
                <h2 style={{ fontFamily: 'Georgia, serif', color: '#8b5a3c' }}>Héritage</h2>
                {preview.heritage.slice(0, 10).map((h) => (
                  <div key={h.id} style={{ marginBottom: '0.75rem' }}>
                    <strong>{h.titre}</strong>
                    {h.contenu && <p style={{ fontSize: '0.88rem' }}>{h.contenu.slice(0, 200)}</p>}
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
