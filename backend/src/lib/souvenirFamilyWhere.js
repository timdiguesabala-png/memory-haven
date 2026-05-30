/**
 * Filtre souvenirs visibles pour un membre de famille.
 * Inclut les souvenirs dont l'auteur est dans la famille même si famille_id du souvenir est incorrect (anciennes données).
 */
function visibilitesPourRole(role) {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return ['FAMILLE', 'MEMBRES_PROCHES', 'ADMINS']
  }
  if (role === 'LECTEUR' || role === 'MEMBRE') {
    return ['FAMILLE', 'MEMBRES_PROCHES']
  }
  return ['FAMILLE']
}

function souvenirFamilyWhere(familleId, role = 'MEMBRE') {
  const id = Number(familleId)
  return {
    is_visible: true,
    is_active: true,
    visibilite: { in: visibilitesPourRole(role) },
    OR: [
      { famille_id: id },
      { auteur: { famille_id: id, is_active: true } }
    ]
  }
}

module.exports = { souvenirFamilyWhere, visibilitesPourRole }
