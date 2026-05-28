const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const { buildTokenPayload } = require('../lib/jwtPayload')

/**
 * Vérifie le JWT puis recharge l'utilisateur en base (famille_id à jour).
 * Évite qu'un membre invité reste lié à une ancienne famille dans le token.
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

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: decoded.id },
      include: {
        famille: { select: { id: true, nom: true, is_active: true } }
      }
    })

    if (!utilisateur || !utilisateur.is_active) {
      return res.status(403).json({
        succes: false,
        message: 'Compte désactivé ou introuvable — reconnectez-vous'
      })
    }

    if (!utilisateur.famille?.is_active) {
      return res.status(403).json({
        succes: false,
        message: 'Espace famille désactivé'
      })
    }

    req.utilisateur = {
      ...buildTokenPayload(utilisateur),
      famille_id: utilisateur.famille_id,
      famille_nom: utilisateur.famille?.nom ?? null
    }

    next()
  } catch (erreur) {
    return res.status(403).json({
      succes: false,
      message: 'Token invalide ou expiré — reconnectez-vous'
    })
  }
}

module.exports = { verifierToken }
