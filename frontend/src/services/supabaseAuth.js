import { getSupabase, isSupabaseMode, authRedirectUrl } from '../lib/supabaseClient'

/** Supabase masque les emails existants : user sans role ni identities. */
function isDuplicateSignupUser(user) {
  return Boolean(
    user?.email &&
      (user.role === '' || user.role == null) &&
      (!Array.isArray(user.identities) || user.identities.length === 0)
  )
}

/** Messages clairs (Supabase renvoie souvent du texte anglais). */
export function mapSupabaseAuthError(error) {
  const msg = String(error?.message || error || '').trim()
  const lower = msg.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return (
      'Email ou mot de passe incorrect. ' +
      'Les comptes de l’ancienne version ne fonctionnent pas automatiquement : ' +
      'créez une famille sur « S’inscrire », ou demandez la liaison de votre email (voir CONNEXION-SUPABASE.md).'
    )
  }
  if (lower.includes('email not confirmed')) {
    return (
      'Email non confirmé. Cliquez le lien reçu par mail, ' +
      'ou désactivez « Confirm email » dans Supabase (Authentication → Email).'
    )
  }
  if (lower.includes('user already registered')) {
    return 'Cet email est déjà inscrit. Connectez-vous ou utilisez « Mot de passe oublié ».'
  }
  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    error?.status === 429 ||
    String(error?.code || '').includes('over_email_send_rate_limit')
  ) {
    return (
      'Trop de tentatives d’inscription. Attendez 15–60 minutes, ou connectez-vous si le compte existe déjà.'
    )
  }
  return msg || 'Erreur de connexion'
}

function mapProfileFromRpc(payload) {
  const u = payload?.utilisateur
  if (!u) return null
  return {
    id: u.id,
    nom: u.nom,
    prenom: u.prenom,
    email: u.email,
    role: u.role,
    famille_id: u.famille_id,
    avatar_url: u.avatar_url ?? null,
    famille: u.famille ?? null,
    code_invitation: u.code_invitation ?? null
  }
}

export async function supabaseVerifyInviteCode(code) {
  const sb = getSupabase()
  const { data, error } = await sb.rpc('verify_invite_code', { invite_code: code })
  if (error) throw new Error(error.message)
  return data
}

/** Finalise la famille après confirmation email (métadonnées signUp). */
export async function supabaseFinalizeProfileFromMetadata() {
  const sb = getSupabase()
  const { data: userData } = await sb.auth.getUser()
  const meta = userData?.user?.user_metadata || {}

  if (meta.signup_type === 'create' && meta.nom_famille) {
    const { data: reg, error: regErr } = await sb.rpc('register_new_family', {
      p_nom_famille: meta.nom_famille,
      p_prenom: meta.prenom || '',
      p_nom: meta.nom || ''
    })
    if (regErr) throw new Error(regErr.message)
    if (!reg?.succes) throw new Error(reg?.message || 'Erreur finalisation famille')
    return supabaseFetchProfile()
  }

  if (meta.signup_type === 'join' && meta.invite_code) {
    const { data: reg, error: regErr } = await sb.rpc('register_join_family', {
      invite_code: String(meta.invite_code).trim().toUpperCase(),
      p_prenom: meta.prenom || '',
      p_nom: meta.nom || '',
      p_role: 'MEMBRE'
    })
    if (regErr) throw new Error(regErr.message)
    if (!reg?.succes) throw new Error(reg?.message || 'Erreur rejoindre famille')
    return supabaseFetchProfile()
  }

  return null
}

/** Traite le retour Supabase après clic sur le lien email (confirmation / magic link). */
export async function supabaseCompleteAuthCallback() {
  const sb = getSupabase()
  const { data, error } = await sb.auth.getSession()
  if (error) throw new Error(mapSupabaseAuthError(error))
  if (!data.session) return { session: null, utilisateur: null }

  let profile = await supabaseFetchProfile()
  if (!profile) profile = await supabaseFinalizeProfileFromMetadata()
  if (profile) persistSupabaseUser(profile)
  return { session: data.session, utilisateur: profile }
}

export async function supabaseSignUpCreateFamily({ email, password, prenom, nom, nom_famille }) {
  const sb = getSupabase()
  const { data: authData, error: authErr } = await sb.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { prenom, nom, nom_famille, signup_type: 'create' },
      emailRedirectTo: authRedirectUrl('/auth/callback')
    }
  })
  if (authErr) throw new Error(mapSupabaseAuthError(authErr))
  if (isDuplicateSignupUser(authData.user)) {
    throw new Error(
      'Cet email est déjà inscrit. Allez sur « Se connecter » (pas « Créer un compte ») avec votre mot de passe.'
    )
  }

  if (!authData.session) {
    return {
      needsEmailConfirmation: true,
      message:
        'Un email de confirmation a été envoyé. Cliquez le lien, ou connectez-vous directement si le lien ne s’ouvre pas.'
    }
  }

  const { data: reg, error: regErr } = await sb.rpc('register_new_family', {
    p_nom_famille: nom_famille,
    p_prenom: prenom,
    p_nom: nom
  })
  if (regErr) throw new Error(regErr.message)
  if (!reg?.succes) throw new Error(reg?.message || 'Erreur inscription famille')

  const profile = await supabaseFetchProfile()
  return {
    session: authData.session,
    utilisateur: profile,
    code_invitation: reg.code_invitation
  }
}

export async function supabaseSignUpJoinFamily({ email, password, prenom, nom, code, role }) {
  const sb = getSupabase()
  const { data: authData, error: authErr } = await sb.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { prenom, nom, invite_code: code, signup_type: 'join' },
      emailRedirectTo: authRedirectUrl('/auth/callback')
    }
  })
  if (authErr) throw new Error(mapSupabaseAuthError(authErr))
  if (isDuplicateSignupUser(authData.user)) {
    throw new Error(
      'Cet email est déjà inscrit. Utilisez « Se connecter » avec votre mot de passe.'
    )
  }

  if (!authData.session) {
    return {
      needsEmailConfirmation: true,
      message:
        'Un email de confirmation a été envoyé. Cliquez le lien, ou connectez-vous ensuite pour rejoindre la famille.'
    }
  }

  const { data: reg, error: regErr } = await sb.rpc('register_join_family', {
    invite_code: String(code).trim().toUpperCase(),
    p_prenom: prenom,
    p_nom: nom,
    p_role: role || 'MEMBRE'
  })
  if (regErr) throw new Error(regErr.message)
  if (!reg?.succes) throw new Error(reg?.message || 'Erreur rejoindre famille')

  const profile = await supabaseFetchProfile()
  return { session: authData.session, utilisateur: profile }
}

export async function supabaseSignIn({ email, password }) {
  const sb = getSupabase()
  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  })
  if (error) throw new Error(mapSupabaseAuthError(error))

  let profile = await supabaseFetchProfile()
  if (!profile) profile = await supabaseFinalizeProfileFromMetadata()

  if (!profile) {
    throw new Error(
      'Compte créé mais profil famille absent. Utilisez « Créer un compte » avec le même email pour finaliser, ou contactez l’administrateur.'
    )
  }
  return { session: data.session, utilisateur: profile }
}

export async function supabaseSignOut() {
  const sb = getSupabase()
  await sb.auth.signOut()
}

export async function supabaseResetPassword(email) {
  const sb = getSupabase()
  const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: authRedirectUrl('/reinitialiser-mot-de-passe')
  })
  if (error) throw new Error(error.message)
}

export async function supabaseUpdatePassword(newPassword) {
  const sb = getSupabase()
  const { error } = await sb.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

export async function supabaseFetchProfile() {
  const sb = getSupabase()
  const { data, error } = await sb.rpc('get_my_profile')
  if (error) throw new Error(error.message)
  if (!data?.succes) return null
  return mapProfileFromRpc(data)
}

export async function supabaseGetSession() {
  const sb = getSupabase()
  const { data } = await sb.auth.getSession()
  return data.session
}

export function persistSupabaseUser(utilisateur) {
  if (!utilisateur) return
  localStorage.setItem('utilisateur', JSON.stringify(utilisateur))
  if (utilisateur.code_invitation) {
    localStorage.setItem('mh_family_invite_code', utilisateur.code_invitation)
  }
  localStorage.removeItem('token')
}

export function clearSupabaseSession() {
  localStorage.removeItem('utilisateur')
  localStorage.removeItem('token')
  localStorage.removeItem('mh_family_invite_code')
}

export { isSupabaseMode }
