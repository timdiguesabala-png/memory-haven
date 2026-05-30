const ALLOWED_EMOJI = ['👍', '❤️', '😂', '😮', '😢', '🙏']

function parseReactions(json) {
  if (!json) return {}
  try {
    const o = typeof json === 'string' ? JSON.parse(json) : json
    return o && typeof o === 'object' ? o : {}
  } catch {
    return {}
  }
}

function reactionsForClient(json) {
  const raw = parseReactions(json)
  const list = []
  for (const [emoji, userIds] of Object.entries(raw)) {
    if (!ALLOWED_EMOJI.includes(emoji) || !Array.isArray(userIds)) continue
    const ids = [...new Set(userIds.map((id) => Number(id)).filter(Boolean))]
    if (ids.length) list.push({ emoji, count: ids.length, user_ids: ids })
  }
  return list
}

function toggleReaction(json, userId, emoji) {
  if (!ALLOWED_EMOJI.includes(emoji)) {
    const err = new Error('Réaction non autorisée')
    err.status = 400
    throw err
  }
  const data = parseReactions(json)
  const uid = Number(userId)
  const ids = Array.isArray(data[emoji]) ? [...data[emoji].map(Number)] : []
  const idx = ids.indexOf(uid)
  if (idx >= 0) {
    ids.splice(idx, 1)
  } else {
    ids.push(uid)
  }
  if (ids.length) data[emoji] = ids
  else delete data[emoji]
  return JSON.stringify(data)
}

module.exports = { ALLOWED_EMOJI, parseReactions, reactionsForClient, toggleReaction }
