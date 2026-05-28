function buildTokenPayload(utilisateur) {
  return {
    id: utilisateur.id,
    email: utilisateur.email,
    role: utilisateur.role,
    famille_id: utilisateur.famille_id,
    prenom: utilisateur.prenom,
    nom: utilisateur.nom
  }
}

function displayName(utilisateur) {
  if (!utilisateur) return 'Un membre'
  const prenom = utilisateur.prenom || ''
  const nom = utilisateur.nom || ''
  const full = `${prenom} ${nom}`.trim()
  return full || utilisateur.email || 'Un membre'
}

module.exports = { buildTokenPayload, displayName }
