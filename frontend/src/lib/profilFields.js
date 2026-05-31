/** Champs profil étendu — utilisé par Mon compte et page Membres */
function formatDateInput(value) {
  if (!value) return ''
  const s = String(value)
  return s.length >= 10 ? s.slice(0, 10) : s
}

function formatListField(value) {
  return Array.isArray(value) ? value.join(', ') : value || ''
}

export function profilFromUtilisateur(u = {}) {
  return {
    prenom: u.prenom || '',
    nom: u.nom || '',
    email: u.email || '',
    biographie: u.biographie || '',
    interets: formatListField(u.interets),
    langues: formatListField(u.langues),
    telephone: u.telephone || '',
    date_naissance: formatDateInput(u.date_naissance),
    lieu_vie: u.lieu_vie || '',
    ville_actuelle: u.ville_actuelle || '',
    lieu_naissance: u.lieu_naissance || '',
    latitude: u.latitude ?? '',
    longitude: u.longitude ?? '',
    parcours_scolaire: u.parcours_scolaire || '',
    parcours_professionnel: u.parcours_professionnel || '',
    metier_actuel: u.metier_actuel || '',
    activite_actuelle: u.activite_actuelle || '',
    description_metier: u.description_metier || '',
    formations_competences: u.formations_competences || ''
  }
}

export function membreAProfilRempli(membre) {
  return !!(
    membre?.metier_actuel ||
    membre?.activite_actuelle ||
    membre?.parcours_scolaire ||
    membre?.parcours_professionnel ||
    membre?.description_metier ||
    membre?.formations_competences ||
    membre?.langues ||
    membre?.lieu_vie ||
    membre?.telephone ||
    membre?.date_naissance ||
    membre?.biographie
  )
}

export function formatLangues(membre) {
  if (!membre?.langues) return ''
  if (Array.isArray(membre.langues)) return membre.langues.join(', ')
  try {
    const parsed = JSON.parse(membre.langues)
    return Array.isArray(parsed) ? parsed.join(', ') : String(membre.langues)
  } catch {
    return String(membre.langues)
  }
}

export function formatDateNaissance(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return String(value)
  }
}
