const { estAdmin } = require('./authHelpers')

const VALEURS = ['FAMILLE', 'MEMBRES_PROCHES', 'ADMINS']

function normaliserVisibilite(valeur, role) {
  let vis = typeof valeur === 'string' ? valeur.trim().toUpperCase() : 'FAMILLE'
  if (!VALEURS.includes(vis)) vis = 'FAMILLE'
  if (vis === 'ADMINS' && !estAdmin(role)) vis = 'FAMILLE'
  if (vis === 'MEMBRES_PROCHES' && role === 'LECTEUR') vis = 'FAMILLE'
  return vis
}

module.exports = { VALEURS, normaliserVisibilite }
