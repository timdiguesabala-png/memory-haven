function serializeUtilisateur(utilisateur, familleNom) {
  return {
    id: utilisateur.id,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    email: utilisateur.email,
    role: utilisateur.role,
    famille_id: utilisateur.famille_id,
    famille: familleNom ?? utilisateur.famille?.nom ?? null,
    avatar_url: utilisateur.avatar_url ?? null
  }
}

function isAllowedAvatarUrl(url) {
  if (!url || typeof url !== 'string' || url.length > 2048) return false
  return (
    /^https:\/\//.test(url) &&
    (url.includes('res.cloudinary.com') ||
      url.includes('cloudinary.com') ||
      url.includes('/uploads/'))
  )
}

module.exports = { serializeUtilisateur, isAllowedAvatarUrl }
