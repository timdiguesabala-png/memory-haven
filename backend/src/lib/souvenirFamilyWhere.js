/**
 * Filtre souvenirs visibles pour un membre de famille.
 * Inclut les souvenirs dont l'auteur est dans la famille même si famille_id du souvenir est incorrect (anciennes données).
 */
function souvenirFamilyWhere(familleId) {
  const id = Number(familleId)
  return {
    is_visible: true,
    is_active: true,
    OR: [
      { famille_id: id },
      { auteur: { famille_id: id, is_active: true } }
    ]
  }
}

module.exports = { souvenirFamilyWhere }
