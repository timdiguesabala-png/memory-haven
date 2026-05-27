import { useState } from 'react'

export default function RechercheAvancee({ onSearch, onClose }) {
  const [filters, setFilters] = useState({
    titre: '',
    description: '',
    type: 'TOUS',
    dateDebut: '',
    dateFin: '',
    lieu: '',
    tags: '',
    auteur: ''
  })

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(filters)
  }

  const resetFilters = () => {
    const reset = {
      titre: '', description: '', type: 'TOUS',
      dateDebut: '', dateFin: '', lieu: '', tags: '', auteur: ''
    }
    setFilters(reset)
    onSearch(reset)
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>🔍 Recherche avancée</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Titre</label>
              <input
                type="text"
                name="titre"
                value={filters.titre}
                onChange={handleChange}
                placeholder="Contient..."
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Type</label>
              <select name="type" value={filters.type} onChange={handleChange} style={styles.input}>
                <option value="TOUS">Tous</option>
                <option value="PHOTO">📷 Photo</option>
                <option value="AUDIO">🎙️ Audio</option>
                <option value="VIDEO">🎬 Vidéo</option>
                <option value="TEXTE">📝 Texte</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Date de début</label>
              <input
                type="date"
                name="dateDebut"
                value={filters.dateDebut}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Date de fin</label>
              <input
                type="date"
                name="dateFin"
                value={filters.dateFin}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Lieu</label>
              <input
                type="text"
                name="lieu"
                value={filters.lieu}
                onChange={handleChange}
                placeholder="Où ?"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Auteur</label>
              <input
                type="text"
                name="auteur"
                value={filters.auteur}
                onChange={handleChange}
                placeholder="Qui ?"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tags (séparés par des virgules)</label>
            <input
              type="text"
              name="tags"
              value={filters.tags}
              onChange={handleChange}
              placeholder="vacances, famille, anniversaire..."
              style={styles.input}
            />
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={resetFilters} style={styles.btnReset}>
              Réinitialiser
            </button>
            <button type="submit" style={styles.btnSearch}>
              🔍 Rechercher
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modal: {
    background: '#FFF9F3', borderRadius: '16px', padding: '1.5rem',
    width: '100%', maxWidth: '550px', border: '1px solid #E8C9A0'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { fontSize: '18px', color: '#3D2410', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#B08060' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { marginBottom: '12px' },
  label: { display: 'block', fontSize: '12px', color: '#7A5035', marginBottom: '4px', fontWeight: '500' },
  input: {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1.5px solid #E8C9A0', fontSize: '13px', background: '#FFF',
    outline: 'none', boxSizing: 'border-box'
  },
  actions: { display: 'flex', gap: '12px', marginTop: '16px' },
  btnReset: {
    flex: 1, padding: '10px', background: '#F5E6D3', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#7A5035'
  },
  btnSearch: {
    flex: 1, padding: '10px', background: '#9B6240', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#FFF', fontWeight: '500'
  }
}