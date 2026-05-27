const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')

const router = express.Router()

function echapperHtml(texte) {
  if (!texte) return ''
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// GET /api/export/pdf — page HTML imprimable (sans Puppeteer)
router.get('/pdf', verifierToken, async (req, res) => {
  try {
    const [souvenirs, famille] = await Promise.all([
      prisma.souvenir.findMany({
        where: { famille_id: req.utilisateur.famille_id, is_visible: true },
        include: { auteur: { select: { prenom: true, nom: true } } },
        orderBy: { date_souvenir: 'desc' }
      }),
      prisma.famille.findUnique({
        where: { id: req.utilisateur.famille_id },
        select: { nom: true }
      })
    ])

    const nomFamille = echapperHtml(famille?.nom || 'Memory Haven')
    const cartes = souvenirs.map((s) => `
      <article class="souvenir">
        <h3>${echapperHtml(s.titre)}</h3>
        ${s.description ? `<p>${echapperHtml(s.description)}</p>` : ''}
        <p class="meta">
          ${new Date(s.date_souvenir).toLocaleDateString('fr-FR')}
          · ${echapperHtml(s.auteur.prenom)} ${echapperHtml(s.auteur.nom)}
          · ${echapperHtml(s.type)}
        </p>
        ${s.fichier_url ? `<img src="${echapperHtml(s.fichier_url)}" alt="" />` : ''}
      </article>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Souvenirs — ${nomFamille}</title>
  <style>
    body { font-family: Georgia, serif; color: #3D2410; background: #FDF6EE; padding: 2rem; }
    h1 { color: #9B6240; border-bottom: 2px solid #C8956C; padding-bottom: 0.5rem; }
    .souvenir { background: #FFF9F3; border: 1px solid #E8C9A0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
    .meta { font-size: 12px; color: #7A5035; }
    img { max-width: 100%; border-radius: 8px; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <h1>Souvenirs de ${nomFamille}</h1>
  <p>Exporté le ${new Date().toLocaleDateString('fr-FR')} — ${souvenirs.length} souvenir(s)</p>
  ${cartes || '<p>Aucun souvenir à exporter.</p>'}
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', 'inline; filename="souvenirs-export.html"')
    res.send(html)
  } catch (err) {
    console.error('Erreur export PDF:', err)
    res.status(500).json({ succes: false, message: 'Erreur export' })
  }
})

module.exports = router
