const jwt = require('jsonwebtoken')

const verifierToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      succes: false,
      message: 'Accès refusé — token manquant'
    })
  }

  try {
    const utilisateur = jwt.verify(token, process.env.JWT_SECRET)
    req.utilisateur = utilisateur
    next()
  } catch (erreur) {
    return res.status(403).json({
      succes: false,
      message: 'Token invalide ou expiré'
    })
  }
}

module.exports = { verifierToken }