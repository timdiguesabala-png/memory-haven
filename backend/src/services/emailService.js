/**
 * Envoi d'emails transactionnels (invitations) — optionnel via SMTP.
 * Variables : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 */
const nodemailer = require('nodemailer')

let transporter = null

function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM)
}

function getTransporter() {
  if (!emailConfigured()) return null
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined
    })
  }
  return transporter
}

/**
 * @returns {{ sent: boolean, reason?: string }}
 */
async function sendInviteEmail({ to, prenomInviteur, nomFamille, lien, role }) {
  const transport = getTransporter()
  if (!transport) {
    return { sent: false, reason: 'SMTP non configuré (SMTP_HOST, MAIL_FROM)' }
  }

  const roleLabel = { MEMBRE: 'membre', LECTEUR: 'lecteur', ADMIN: 'administrateur' }[role] || 'membre'

  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: String(to).trim().toLowerCase(),
    subject: `${prenomInviteur || 'Un proche'} vous invite sur Memory Haven`,
    text: [
      `Bonjour,`,
      ``,
      `${prenomInviteur || 'Un membre'} vous invite à rejoindre la famille « ${nomFamille} » sur Memory Haven.`,
      `Rôle proposé : ${roleLabel}.`,
      ``,
      `Cliquez pour créer votre accès :`,
      lien,
      ``,
      `Memory Haven — plateforme familiale de souvenirs`
    ].join('\n'),
    html: `
      <p>Bonjour,</p>
      <p><strong>${prenomInviteur || 'Un membre'}</strong> vous invite à rejoindre la famille
      <strong>« ${nomFamille} »</strong> sur Memory Haven.</p>
      <p>Rôle proposé : <strong>${roleLabel}</strong>.</p>
      <p><a href="${lien}" style="display:inline-block;padding:12px 24px;background:#5b4d9e;color:#fff;text-decoration:none;border-radius:8px;">Rejoindre ma famille</a></p>
      <p style="font-size:12px;color:#666;">Ou copiez ce lien : ${lien}</p>
    `
  })

  return { sent: true }
}

module.exports = { emailConfigured, sendInviteEmail }
