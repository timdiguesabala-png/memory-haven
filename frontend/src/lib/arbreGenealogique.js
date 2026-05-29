/** Helpers genre + construction de l'arbre par unions (mariages) */

export const GENRES = [
  { value: 'HOMME', label: 'Homme', icon: '♂' },
  { value: 'FEMME', label: 'Femme', icon: '♀' },
  { value: 'AUTRE', label: 'Autre', icon: '⚧' },
  { value: 'NON_PRECISE', label: 'Non précisé', icon: '○' }
]

export function iconeGenre(genre) {
  return GENRES.find((g) => g.value === genre)?.icon || '○'
}

export function libelleGenre(genre) {
  return GENRES.find((g) => g.value === genre)?.label || 'Non précisé'
}

export function afficherAnnees(membre) {
  const naissance = membre.date_naissance ? new Date(membre.date_naissance).getFullYear() : null
  const deces = membre.date_deces ? new Date(membre.date_deces).getFullYear() : null
  if (naissance && deces) return `${naissance} – ${deces}`
  if (naissance) {
    if (membre.genre === 'HOMME') return `Né en ${naissance}`
    if (membre.genre === 'FEMME') return `Née en ${naissance}`
    return `Né(e) en ${naissance}`
  }
  return ''
}

/** Style charte impériale : (1769-1821) */
export function afficherAnneesCourtes(membre) {
  const naissance = membre.date_naissance ? new Date(membre.date_naissance).getFullYear() : null
  const deces = membre.date_deces ? new Date(membre.date_deces).getFullYear() : null
  if (naissance && deces) return `(${naissance}-${deces})`
  if (naissance) return `(${naissance}-…)`
  if (deces) return `(†${deces})`
  return ''
}

export function sousTitreMembre(membre) {
  const bio = (membre.biographie || '').trim()
  if (bio) return bio.length > 56 ? `${bio.slice(0, 56)}…` : bio
  return ''
}

/** Texte « ils se sont mariés » selon les genres des conjoints */
export function texteUnion(conjoints) {
  const noms = conjoints.map((c) => c.nom).filter(Boolean)
  if (noms.length < 2) return 'Union familiale'

  const genres = conjoints.map((c) => c.genre || 'NON_PRECISE')
  const tousHommes = genres.every((g) => g === 'HOMME')
  const toutesFemmes = genres.every((g) => g === 'FEMME')

  if (tousHommes && noms.length === 2) {
    return `${noms[0]} et ${noms[1]} se sont mariés`
  }
  if (toutesFemmes && noms.length === 2) {
    return `${noms[0]} et ${noms[1]} se sont mariées`
  }
  if (noms.length === 2) {
    return `${noms[0]} et ${noms[1]} se sont unis`
  }
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]} — union familiale`
}

export function getMembreFromConjoint(c) {
  return c.membre || c
}

export function getEnfantFromLien(e) {
  return e.enfant || e
}

export const TYPES_ARBRE = [
  { value: 'ENFANT', label: 'Enfant (descendant)' },
  { value: 'CONJOINT', label: 'Époux / Épouse' },
  { value: 'ASCENDANT', label: 'Aïeul (racine)' }
]

export function estEnfant(membre) {
  return (membre?.type_arbre || 'ENFANT') === 'ENFANT'
}

export function estConjoint(membre) {
  const t = membre?.type_arbre || 'ENFANT'
  return t === 'CONJOINT' || t === 'ASCENDANT'
}

/** Enfants : descendants uniquement (pas les épouses) */
export function filtrerEnfants(membres) {
  return membres.filter(estEnfant)
}

/** Conjoints : époux/épouses avec fiche propre */
export function filtrerConjoints(membres) {
  return membres.filter(estConjoint)
}

/** Personnes pouvant être le « parent » dans un mariage (enfant devenu adulte, aïeul) */
export function filtrerPartenairesMariage(membres) {
  return membres.filter((m) => estEnfant(m) || m.type_arbre === 'ASCENDANT')
}

function idsEnfantsDesUnions(unions) {
  const set = new Set()
  unions.forEach((u) => {
    ;(u.enfants || []).forEach((e) => {
      const enfant = getEnfantFromLien(e)
      if (enfant?.id) set.add(enfant.id)
    })
  })
  return set
}

function idsConjoints(unions) {
  const set = new Set()
  unions.forEach((u) => {
    ;(u.conjoints || []).forEach((c) => {
      const m = getMembreFromConjoint(c)
      if (m?.id) set.add(m.id)
    })
  })
  return set
}

/** Branches sous une personne : ses mariages (unions) ou carte seule */
export function buildBranchesPersonne(personId, membres, unions, visited = new Set()) {
  if (!personId || visited.has(`p-${personId}`)) return []
  visited.add(`p-${personId}`)

  const personUnions = unions
    .filter((u) =>
      (u.conjoints || []).some((c) => getMembreFromConjoint(c).id === personId)
    )
    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))

  if (personUnions.length === 0) {
    const m = membres.find((x) => x.id === personId)
    if (!m) return []
    return [{ type: 'single', membre: m }]
  }

  return personUnions.map((union) => buildNoeudUnion(union, membres, unions, visited))
}

function enfantsLegacyDuCouple(conjointIds, membres, dejaPris) {
  return membres
    .filter(
      (m) =>
        estEnfant(m) &&
        m.parent_id &&
        conjointIds.includes(m.parent_id) &&
        !dejaPris.has(m.id)
    )
    .sort((a, b) => (a.layout_ordre || 0) - (b.layout_ordre || 0))
}

export function buildNoeudUnion(union, membres, unions, visited = new Set()) {
  const conjoints = (union.conjoints || [])
    .map((c) => {
      const m = getMembreFromConjoint(c)
      return m ? { ...m, _ordre: c.ordre ?? 0 } : null
    })
    .filter(Boolean)
    .sort((a, b) => a._ordre - b._ordre)

  const conjointIds = conjoints.map((c) => c.id)
  const dejaPris = new Set()

  const enfantsLiens = [...(union.enfants || [])].sort(
    (a, b) => (a.ordre || 0) - (b.ordre || 0)
  )

  const enfants = []

  for (const lien of enfantsLiens) {
    const enfant = getEnfantFromLien(lien)
    if (!enfant?.id) continue
    dejaPris.add(enfant.id)
    enfants.push({
      membre: enfant,
      ordre: lien.ordre || 0,
      branches: buildBranchesPersonne(enfant.id, membres, unions, new Set(visited))
    })
  }

  for (const m of enfantsLegacyDuCouple(conjointIds, membres, dejaPris)) {
    dejaPris.add(m.id)
    enfants.push({
      membre: m,
      ordre: m.layout_ordre || 0,
      branches: buildBranchesPersonne(m.id, membres, unions, new Set(visited)),
      legacy: true
    })
  }

  enfants.sort((a, b) => (a.ordre || 0) - (b.ordre || 0))

  return {
    type: 'union',
    union,
    conjoints,
    enfants,
    label: texteUnion(conjoints)
  }
}

/**
 * Forêt d'arbres : unions racines (aucun conjoint n'est enfant d'une autre union)
 * + membres isolés legacy (parent_id seul, sans union)
 */
export function buildArbreForest(membres, unions) {
  if (!unions?.length) {
    return buildLegacyForest(membres)
  }

  const enfantIds = idsEnfantsDesUnions(unions)

  const racines = unions
    .filter((u) => {
      const conjointIds = (u.conjoints || []).map((c) => getMembreFromConjoint(c).id)
      return !conjointIds.some((id) => enfantIds.has(id))
    })
    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
    .map((u) => buildNoeudUnion(u, membres, unions))

  const conjointIds = idsConjoints(unions)
  const orphelins = membres
    .filter(
      (m) =>
        estConjoint(m) &&
        !m.parent_id &&
        !conjointIds.has(m.id) &&
        !enfantIds.has(m.id)
    )
    .sort((a, b) => (a.layout_ordre || 0) - (b.layout_ordre || 0))
    .map((m) => ({
      type: 'single',
      membre: m,
      branches: buildBranchesPersonne(m.id, membres, unions)
    }))

  const enfantsNonClasses = membres
    .filter(
      (m) =>
        estEnfant(m) &&
        !m.parent_id &&
        !enfantIds.has(m.id) &&
        !conjointIds.has(m.id)
    )
    .sort((a, b) => (a.layout_ordre || 0) - (b.layout_ordre || 0))

  if (enfantsNonClasses.length > 0) {
    racines.push({
      type: 'group',
      label: 'Enfants (à rattacher à un couple)',
      legacyEnfants: enfantsNonClasses.map((m) => ({
        type: 'single',
        membre: m,
        legacyEnfants: [],
        branches: buildBranchesPersonne(m.id, membres, unions)
      }))
    })
  }

  return racines
}

function buildLegacyForest(membres) {
  const racines = membres
    .filter((m) => !m.parent_id)
    .sort((a, b) => (a.layout_ordre || 0) - (b.layout_ordre || 0))

  const enfantsDe = (parentId) =>
    membres
      .filter((m) => m.parent_id === parentId)
      .sort((a, b) => (a.layout_ordre || 0) - (b.layout_ordre || 0))

  function legacyNode(membre) {
    const kids = enfantsDe(membre.id)
    return {
      type: 'single',
      membre,
      legacyEnfants: kids.map(legacyNode)
    }
  }

  return racines.map(legacyNode)
}

export function parseArbreResponse(data) {
  if (Array.isArray(data)) {
    return { membres: data, unions: [] }
  }
  return {
    membres: data?.membres || [],
    unions: data?.unions || []
  }
}
