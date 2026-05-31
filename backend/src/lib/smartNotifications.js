const prisma = require('./prisma')
const { creerNotification } = require('../routes/notifications')

function daysUntilBirthday(dateNaissance) {
  if (!dateNaissance) return null
  const now = new Date()
  const birth = new Date(dateNaissance)
  let next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  if (next < now) next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate())
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24))
}

async function alreadyNotifiedToday(destinataireId, typePrefix) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const count = await prisma.notification.count({
    where: {
      destinataire_id: destinataireId,
      type: { startsWith: typePrefix },
      created_at: { gte: start }
    }
  })
  return count > 0
}

async function notifyBirthdays(familleId) {
  const membres = await prisma.utilisateur.findMany({
    where: { famille_id: familleId, is_active: true },
    select: { id: true, prenom: true, nom: true }
  })
  const arbre = await prisma.membreArbre.findMany({
    where: { famille_id: familleId, is_visible: true, date_naissance: { not: null } },
    select: { id: true, nom: true, date_naissance: true }
  })

  for (const m of arbre) {
    const jours = daysUntilBirthday(m.date_naissance)
    if (jours !== 0 && jours !== 7 && jours !== 1) continue
    const label =
      jours === 0
        ? `🎂 Aujourd'hui : anniversaire de ${m.nom} !`
        : jours === 1
          ? `🎂 Demain : anniversaire de ${m.nom}`
          : `🎂 Dans 7 jours : anniversaire de ${m.nom}`

    for (const u of membres) {
      if (await alreadyNotifiedToday(u.id, 'ANNIVERSAIRE')) continue
      await creerNotification(u.id, 'ANNIVERSAIRE', label, null)
    }
  }
}

async function notifyCapsulesOpened(familleId) {
  const now = new Date()
  const capsules = await prisma.capsuleTemporelle.findMany({
    where: {
      famille_id: familleId,
      is_visible: true,
      ouverte: false,
      date_ouverture: { lte: now }
    }
  })

  if (!capsules.length) return

  await prisma.capsuleTemporelle.updateMany({
    where: { id: { in: capsules.map((c) => c.id) } },
    data: { ouverte: true }
  })

  const membres = await prisma.utilisateur.findMany({
    where: { famille_id: familleId, is_active: true },
    select: { id: true }
  })

  for (const cap of capsules) {
    const msg = `⏳ La capsule « ${cap.titre} » vient de s'ouvrir !`
    for (const u of membres) {
      if (await alreadyNotifiedToday(u.id, 'CAPSULE')) continue
      await creerNotification(u.id, 'CAPSULE', msg, null)
    }
  }
}

async function notifyUpcomingEvents(familleId) {
  const now = new Date()
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const events = await prisma.evenementFamilial.findMany({
    where: {
      famille_id: familleId,
      is_visible: true,
      date_debut: { gte: now, lte: in7 }
    }
  })
  if (!events.length) return

  const membres = await prisma.utilisateur.findMany({
    where: { famille_id: familleId, is_active: true },
    select: { id: true }
  })

  for (const ev of events) {
    const msg = `📅 Événement à venir : ${ev.titre} (${new Date(ev.date_debut).toLocaleDateString('fr-FR')})`
    for (const u of membres) {
      if (await alreadyNotifiedToday(u.id, 'EVENEMENT')) continue
      await creerNotification(u.id, 'EVENEMENT', msg, null)
    }
  }
}

async function runSmartNotificationsForFamille(familleId) {
  try {
    await notifyBirthdays(familleId)
    await notifyCapsulesOpened(familleId)
    await notifyUpcomingEvents(familleId)
  } catch (err) {
    console.warn('Smart notifications:', err.message)
  }
}

async function runSmartNotificationsAll() {
  try {
    const familles = await prisma.famille.findMany({
      where: { is_active: true },
      select: { id: true }
    })
    for (const f of familles) {
      await runSmartNotificationsForFamille(f.id)
    }
  } catch (err) {
    console.warn('Smart notifications (all):', err.message)
  }
}

module.exports = { runSmartNotificationsForFamille, runSmartNotificationsAll, daysUntilBirthday }
