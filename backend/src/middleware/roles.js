const { estAdmin } = require('../lib/authHelpers')

function exigerEcriture(req, res, next) {
  if (req.utilisateur?.role === 'LECTEUR') {
    return res.status(403).json({
      succes: false,
      message: 'Compte lecture seule — cette action est réservée aux membres actifs'
    })
  }
  next()
}

/** CdC Annexe C — les lecteurs n'ont pas accès à la discussion */
function exigerAccesDiscussion(req, res, next) {
  if (req.utilisateur?.role === 'LECTEUR') {
    return res.status(403).json({
      succes: false,
      message: 'La discussion familiale est réservée aux membres actifs'
    })
  }
  next()
}

function exigerAdmin(req, res, next) {
  if (!estAdmin(req.utilisateur?.role)) {
    return res.status(403).json({
      succes: false,
      message: 'Action réservée aux administrateurs'
    })
  }
  next()
}

module.exports = { exigerEcriture, exigerAdmin, exigerAccesDiscussion }
