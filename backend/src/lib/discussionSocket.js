const { getIo } = require('../socket')
const { reactionsForClient } = require('./discussionReactions')
const { enrichMessageFields } = require('./discussionMediaEmbed')

function mapMessage(m, extra = {}) {
  const enriched = enrichMessageFields(m)
  return {
    id: enriched.id,
    contenu: enriched.contenu || '',
    image_url: enriched.image_url || null,
    audio_url: enriched.audio_url || null,
    audio_duration: enriched.audio_duration ?? null,
    reactions: reactionsForClient(enriched.reactions_json),
    auteur_id: enriched.utilisateur_id,
    auteur: enriched.utilisateur,
    created_at: enriched.createdAt,
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
