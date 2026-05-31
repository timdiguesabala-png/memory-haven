/** Champs profil étendu (parcours, métier) — utilisé par Mon compte */
export function profilFromUtilisateur(u = {}) {
  return {
    prenom: u.prenom || '',
    nom: u.nom || '',
    email: u.email || '',
    biographie: u.biographie || '',
    interets: Array.isArray(u.interets) ? u.interets.join(', ') : u.interets || '',
    ville_actuelle: u.ville_actuelle || '',
    lieu_naissance: u.lieu_naissance || '',
    latitude: u.latitude ?? '',
    longitude: u.longitude ?? '',
    parcours_scolaire: u.parcours_scolaire || '',
    parcours_professionnel: u.parcours_professionnel || '',
    metier_actuel: u.metier_actuel || '',
    activite_actuelle: u.activite_actuelle || '',
    description_metier: u.description_metier || ''
  }
}

export function membreAProfilRempli(membre) {
  return !!(
    membre?.metier_actuel ||
    membre?.activite_actuelle ||
    membre?.parcours_scolaire ||
    membre?.parcours_professionnel ||
    membre?.description_metier ||
    membre?.biographie
  )
}
