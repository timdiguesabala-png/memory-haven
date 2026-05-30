/** Recalcule statut_lecture des messages envoyés par l'utilisateur courant. */
export function applyReadCursors(messages, myId, readCursors, otherMemberIds) {
  const cursorMap = new Map(
    (readCursors || []).map((c) => [Number(c.utilisateur_id), Number(c.last_message_id) || 0])
  )
  const others = (otherMemberIds || []).map(Number).filter((id) => id !== Number(myId))

  return messages.map((msg) => {
    if (!sameUser(msg.auteur_id, myId)) return msg
    const lu =
      !others.length ||
      others.every((uid) => (cursorMap.get(uid) || 0) >= Number(msg.id))
    return { ...msg, statut_lecture: lu ? 'lu' : 'envoye' }
  })
}

function sameUser(a, b) {
  return Number(a) === Number(b)
}

export function mergeCursor(readCursors, utilisateur_id, last_message_id) {
  const id = Number(utilisateur_id)
  const last = Number(last_message_id) || 0
  const list = [...(readCursors || [])]
  const idx = list.findIndex((c) => Number(c.utilisateur_id) === id)
  if (idx >= 0) {
    if (last > (list[idx].last_message_id || 0)) list[idx] = { utilisateur_id: id, last_message_id: last }
  } else {
    list.push({ utilisateur_id: id, last_message_id: last })
  }
  return list
}
