/**
 * Repli local quand /api/platform est indisponible (API Railway pas à jour).
 * Données héritage / capsules / hommages / événements : localStorage par famille.
 * Hommage, chronologie, livre, carte : APIs existantes (arbre, souvenirs, profil).
 */
import api from '../services/api'
import { getStoredUser } from './userStorage'

export function markPlatformLocalMode() {
  try {
    sessionStorage.setItem('mh-platform-local', '1')
    window.dispatchEvent(new Event('mh-platform-local'))
  } catch {
    /* ignore */
  }
}

/** API locale à jour : quitte le mode repli localStorage */
export function clearPlatformLocalMode() {
  try {
    sessionStorage.removeItem('mh-platform-local')
    window.dispatchEvent(new Event('mh-platform-local'))
  } catch {
    /* ignore */
  }
}

export function isPlatformLocalMode() {
  try {
    return sessionStorage.getItem('mh-platform-local') === '1'
  } catch {
    return false
  }
}

function storageKey(name) {
  const u = getStoredUser()
  const fid = u.famille_id || u.id || 'default'
  return `mh-${name}-${fid}`
}

function readStore(name, fallback = []) {
  try {
    const raw = localStorage.getItem(storageKey(name))
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeStore(name, data) {
  localStorage.setItem(storageKey(name), JSON.stringify(data))
}

function auteurCourant() {
  const u = getStoredUser()
  return {
    id: u.id,
    prenom: u.prenom || '',
    nom: u.nom || '',
    avatar_url: u.avatar_url || null
  }
}

function peutModifierEntree(entree) {
  const u = getStoredUser()
  if (!entree || !u?.id) return false
  const auteurId = entree.auteur_id ?? entree.auteur?.id
  if (auteurId === u.id) return true
  return u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
}

function refuserSiNonAuteur(entree) {
  if (!peutModifierEntree(entree)) {
    const err = new Error('Seul l’auteur ou un administrateur peut effectuer cette action')
    err.status = 403
    throw err
  }
}

async function fetchArbre() {
  const rep = await api.get('/arbre')
  return rep.data.data || []
}

async function fetchSouvenirs(limit = 100) {
  const rep = await api.get('/souvenirs', { params: { limit } })
  return rep.data.data || []
}

function daysUntilBirthday(dateNaissance) {
  if (!dateNaissance) return null
  const now = new Date()
  const birth = new Date(dateNaissance)
  let next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  if (next < now) next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate())
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24))
}

// ——— Héritage ———
export async function fallbackFetchHeritage(type) {
  const all = readStore('heritage', [])
  if (!type) return all
  const t = String(type).toUpperCase()
  return all.filter((i) => i.type === t)
}

export async function fallbackCreateHeritage(payload) {
  const auteur = auteurCourant()
  const item = {
    id: Date.now(),
    auteur_id: auteur.id,
    type: String(payload.type).toUpperCase(),
    titre: String(payload.titre || '').trim(),
    contenu: payload.contenu || null,
    media_url: payload.media_url || null,
    audio_url: payload.audio_url || null,
    video_url: payload.video_url || null,
    created_at: new Date().toISOString(),
    auteur
  }
  const all = readStore('heritage', [])
  all.unshift(item)
  writeStore('heritage', all)
  return item
}

export async function fallbackUpdateHeritage(id, payload) {
  const all = readStore('heritage', [])
  const idx = all.findIndex((i) => i.id === id)
  if (idx < 0) throw Object.assign(new Error('Élément introuvable'), { status: 404 })
  refuserSiNonAuteur(all[idx])
  const next = {
    ...all[idx],
    ...(payload.titre != null && { titre: String(payload.titre).trim() }),
    ...(payload.contenu !== undefined && { contenu: payload.contenu }),
    ...(payload.media_url !== undefined && { media_url: payload.media_url })
  }
  all[idx] = next
  writeStore('heritage', all)
  return next
}

export async function fallbackDeleteHeritage(id) {
  const all = readStore('heritage', [])
  const item = all.find((i) => i.id === id)
  if (!item) throw Object.assign(new Error('Élément introuvable'), { status: 404 })
  refuserSiNonAuteur(item)
  writeStore(
    'heritage',
    all.filter((i) => i.id !== id)
  )
}

// ——— Hommage ———
export async function fallbackFetchHommage() {
  const [membres, souvenirs] = await Promise.all([fetchArbre(), fetchSouvenirs()])
  const hommagesByMembre = readStore('hommage-messages', {})

  return membres
    .filter((m) => m.date_deces)
    .map((m) => ({
      ...m,
      hommages: hommagesByMembre[m.id] || [],
      souvenirs: souvenirs
        .filter((s) => s.membre_arbre_id === m.id)
        .slice(0, 12)
        .map((s) => ({
          id: s.id,
          titre: s.titre,
          fichier_url: s.fichier_url,
          date_souvenir: s.date_souvenir
        }))
    }))
    .sort((a, b) => new Date(b.date_deces) - new Date(a.date_deces))
}

export async function fallbackPostHommageMessage(membreId, payload) {
  const store = readStore('hommage-messages', {})
  const list = store[membreId] || []
  const auteur = auteurCourant()
  const msg = {
    id: Date.now(),
    auteur_id: auteur.id,
    contenu: payload.contenu.trim(),
    type: payload.type || 'TEXTE',
    media_url: payload.media_url || null,
    created_at: new Date().toISOString(),
    auteur
  }
  store[membreId] = [msg, ...list]
  writeStore('hommage-messages', store)
  return msg
}

function findHommageMessage(id) {
  const store = readStore('hommage-messages', {})
  for (const membreId of Object.keys(store)) {
    const list = store[membreId] || []
    const idx = list.findIndex((m) => m.id === id)
    if (idx >= 0) return { store, membreId, list, idx, msg: list[idx] }
  }
  return null
}

export async function fallbackUpdateHommageMessage(id, payload) {
  const found = findHommageMessage(id)
  if (!found) throw Object.assign(new Error('Témoignage introuvable'), { status: 404 })
  refuserSiNonAuteur(found.msg)
  const updated = {
    ...found.msg,
    contenu: String(payload.contenu || '').trim()
  }
  found.list[found.idx] = updated
  found.store[found.membreId] = found.list
  writeStore('hommage-messages', found.store)
  return updated
}

export async function fallbackDeleteHommageMessage(id) {
  const found = findHommageMessage(id)
  if (!found) throw Object.assign(new Error('Témoignage introuvable'), { status: 404 })
  refuserSiNonAuteur(found.msg)
  found.store[found.membreId] = found.list.filter((m) => m.id !== id)
  writeStore('hommage-messages', found.store)
}

// ——— Capsules ———
export async function fallbackFetchCapsules() {
  const caps = readStore('capsules', [])
  const now = new Date()
  return caps.map((c) => ({
    ...c,
    ouverte: c.ouverte || new Date(c.date_ouverture) <= now
  }))
}

export async function fallbackCreateCapsule(payload) {
  const auteur = auteurCourant()
  const cap = {
    id: Date.now(),
    auteur_id: auteur.id,
    titre: String(payload.titre || '').trim(),
    message: payload.message || null,
    date_ouverture: payload.date_ouverture,
    ouverte: false,
    auteur
  }
  const all = readStore('capsules', [])
  all.push(cap)
  writeStore('capsules', all)
  return cap
}

export async function fallbackUpdateCapsule(id, payload) {
  const all = readStore('capsules', [])
  const idx = all.findIndex((c) => c.id === id)
  if (idx < 0) throw Object.assign(new Error('Capsule introuvable'), { status: 404 })
  refuserSiNonAuteur(all[idx])
  if (all[idx].ouverte) {
    throw Object.assign(new Error('Une capsule ouverte ne peut plus être modifiée'), { status: 400 })
  }
  const next = {
    ...all[idx],
    ...(payload.titre != null && { titre: String(payload.titre).trim() }),
    ...(payload.message !== undefined && { message: payload.message }),
    ...(payload.date_ouverture && { date_ouverture: payload.date_ouverture })
  }
  all[idx] = next
  writeStore('capsules', all)
  return next
}

export async function fallbackDeleteCapsule(id) {
  const all = readStore('capsules', [])
  const item = all.find((c) => c.id === id)
  if (!item) throw Object.assign(new Error('Capsule introuvable'), { status: 404 })
  refuserSiNonAuteur(item)
  writeStore(
    'capsules',
    all.filter((c) => c.id !== id)
  )
}

// ——— Événements / chronologie ———
export async function fallbackFetchEvenements() {
  return readStore('evenements', [])
}

export async function fallbackCreateEvenement(payload) {
  const auteur = auteurCourant()
  const ev = {
    id: Date.now(),
    auteur_id: auteur.id,
    titre: String(payload.titre || '').trim(),
    type: payload.type || 'AUTRE',
    date_debut: payload.date_debut,
    date_fin: payload.date_fin || null,
    lieu: payload.lieu || null,
    description: payload.description || null,
    auteur
  }
  const all = readStore('evenements', [])
  all.push(ev)
  writeStore('evenements', all)
  return ev
}

export async function fallbackUpdateEvenement(id, payload) {
  const all = readStore('evenements', [])
  const idx = all.findIndex((e) => e.id === id)
  if (idx < 0) throw Object.assign(new Error('Événement introuvable'), { status: 404 })
  refuserSiNonAuteur(all[idx])
  const next = {
    ...all[idx],
    ...(payload.titre != null && { titre: String(payload.titre).trim() }),
    ...(payload.type != null && { type: payload.type }),
    ...(payload.date_debut && { date_debut: payload.date_debut }),
    ...(payload.lieu !== undefined && { lieu: payload.lieu }),
    ...(payload.description !== undefined && { description: payload.description })
  }
  all[idx] = next
  writeStore('evenements', all)
  return next
}

export async function fallbackDeleteEvenement(id) {
  const all = readStore('evenements', [])
  const item = all.find((e) => e.id === id)
  if (!item) throw Object.assign(new Error('Événement introuvable'), { status: 404 })
  refuserSiNonAuteur(item)
  writeStore(
    'evenements',
    all.filter((e) => e.id !== id)
  )
}

export async function fallbackFetchTimeline() {
  const [membres, souvenirs] = await Promise.all([fetchArbre(), fetchSouvenirs(100)])
  const evenements = readStore('evenements', [])
  const events = []

  membres.forEach((m) => {
    if (m.date_naissance) {
      events.push({
        kind: 'NAISSANCE',
        date: m.date_naissance,
        titre: `Naissance de ${m.nom}`,
        ref_id: m.id
      })
    }
    if (m.date_deces) {
      events.push({
        kind: 'DECES',
        date: m.date_deces,
        titre: m.nom,
        ref_id: m.id
      })
    }
  })

  evenements.forEach((e) => {
    events.push({
      kind: e.type || 'EVENEMENT',
      source: 'evenement',
      date: e.date_debut,
      titre: e.titre,
      lieu: e.lieu || null,
      ref_id: e.id,
      auteur_id: e.auteur_id,
      auteur: e.auteur
    })
  })

  souvenirs
    .filter((s) => s.epingle)
    .forEach((s) => {
      events.push({
        kind: 'SOUVENIR',
        date: s.date_souvenir,
        titre: s.titre,
        ref_id: s.id
      })
    })

  events.sort((a, b) => new Date(b.date) - new Date(a.date))
  return events
}

// ——— Carte ———
export async function fallbackFetchCarte() {
  const user = getStoredUser()
  const [membres, souvenirs] = await Promise.all([fetchArbre(), fetchSouvenirs()])
  const points = []

  if (user.latitude != null && user.longitude != null) {
    points.push({
      kind: 'membre',
      label: `${user.prenom || ''} ${user.nom || ''}`.trim(),
      lat: Number(user.latitude),
      lng: Number(user.longitude),
      ville: user.ville_actuelle
    })
  }
  if (user.lat_naissance != null && user.lng_naissance != null) {
    points.push({
      kind: 'naissance',
      label: `Naissance — ${user.prenom || 'Membre'}`,
      lat: Number(user.lat_naissance),
      lng: Number(user.lng_naissance),
      ville: user.lieu_naissance
    })
  }

  membres.forEach((m) => {
    if (m.latitude != null && m.longitude != null) {
      points.push({
        kind: 'arbre',
        label: m.nom,
        lat: Number(m.latitude),
        lng: Number(m.longitude),
        ville: m.ville_actuelle
      })
    } else if (m.lieu_naissance) {
      points.push({ kind: 'arbre', label: m.nom, lieu: m.lieu_naissance, lat: null, lng: null })
    }
  })

  souvenirs.forEach((s) => {
    if (s.latitude != null && s.longitude != null) {
      points.push({
        kind: 'souvenir',
        label: s.titre,
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        lieu: s.lieu
      })
    } else if (s.lieu) {
      points.push({ kind: 'souvenir', label: s.titre, lieu: s.lieu, lat: null, lng: null })
    }
  })

  return { points }
}

// ——— Livre ———
export async function fallbackFetchLivreData() {
  const user = getStoredUser()
  const [souvenirs, membres] = await Promise.all([fetchSouvenirs(80), fetchArbre()])
  const heritage = readStore('heritage', [])

  return {
    famille: { nom: user.famille || 'Famille', description: null },
    souvenirs,
    membres: membres.map((m) => ({
      id: m.id,
      nom: m.nom,
      date_naissance: m.date_naissance,
      biographie: m.biographie,
      photo_url: m.photo_url
    })),
    heritage: heritage.slice(0, 30),
    generatedAt: new Date().toISOString()
  }
}

export async function fallbackFetchLivres() {
  return readStore('livres', [])
}

export async function fallbackSaveLivre(payload) {
  const auteur = auteurCourant()
  const entry = {
    id: Date.now(),
    auteur_id: auteur.id,
    titre: String(payload.titre || `Livre du ${new Date().toLocaleDateString('fr-FR')}`).trim(),
    created_at: new Date().toISOString(),
    auteur,
    snapshot: payload.snapshot
  }
  const all = readStore('livres', [])
  all.unshift(entry)
  writeStore('livres', all)
  return entry
}

export async function fallbackDeleteLivre(id) {
  const all = readStore('livres', [])
  const item = all.find((l) => l.id === id)
  if (!item) throw Object.assign(new Error('Livre introuvable'), { status: 404 })
  refuserSiNonAuteur(item)
  writeStore(
    'livres',
    all.filter((l) => l.id !== id)
  )
}

// ——— Accueil ———
export async function fallbackFetchAccueil() {
  const [souvenirs, albumsRep, membresRep] = await Promise.all([
    fetchSouvenirs(100),
    api.get('/albums').catch(() => ({ data: { data: [] } })),
    api.get('/membres').catch(() => ({ data: { data: [] } }))
  ])
  const albums = albumsRep.data?.data || []
  const membresArbre = await fetchArbre()

  const anniversaires = membresArbre
    .filter((m) => m.date_naissance)
    .map((m) => ({
      id: m.id,
      nom: m.nom,
      date_naissance: m.date_naissance,
      photo_url: m.photo_url,
      jours_restants: daysUntilBirthday(m.date_naissance)
    }))
    .filter((m) => m.jours_restants != null && m.jours_restants <= 30)
    .sort((a, b) => a.jours_restants - b.jours_restants)
    .slice(0, 8)

  const evenements = readStore('evenements', [])
    .filter((e) => e.date_debut && new Date(e.date_debut) >= new Date())
    .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut))
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      titre: e.titre,
      date_debut: e.date_debut,
      lieu: e.lieu
    }))

  return {
    souvenirsRecents: souvenirs.slice(0, 6),
    albumsRecents: albums.slice(0, 4),
    anniversaires,
    evenements,
    stats: {
      souvenirs: souvenirs.length,
      albums: albums.length,
      membres: (membresRep.data?.data || []).length,
      commentaires: 0
    },
    _localMode: true
  }
}

// ——— Albums auto ———
export async function fallbackFetchAlbumsAuto() {
  const souvenirs = await fetchSouvenirs(100)
  const parAnnee = {}
  const parPersonne = {}

  souvenirs.forEach((s) => {
    const y = new Date(s.date_souvenir).getFullYear()
    if (!parAnnee[y]) parAnnee[y] = []
    parAnnee[y].push(s.id)
    if (s.membre_arbre_id) {
      if (!parPersonne[s.membre_arbre_id]) {
        parPersonne[s.membre_arbre_id] = {
          nom: s.membre_arbre?.nom || `Membre ${s.membre_arbre_id}`,
          ids: []
        }
      }
      parPersonne[s.membre_arbre_id].ids.push(s.id)
    }
  })

  let favoris = []
  try {
    const rep = await api.get('/favoris')
    favoris = (rep.data.data || []).map((f) => f.souvenir_id)
  } catch {
    /* ignore */
  }

  return {
    parAnnee: Object.entries(parAnnee)
      .map(([annee, ids]) => ({ annee: Number(annee), count: ids.length, souvenir_ids: ids }))
      .sort((a, b) => b.annee - a.annee),
    parPersonne: Object.entries(parPersonne).map(([id, v]) => ({
      membre_arbre_id: Number(id),
      nom: v.nom,
      count: v.ids.length,
      souvenir_ids: v.ids
    })),
    favoris
  }
}
