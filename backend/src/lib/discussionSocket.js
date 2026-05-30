const { getIo } = require('../socket')
const { reactionsForClient } = require('./discussionReactions')

function mapMessage(m, extra = {}) {
  return {
    id: m.id,
    contenu: m.contenu || '',
    image_url: m.image_url || null,
    audio_url: m.audio_url || null,
    audio_duration: m.audio_duration ?? null,
    reactions: reactionsForClient(m.reactions_json),
    auteur_id: m.utilisateur_id,
    auteur: m.utilisateur,
    created_at: m.createdAt,
    statut_lecture: extra.statut_lecture ?? null
  }
}

function emitNewMessage(familleId, message, extra = {}) {
  const io = getIo()
  if (!io) return
  const payload = mapMessage(message, {
    statut_lecture: extra.statut_lecture ?? 'envoye'
  })
  io.to(`famille_${familleId}`).emit('new_message', payload)
}

function emitMessageUpdated(familleId, message, extra = {}) {
  const io = getIo()
  if (!io) return
  io.to(`famille_${familleId}`).emit('message_updated', mapMessage(message, extra))
}

function emitMessageDeleted(familleId, messageId) {
  const io = getIo()
  if (!io) return
  io.to(`famille_${familleId}`).emit('message_deleted', { id: messageId })
}

function emitDiscussionRead(familleId, payload) {
  const io = getIo()
  if (!io) return
  io.to(`famille_${familleId}`).emit('discussion_read', payload)
}

module.exports = {
  mapMessage,
  emitNewMessage,
  emitMessageUpdated,
  emitMessageDeleted,
  emitDiscussionRead
}
