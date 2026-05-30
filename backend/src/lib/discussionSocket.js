const { getIo } = require('../socket')
const { reactionsForClient } = require('./discussionReactions')

function mapMessage(m) {
  return {
    id: m.id,
    contenu: m.contenu || '',
    image_url: m.image_url || null,
    reactions: reactionsForClient(m.reactions_json),
    auteur_id: m.utilisateur_id,
    auteur: m.utilisateur,
    created_at: m.createdAt
  }
}

function emitNewMessage(familleId, message) {
  const io = getIo()
  if (!io) return
  io.to(`famille_${familleId}`).emit('new_message', mapMessage(message))
}

function emitMessageUpdated(familleId, message) {
  const io = getIo()
  if (!io) return
  io.to(`famille_${familleId}`).emit('message_updated', mapMessage(message))
}

function emitMessageDeleted(familleId, messageId) {
  const io = getIo()
  if (!io) return
  io.to(`famille_${familleId}`).emit('message_deleted', { id: messageId })
}

module.exports = { mapMessage, emitNewMessage, emitMessageUpdated, emitMessageDeleted }
