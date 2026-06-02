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

const FICHE_CHAMPS = [
  ['Prénom', (m) => m.prenom],
  ['Nom', (m) => m.nom],
  ['Nom complet / civil', (m) => m.nom_complet],
  ['Email', (m) => m.email, (m) => (m.email ? `mailto:${m.email}` : undefined)],
  ['Téléphone', (m) => m.telephone, (m) => (m.telephone ? `tel:${m.telephone}` : undefined)],
  ['Date de naissance', (m) => (m.date_naissance ? formatDateNaissance(m.date_naissance) : '')],
  ['Lieu de naissance', (m) => m.lieu_naissance],
  ['Résidence actuelle', (m) => m.ville_actuelle],
  ['Lieu de vie (détail)', (m) => m.lieu_vie],
  ['Ancienne résidence', (m) => m.lieu_residence_ancien],
  ['Rôle sur le compte', (m) => libelleRole(m.role)],
  ['Place dans la famille', (m) => m.place_famille],
  ['Relations familiales', (m) => m.relations_famille],
  ['Filiation', (m) => m.filiation],
  ['Lien arbre généalogique', (m) => m.arbre_filiation],
  ['Langues', (m) => formatLangues(m)],
  ['Centres d\u2019int\u00e9r\u00eat', (m) => formatListField(m.interets)],
  ['Biographie', (m) => m.biographie],
  ['Métier / profession', (m) => m.metier_actuel],
  ['Activité actuelle', (m) => m.activite_actuelle],
  ['Description du métier', (m) => m.description_metier],
  ['Parcours scolaire', (m) => m.parcours_scolaire],
  ['Baccalauréat & diplômes', (m) => m.diplome_bac],
  ['Parcours professionnel', (m) => m.parcours_professionnel],
  ['Formations & compétences', (m) => m.formations_competences]
]

/** Lignes { label, value, href?, empty? } pour affichage fiche */
export function buildFicheMembreLignes(membre, { includeEmpty = false } = {}) {
  const lignes = []
  const add = (label, value, href) => {
    const v = value != null ? String(value).trim() : ''
    if (v) lignes.push({ label, value: v, href })
    else if (includeEmpty) lignes.push({ label, value: '—', empty: true })
  }

  for (const row of FICHE_CHAMPS) {
    const [label, getter, hrefFn] = row
    const raw = getter(membre)
    if (label === 'Nom complet / civil') {
      const v = raw != null ? String(raw).trim() : ''
      const display = `${membre.prenom || ''} ${membre.nom || ''}`.trim()
      if (!v || v === display) {
        if (includeEmpty) lignes.push({ label, value: '—', empty: true })
        continue
      }
    }
    add(label, raw, hrefFn?.(membre))
  }

  const reseaux = parseReseauxSociaux(membre.reseaux_sociaux)
  for (const [key, label] of Object.entries(RESEAU_LABELS)) {
    const url = reseaux[key]
    if (url) {
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`
      lignes.push({ label, value: url, href })
    } else if (includeEmpty) {
      lignes.push({ label, value: '—', empty: true })
    }
  }

  return lignes
}

export function groupFicheLignesParSection(lignes) {
  const byLabel = Object.fromEntries(lignes.map((l) => [l.label, l]))
  const sections = [
    { title: 'Identité', keys: ['Prénom', 'Nom', 'Nom complet / civil', 'Email', 'Téléphone', 'Date de naissance'] },
    {
      title: 'Lieux de vie',
      keys: ['Lieu de naissance', 'Résidence actuelle', 'Lieu de vie (détail)', 'Ancienne résidence']
    },
    {
      title: 'Famille & relations',
      keys: [
        'Rôle sur le compte',
        'Place dans la famille',
        'Relations familiales',
        'Filiation',
        'Lien arbre généalogique'
      ]
    },
    {
      title: 'Parcours & profession',
      keys: [
        'Métier / profession',
        'Activité actuelle',
        'Description du métier',
        'Parcours scolaire',
        'Baccalauréat & diplômes',
        'Parcours professionnel',
        'Formations & compétences'
      ]
    },
    { title: 'À propos', keys: ['Biographie', 'Langues', 'Centres d\u2019int\u00e9r\u00eat'] },
    { title: 'Réseaux sociaux', keys: Object.values(RESEAU_LABELS) }
  ]
  return sections
    .map((s) => ({
      title: s.title,
      items: s.keys.map((k) => byLabel[k]).filter(Boolean)
    }))
    .filter((s) => s.items.length > 0)
}

export function membreAProfilRempli(membre) {
  return buildFicheMembreLignes(membre).length > 4
}
