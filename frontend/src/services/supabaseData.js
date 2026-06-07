import { getSupabase } from '../lib/supabaseClient'
import { formatSouvenirRow, supabaseErrorMessage } from '../lib/supabaseHelpers'
import { getStoredUser } from '../lib/userStorage'
import { embedMediaInDescription } from '../lib/mediaUrl'

const SOUVENIR_SELECT = `
  *,
  auteur:Utilisateur(id, nom, prenom, avatar_url),
  reactions:Reaction(*),
  commentaires:Commentaire(id),
  tags:SouvenirTag(tag:Tag(id, libelle, couleur)),
  membre_arbre:MembreArbre(id, nom)
`

function sb() {
  const client = getSupabase()
  if (!client) throw new Error('Client Supabase non configuré')
  return client
}

function me() {
  const u = getStoredUser()
  if (!u?.id) throw new Error('Profil non chargé — reconnectez-vous')
  return u
}

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.filter(Boolean)
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* virgules */
    }
    return tags.split(',').map((t) => t.trim()).filter(Boolean)
  }
  return []
}

async function attachTags(souvenirId, tags, familleId) {
  const libelles = parseTags(tags)
  if (!libelles.length) return
  const client = sb()

  for (const libelle of libelles) {
    let tagId
    const { data: existing } = await client
      .from('Tag')
      .select('id')
      .eq('famille_id', familleId)
      .eq('libelle', libelle)
      .maybeSingle()

    if (existing?.id) {
      tagId = existing.id
    } else {
      const { data: created, error } = await client
        .from('Tag')
        .insert({ libelle, famille_id: familleId })
        .select('id')
        .single()
      if (error) throw new Error(supabaseErrorMessage(error))
      tagId = created.id
    }

    await client.from('SouvenirTag').upsert(
      { souvenir_id: souvenirId, tag_id: tagId },
      { onConflict: 'souvenir_id,tag_id' }
    )
  }
}

function buildCommentTree(rows) {
  const valides = rows.filter((c) => c.auteur)
  const map = new Map()
  const byId = new Map(valides.map((c) => [c.id, c]))
  valides.forEach((c) => map.set(c.id, { ...c, reponses: [] }))

  function findAttachParentId(parentId) {
    let pid = parentId
    const visited = new Set()
    while (pid != null && !visited.has(pid)) {
      visited.add(pid)
      if (map.has(pid)) return pid
      pid = byId.get(pid)?.parent_id ?? null
    }
    return null
  }

  const racines = []
  valides.forEach((c) => {
    const node = map.get(c.id)
    const attachId = c.parent_id ? findAttachParentId(c.parent_id) : null
    if (attachId != null) {
      map.get(attachId).reponses.push(node)
    } else {
      racines.push(node)
    }
  })
  return racines
}

export async function supabaseListSouvenirs({ page = 1, limit = 30 } = {}) {
  const client = sb()
  const safeLimit = Math.min(100, Math.max(1, limit))
  const from = (Math.max(1, page) - 1) * safeLimit
  const to = from + safeLimit - 1

  const { data, error, count } = await client
    .from('Souvenir')
    .select(SOUVENIR_SELECT, { count: 'exact' })
    .order('epingle', { ascending: false })
    .order('date_souvenir', { ascending: false })
    .range(from, to)

  if (error) throw new Error(supabaseErrorMessage(error))

  const rows = (data || []).map(formatSouvenirRow)
  const total = count ?? rows.length
  return {
    succes: true,
    data: rows,
    pagination: {
      page,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit) || 1,
      hasMore: from + rows.length < total
    }
  }
}

export async function supabaseGetSouvenir(id) {
  const client = sb()
  const { data, error } = await client
    .from('Souvenir')
    .select(SOUVENIR_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(supabaseErrorMessage(error))
  if (!data) throw new Error('Souvenir introuvable')
  return { succes: true, data: formatSouvenirRow(data) }
}

export async function supabaseCreateSouvenir(payload) {
  const u = me()
  const client = sb()
  const {
    titre,
    description,
    type,
    date_souvenir,
    lieu,
    tags,
    fichiers_url,
    visibilite,
    latitude,
    longitude,
    categorie,
    membre_arbre_id,
    couverture_url
  } = payload

  if (!titre || !date_souvenir) {
    throw new Error('Titre et date sont obligatoires')
  }

  const urls = Array.isArray(fichiers_url) ? fichiers_url.filter(Boolean) : []
  const media_url = urls[0] || null
  const fichiers_multiple = urls.length > 1 ? JSON.stringify(urls.slice(1)) : null
  let finalDescription = description || null
  if (urls.length > 0) {
    finalDescription = embedMediaInDescription(description, urls.map((url) => ({ url })))
  }

  const insert = {
    titre,
    description: finalDescription,
    type: type || 'TEXTE',
    date_souvenir,
    lieu: lieu || null,
    fichier_url: media_url,
    fichiers_multiple,
    auteur_id: u.id,
    famille_id: u.famille_id,
    visibilite: visibilite || 'FAMILLE',
    is_visible: true,
    is_active: true
  }

  if (couverture_url || media_url) insert.couverture_url = couverture_url || media_url
  if (latitude != null && latitude !== '') insert.latitude = Number(latitude)
  if (longitude != null && longitude !== '') insert.longitude = Number(longitude)
  if (categorie) insert.categorie = categorie
  if (membre_arbre_id) insert.membre_arbre_id = Number(membre_arbre_id)

  const { data: row, error } = await client
    .from('Souvenir')
    .insert(insert)
    .select('*')
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))

  await attachTags(row.id, tags, u.famille_id)
  return formatSouvenirRow(row)
}

export async function supabaseUpdateSouvenir(id, fields) {
  const client = sb()
  const patch = {}
  if (fields.titre != null) patch.titre = fields.titre
  if (fields.description !== undefined) patch.description = fields.description
  if (fields.type != null) patch.type = fields.type
  if (fields.date_souvenir != null) patch.date_souvenir = fields.date_souvenir
  if (fields.lieu !== undefined) patch.lieu = fields.lieu
  if (fields.visibilite != null) patch.visibilite = fields.visibilite
  if (fields.epingle !== undefined) patch.epingle = Boolean(fields.epingle)
  if (fields.latitude !== undefined) {
    patch.latitude = fields.latitude != null && fields.latitude !== '' ? Number(fields.latitude) : null
  }
  if (fields.longitude !== undefined) {
    patch.longitude = fields.longitude != null && fields.longitude !== '' ? Number(fields.longitude) : null
  }
  if (fields.categorie !== undefined) patch.categorie = fields.categorie || null
  if (fields.membre_arbre_id !== undefined) {
    patch.membre_arbre_id = fields.membre_arbre_id ? Number(fields.membre_arbre_id) : null
  }
  if (fields.couverture_url !== undefined) patch.couverture_url = fields.couverture_url || null

  const { data, error } = await client
    .from('Souvenir')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data: formatSouvenirRow(data) }
}

export async function supabaseDeleteSouvenir(id) {
  const client = sb()
  const { error } = await client
    .from('Souvenir')
    .update({ is_visible: false })
    .eq('id', id)

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, message: 'Souvenir supprimé' }
}

export async function supabaseListMembres() {
  const client = sb()
  const { data, error } = await client
    .from('Utilisateur')
    .select(
      'id, nom, prenom, email, role, famille_id, avatar_url, biographie, bibliographie, interets, metier_actuel, telephone, created_at'
    )
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data: data || [] }
}

export async function supabaseListFavoris() {
  const u = me()
  const client = sb()
  const { data, error } = await client
    .from('Favori')
    .select('souvenir_id, created_at')
    .eq('utilisateur_id', u.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data: data || [] }
}

export async function supabaseAddFavori(souvenirId) {
  const u = me()
  const client = sb()
  const { data, error } = await client
    .from('Favori')
    .insert({ utilisateur_id: u.id, souvenir_id: souvenirId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Déjà dans les favoris')
    throw new Error(supabaseErrorMessage(error))
  }
  return { succes: true, data }
}

export async function supabaseRemoveFavori(souvenirId) {
  const u = me()
  const client = sb()
  const { error } = await client
    .from('Favori')
    .delete()
    .eq('utilisateur_id', u.id)
    .eq('souvenir_id', souvenirId)

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, message: 'Retiré des favoris' }
}

const REACTION_TYPES = ['LIKE', 'COEUR', 'LARME', 'RIRE']

export async function supabaseSetReaction(souvenirId, type) {
  if (!REACTION_TYPES.includes(type)) {
    throw new Error('Type invalide — utilise LIKE, COEUR, LARME ou RIRE')
  }
  const u = me()
  const client = sb()
  const { data, error } = await client
    .from('Reaction')
    .upsert(
      { souvenir_id: souvenirId, utilisateur_id: u.id, type },
      { onConflict: 'souvenir_id,utilisateur_id' }
    )
    .select()
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data }
}

export async function supabaseRemoveReaction(souvenirId) {
  const u = me()
  const client = sb()
  const { error } = await client
    .from('Reaction')
    .delete()
    .eq('souvenir_id', souvenirId)
    .eq('utilisateur_id', u.id)

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, message: 'Réaction supprimée' }
}

export async function supabaseGetCommentaires(souvenirId) {
  const client = sb()
  const { data, error } = await client
    .from('Commentaire')
    .select(
      'id, contenu, souvenir_id, auteur_id, parent_id, is_visible, created_at, auteur:Utilisateur(id, nom, prenom, avatar_url)'
    )
    .eq('souvenir_id', souvenirId)
    .eq('is_visible', true)
    .order('created_at', { ascending: true })

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data: buildCommentTree(data || []) }
}

export async function supabasePostCommentaire(souvenirId, contenu) {
  if (!contenu?.trim()) throw new Error('Le commentaire ne peut pas être vide')
  const u = me()
  const client = sb()
  const { data, error } = await client
    .from('Commentaire')
    .insert({
      contenu: contenu.trim(),
      souvenir_id: souvenirId,
      auteur_id: u.id
    })
    .select(
      'id, contenu, souvenir_id, auteur_id, parent_id, created_at, auteur:Utilisateur(id, nom, prenom, avatar_url)'
    )
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data }
}

export async function supabaseReplyCommentaire(parentId, contenu) {
  if (!contenu?.trim()) throw new Error('La réponse ne peut pas être vide')
  const u = me()
  const client = sb()

  const { data: parent, error: pErr } = await client
    .from('Commentaire')
    .select('id, souvenir_id')
    .eq('id', parentId)
    .eq('is_visible', true)
    .maybeSingle()

  if (pErr) throw new Error(supabaseErrorMessage(pErr))
  if (!parent) throw new Error('Commentaire parent introuvable')

  const { data, error } = await client
    .from('Commentaire')
    .insert({
      contenu: contenu.trim(),
      souvenir_id: parent.souvenir_id,
      parent_id: parentId,
      auteur_id: u.id
    })
    .select(
      'id, contenu, souvenir_id, auteur_id, parent_id, created_at, auteur:Utilisateur(id, nom, prenom, avatar_url)'
    )
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data }
}

export async function supabaseUpdateCommentaire(id, contenu) {
  if (!contenu?.trim()) throw new Error('Le commentaire ne peut pas être vide')
  const client = sb()
  const { data, error } = await client
    .from('Commentaire')
    .update({ contenu: contenu.trim() })
    .eq('id', id)
    .select(
      'id, contenu, auteur:Utilisateur(id, nom, prenom, avatar_url)'
    )
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data }
}

export async function supabaseDeleteCommentaire(id) {
  const client = sb()
  const { error } = await client
    .from('Commentaire')
    .update({ is_visible: false })
    .eq('id', id)

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, message: 'Commentaire supprimé' }
}

export async function supabaseFamilyFeedStats() {
  const client = sb()
  const { data, error } = await client.rpc('get_family_feed_stats')
  if (error) throw new Error(supabaseErrorMessage(error))
  if (!data?.succes) return null
  return data.famille_stats
}
