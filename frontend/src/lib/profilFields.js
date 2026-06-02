/** Champs profil étendu — Mon compte, fiche membre */

export const RESEAU_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  tiktok: 'TikTok',
  autre: 'Autre'
}

function formatDateInput(value) {
  if (!value) return ''
  const s = String(value)
  return s.length >= 10 ? s.slice(0, 10) : s
}

function formatListField(value) {
  return Array.isArray(value) ? value.join(', ') : value || ''
}

export function parseReseauxSociaux(raw) {
  if (!raw) return {}
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch {
    return {}
  }
}

export function reseauxFromUtilisateur(u = {}) {
  const r = parseReseauxSociaux(u.reseaux_sociaux)
  return {
    facebook: r.facebook || '',
    instagram: r.instagram || '',
    linkedin: r.linkedin || '',
    twitter: r.twitter || '',
    tiktok: r.tiktok || '',
    autre: r.autre || ''
  }
}

export function reseauxToPayload(form) {
  const out = {}
  for (const key of Object.keys(RESEAU_LABELS)) {
    const v = String(form[key] || '').trim()
    if (v) out[key] = v.slice(0, 500)
  }
  return Object.keys(out).length ? out : null
}

export function profilFromUtilisateur(u = {}) {
  return {
    prenom: u.prenom || '',
    nom: u.nom || '',
    nom_complet: u.nom_complet || '',
    email: u.email || '',
    biographie: u.biographie || '',
    interets: formatListField(u.interets),
    langues: formatListField(u.langues),
    telephone: u.telephone || '',
    date_naissance: formatDateInput(u.date_naissance),
    lieu_vie: u.lieu_vie || '',
    ville_actuelle: u.ville_actuelle || '',
    lieu_naissance: u.lieu_naissance || '',
    lieu_residence_ancien: u.lieu_residence_ancien || '',
    place_famille: u.place_famille || '',
    relations_famille: u.relations_famille || '',
    filiation: u.filiation || '',
    diplome_bac: u.diplome_bac || '',
    ...reseauxFromUtilisateur(u),
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

export function libelleRole(role) {
  const map = {
    SUPER_ADMIN: 'Super administrateur',
    ADMIN: 'Administrateur',
    MEMBRE: 'Membre',
    LECTEUR: 'Lecteur (lecture seule)'
  }
  return map[role] || role || 'Membre'
}

/** Lignes { label, value, href? } pour affichage fiche */
export function buildFicheMembreLignes(membre) {
  const lignes = []
  const add = (label, value, href) => {
    const v = value != null ? String(value).trim() : ''
    if (v) lignes.push({ label, value: v, href })
  }

  add('Prénom', membre.prenom)
  add('Nom', membre.nom)
  if (membre.nom_complet && membre.nom_complet !== `${membre.prenom} ${membre.nom}`.trim()) {
    add('Nom complet / civil', membre.nom_complet)
  }
  add('Email', membre.email, membre.email ? `mailto:${membre.email}` : undefined)
  add('Téléphone', membre.telephone, membre.telephone ? `tel:${membre.telephone}` : undefined)
  add('Date de naissance', membre.date_naissance ? formatDateNaissance(membre.date_naissance) : '')
  add('Lieu de naissance', membre.lieu_naissance)
  add('Résidence actuelle', membre.ville_actuelle || membre.lieu_vie)
  add('Lieu de vie (détail)', membre.lieu_vie && membre.ville_actuelle ? membre.lieu_vie : null)
  add('Ancienne résidence', membre.lieu_residence_ancien)
  add('Rôle sur le compte', libelleRole(membre.role))
  add('Place dans la famille', membre.place_famille)
  add('Relations familiales', membre.relations_famille)
  add('Filiation', membre.filiation)
  if (membre.arbre_filiation) add('Lien arbre généalogique', membre.arbre_filiation)
  add('Langues', formatLangues(membre))
  add('Centres d\u2019int\u00e9r\u00eat', formatListField(membre.interets))
  add('Biographie', membre.biographie)
  add('Métier / profession', membre.metier_actuel)
  add('Activité actuelle', membre.activite_actuelle)
  add('Description du métier', membre.description_metier)
  add('Parcours scolaire', membre.parcours_scolaire)
  add('Baccalauréat & diplômes', membre.diplome_bac)
  add('Parcours professionnel', membre.parcours_professionnel)
  add('Formations & compétences', membre.formations_competences)

  const reseaux = parseReseauxSociaux(membre.reseaux_sociaux)
  for (const [key, label] of Object.entries(RESEAU_LABELS)) {
    const url = reseaux[key]
    if (url) {
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`
      lignes.push({ label, value: url, href })
    }
  }

  return lignes
}

export function membreAProfilRempli(membre) {
  return buildFicheMembreLignes(membre).length > 4
}
