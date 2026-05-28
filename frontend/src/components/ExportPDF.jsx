import { useState } from 'react'
import html2pdf from 'html2pdf.js'

export default function ExportPDF({ data, familleNom, type = 'souvenirs' }) {
  const [exporting, setExporting] = useState(false)

  const generatePDF = async () => {
    setExporting(true)

    let title = ''
    let contentHtml = ''

    if (type === 'souvenirs') {
      title = `🏡 Souvenirs de ${familleNom}`
      contentHtml = data.map(s => `
        <div class="souvenir">
          <div class="souvenir-title">${escapeHtml(s.titre)}</div>
          <div class="souvenir-meta">
            📅 ${new Date(s.date_souvenir).toLocaleDateString('fr-FR')} 
            ${s.auteur ? ` · 👤 ${s.auteur.prenom} ${s.auteur.nom}` : ''}
            ${s.type ? ` · 🏷️ ${s.type}` : ''}
          </div>
          ${s.description ? `<div class="souvenir-description">${escapeHtml(s.description)}</div>` : ''}
          ${s.lieu ? `<div class="souvenir-lieu">📍 ${escapeHtml(s.lieu)}</div>` : ''}
          ${s.tags && s.tags.length > 0 ? `
            <div class="souvenir-tags">
              ${s.tags.map(t => `<span class="tag">#${escapeHtml(t.tag?.libelle || t)}</span>`).join('')}
            </div>
          ` : ''}
          ${s.fichier_url && s.type === 'PHOTO' ? `<img src="${s.fichier_url}" class="souvenir-image" />` : ''}
        </div>
      `).join('')
    } else if (type === 'discussion') {
      title = `💬 Discussion de ${familleNom}`
      contentHtml = data.map(msg => `
        <div class="message">
          <div class="message-author">${msg.auteur?.prenom || '?'} ${msg.auteur?.nom || ''}</div>
          <div class="message-content">${escapeHtml(msg.contenu)}</div>
          <div class="message-date">${new Date(msg.created_at).toLocaleString('fr-FR')}</div>
        </div>
      `).join('')
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #5B4D9E; text-align: center; border-bottom: 2px solid #C5B8E0; padding-bottom: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .date-export { color: #4A4568; font-size: 12px; margin-top: 5px; }
          .souvenir { border: 1px solid #C5B8E0; border-radius: 10px; margin-bottom: 20px; padding: 15px; page-break-inside: avoid; }
          .souvenir-title { font-size: 18px; font-weight: bold; color: #2A2640; margin-bottom: 5px; }
          .souvenir-meta { font-size: 12px; color: #7A7394; margin-bottom: 10px; }
          .souvenir-description { font-size: 14px; line-height: 1.5; margin-bottom: 10px; }
          .souvenir-lieu { font-size: 12px; color: #4A4568; margin-bottom: 5px; }
          .souvenir-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
          .tag { background: #EDE8F5; color: #4A4568; font-size: 11px; padding: 2px 8px; border-radius: 10px; }
          .souvenir-image { margin-top: 10px; max-width: 100%; max-height: 300px; border-radius: 8px; }
          .message { border-bottom: 1px solid #C5B8E0; padding: 10px 0; page-break-inside: avoid; }
          .message-author { font-weight: bold; color: #5B4D9E; margin-bottom: 5px; }
          .message-content { font-size: 14px; line-height: 1.4; margin-bottom: 5px; }
          .message-date { font-size: 11px; color: #7A7394; }
          .footer { text-align: center; font-size: 11px; color: #7A7394; margin-top: 30px; border-top: 1px solid #C5B8E0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="date-export">Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
        </div>
        ${contentHtml}
        <div class="footer">Généré par Memory Haven · ${data.length} élément${data.length > 1 ? 's' : ''}</div>
      </body>
      </html>
    `

    const element = document.createElement('div')
    element.innerHTML = html

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `${type}_${familleNom.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(element).save()
    setExporting(false)
  }

  const escapeHtml = (text) => {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  return (
    <button onClick={generatePDF} disabled={exporting} style={styles.btn}>
      {exporting ? '⏳ Génération...' : '📄 Exporter PDF'}
    </button>
  )
}

const styles = {
  btn: {
    background: '#5B4D9E',
    color: '#FFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500'
  }
}