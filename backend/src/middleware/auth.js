const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const { buildTokenPayload } = require('../lib/jwtPayload')
const { getSupabase, supabaseConfigured } = require('../services/supabaseStorage')

async function loadUtilisateurFromDb(id) {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id },
    include: {
      famille: { select: { id: true, nom: true, is_active: true } }
    }
  })

  if (!utilisateur || !utilisateur.is_active) return null
  if (!utilisateur.famille?.is_active) return null

  return {
    ...buildTokenPayload(utilisateur),
    famille_id: utilisateur.famille_id,
    famille_nom: utilisateur.famille?.nom ?? null
  }
}

async function loadUtilisateurFromSupabaseToken(token) {
  if (!supabaseConfigured()) return null
  const sb = getSupabase()
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data?.user?.id) return null

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { auth_user_id: data.user.id, is_active: true },
    include: {
      famille: { select: { id: true, nom: true, is_active: true } }
    }
  })

  if (!utilisateur || !utilisateur.famille?.is_active) return null

  return {
    ...buildTokenPayload(utilisateur),
    famille_id: utilisateur.famille_id,
    famille_nom: utilisateur.famille?.nom ?? null,
    auth_mode: 'supabase'
  }
}

/**
 * Vérifie le JWT legacy ou le token Supabase, puis recharge l'utilisateur en base.
 */
const verifierToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      succes: false,
      message: 'Accès refusé — token manquant'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const utilisateur = await loadUtilisateurFromDb(decoded.id)
    if (!utilisateur) {
      return res.status(403).json({
        succes: false,
        message: 'Compte désactivé ou introuvable — reconnectez-vous'
      })
    }
    req.utilisateur = utilisateur
    return next()
  } catch {
    /* pas un JWT legacy — essayer Supabase */
  }

  try {
    const utilisateur = await loadUtilisateurFromSupabaseToken(token)
    if (utilisateur) {
      req.utilisateur = utilisateur
      return next()
    }
  } catch (err) {
    console.error('Auth Supabase:', err.message)
  }

  return res.status(403).json({
    succes: false,
    message: 'Token invalide ou expiré — reconnectez-vous'
  })
}

module.exports = { verifierToken, loadUtilisateurFromDb, loadUtilisateurFromSupabaseToken }
