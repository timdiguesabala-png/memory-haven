export default function LivrePreview({ data, userFamille, printId = 'mh-livre-print' }) {
  if (!data) return null

  return (
    <div id={printId} className="mh-platform-card mh-livre-preview" style={{ background: '#fff', color: '#222' }}>
      <header className="mh-livre-preview-header">
        <h1 style={{ fontFamily: 'Georgia, serif', margin: 0 }}>{data.famille?.nom || userFamille}</h1>
        <p style={{ margin: '0.5rem 0 0', fontStyle: 'italic' }}>Livre de mémoire familiale</p>
        <p style={{ fontSize: '0.85rem' }}>
          Généré le {new Date(data.generatedAt).toLocaleDateString('fr-FR')}
        </p>
      </header>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#8b5a3c' }}>Souvenirs</h2>
        {(data.souvenirs || []).slice(0, 20).map((s) => (
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
        {(data.membres || []).slice(0, 15).map((m) => (
          <p key={m.id} style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
            <strong>{m.nom}</strong>
            {m.date_naissance && ` (${new Date(m.date_naissance).getFullYear()})`}
            {m.biographie && ` — ${m.biographie.slice(0, 80)}…`}
          </p>
        ))}
      </section>

      {(data.heritage || []).length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#8b5a3c' }}>Héritage</h2>
          {data.heritage.slice(0, 10).map((h) => (
            <div key={h.id} style={{ marginBottom: '0.75rem' }}>
              <strong>{h.titre}</strong>
              {h.contenu && <p style={{ fontSize: '0.88rem' }}>{h.contenu.slice(0, 200)}</p>}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
