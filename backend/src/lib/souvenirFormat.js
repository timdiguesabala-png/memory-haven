function parseFichiersMultiple(value) {
  if (!value) return null
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

function formatSouvenir(souvenir) {
  if (!souvenir) return souvenir
  return {
    ...souvenir,
    fichiers_multiple: parseFichiersMultiple(souvenir.fichiers_multiple)
  }
}

function formatSouvenirs(souvenirs) {
  return souvenirs.map(formatSouvenir)
}

module.exports = { formatSouvenir, formatSouvenirs, parseFichiersMultiple }
