function parseJsonList(raw) {
  try {
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function parseReseauxSociaux(raw) {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function serializeUtilisateur(utilisateur, familleNom) {
  const interets = parseJsonList(utilisateur.interets)
  const langues = parseJsonList(utilisateur.langues)
  return {
    id: utilisateur.id,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    email: utilisateur.email,
    role: utilisateur.role,
    famille_id: utilisateur.famille_id,
    famille: familleNom ?? utilisateur.famille?.nom ?? null,
    code_invitation: utilisateur.famille?.code_invitation ?? utilisateur.code_invitation ?? null,
    avatar_url: utilisateur.avatar_url ?? null,
    biographie: utilisateur.biographie ?? null,
    bibliographie: utilisateur.bibliographie ?? null,
    interets,
    parcours_scolaire: utilisateur.parcours_scolaire ?? null,
    parcours_professionnel: utilisateur.parcours_professionnel ?? null,
    metier_actuel: utilisateur.metier_actuel ?? null,
    activite_actuelle: utilisateur.activite_actuelle ?? null,
    description_metier: utilisateur.description_metier ?? null,
    langues,
    telephone: utilisateur.telephone ?? null,
    date_naissance: utilisateur.date_naissance ?? null,
    lieu_vie: utilisateur.lieu_vie ?? null,
    formations_competences: utilisateur.formations_competences ?? null,
    nom_complet: utilisateur.nom_complet ?? null,
    reseaux_sociaux: parseReseauxSociaux(utilisateur.reseaux_sociaux),
    lieu_residence_ancien: utilisateur.lieu_residence_ancien ?? null,
    place_famille: utilisateur.place_famille ?? null,
    relations_famille: utilisateur.relations_famille ?? null,
    filiation: utilisateur.filiation ?? null,
    diplome_bac: utilisateur.diplome_bac ?? null,
    ville_actuelle: utilisateur.ville_actuelle ?? null,
    lieu_naissance: utilisateur.lieu_naissance ?? null,
    latitude: utilisateur.latitude ?? null,
    longitude: utilisateur.longitude ?? null,
    lat_naissance: utilisateur.lat_naissance ?? null,
    lng_naissance: utilisateur.lng_naissance ?? null,
    couverture_url: utilisateur.couverture_url ?? null,
    theme_pref: utilisateur.theme_pref ?? 'heritage',
    confort_mode: utilisateur.confort_mode ?? false,
    totp_enabled: utilisateur.totp_enabled ?? false
  }
}

function isAllowedAvatarUrl(url) {
  if (!url || typeof url !== 'string' || url.length > 2048) return false
  return (
    /^https:\/\//.test(url) &&
    (url.includes('res.cloudinary.com') ||
      url.includes('cloudinary.com') ||
      url.includes('supabase.co/storage') ||
      url.includes('/uploads/'))
  )
}

module.exports = { serializeUtilisateur, isAllowedAvatarUrl }
