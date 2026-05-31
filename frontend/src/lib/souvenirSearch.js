/** Filtre texte commun (fil, albums, sélecteur). */
export function souvenirMatchesSearch(souvenir, query) {
  if (!query?.trim()) return true
  const q = query.toLowerCase().trim()
  const auteur = `${souvenir.auteur?.prenom || ''} ${souvenir.auteur?.nom || ''}`.toLowerCase()
  return (
    souvenir.titre?.toLowerCase().includes(q) ||
    souvenir.description?.toLowerCase().includes(q) ||
    souvenir.lieu?.toLowerCase().includes(q) ||
    auteur.includes(q)
  )
}
