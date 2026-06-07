import { getSupabase } from '../lib/supabaseClient'
import { supabaseErrorMessage } from '../lib/supabaseHelpers'
import { parseReseauxSociaux } from '../lib/profilFields'

const PROFIL_COLUMNS = `
  id, nom, prenom, email, role, famille_id, avatar_url, biographie, bibliographie, interets,
  parcours_scolaire, parcours_professionnel, metier_actuel, activite_actuelle,
  description_metier, langues, telephone, date_naissance, lieu_vie,
  formations_competences, nom_complet, reseaux_sociaux, lieu_residence_ancien,
  place_famille, relations_famille, filiation, diplome_bac, ville_actuelle,
  lieu_naissance, latitude, longitude, lat_naissance, lng_naissance,
  couverture_url, theme_pref, confort_mode, totp_enabled, derniere_connexion, created_at
`

function sb() {
  const client = getSupabase()
  if (!client) throw new Error('Client Supabase non configuré')
  return client
}

function normalizeMembre(row) {
  if (!row) return row
  let interets = row.interets
  if (typeof interets === 'string') {
    try {
      interets = JSON.parse(interets)
    } catch {
      interets = interets ? [interets] : []
    }
  }
  let langues = row.langues
  if (typeof langues === 'string') {
    try {
      langues = JSON.parse(langues)
    } catch {
      langues = langues ? [langues] : []
    }
  }
  return {
    ...row,
    interets: Array.isArray(interets) ? interets : [],
    langues: Array.isArray(langues) ? langues : [],
    reseaux_sociaux: parseReseauxSociaux(row.reseaux_sociaux)
  }
}

export async function supabaseListMembres() {
  const client = sb()
  const { data, error } = await client
    .from('Utilisateur')
    .select(PROFIL_COLUMNS)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data: (data || []).map(normalizeMembre) }
}

export async function supabaseGetMembre(id) {
  const client = sb()
  const { data, error } = await client
    .from('Utilisateur')
    .select(PROFIL_COLUMNS)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(supabaseErrorMessage(error))
  if (!data) return { succes: false, message: 'Membre introuvable' }
  return { succes: true, data: normalizeMembre(data) }
}

export async function supabaseGetInviteCode() {
  const client = sb()
  const { data, error } = await client.rpc('get_my_profile')
  if (error) throw new Error(supabaseErrorMessage(error))
  const code = data?.utilisateur?.code_invitation
  if (!code) throw new Error('Code invitation indisponible')
  return { succes: true, data: { code, nom: data.utilisateur?.famille } }
}

/** Met à jour la photo de profil via Supabase (RLS), sans passer par l’API Render. */
export async function supabaseUpdateMyAvatar(avatar_url) {
  const client = sb()
  const { data: authData, error: authErr } = await client.auth.getUser()
  if (authErr || !authData?.user?.id) {
    throw new Error('Session expirée — reconnectez-vous')
  }

  const { data, error } = await client
    .from('Utilisateur')
    .update({
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString()
    })
    .eq('auth_user_id', authData.user.id)
    .select('id, nom, prenom, email, role, famille_id, avatar_url')
    .single()

  if (error) throw new Error(supabaseErrorMessage(error, 'Mise à jour de la photo impossible'))
  return normalizeMembre(data)
}
