/**
 * Génère CAHIER-DES-CHARGES-MEMORY-HAVEN.pdf depuis le Markdown.
 * Usage: node scripts/generate-cdc-pdf.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mdPath = join(root, 'CAHIER-DES-CHARGES-MEMORY-HAVEN.md')
const htmlPath = join(root, 'CAHIER-DES-CHARGES-MEMORY-HAVEN.html')
const pdfPath = join(root, 'CAHIER-DES-CHARGES-MEMORY-HAVEN.pdf')

const md = readFileSync(mdPath, 'utf8')

// Conversion Markdown minimale (titres, tableaux, listes, code, gras)
function mdToHtml(src) {
  let html = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/^```mermaid\n([\s\S]*?)```/gm, (_, code) => {
    return `<pre class="mermaid-placeholder"><code>${code.trim()}</code></pre>`
  })
  html = html.replace(/^```[\w]*\n([\s\S]*?)```/gm, (_, code) => `<pre><code>${code}</code></pre>`)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/^---$/gm, '<hr/>')
  html = html.replace(/^\| (.+)$/gm, (line) => {
    if (line.includes('---')) return ''
    const cells = line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim())
    return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`
  })
  html = html.replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (block) => `<table>${block}</table>`)
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)

  const lines = html.split('\n')
  const out = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      out.push('')
      continue
    }
    if (/^<(h[1-6]|table|tr|ul|li|pre|hr)/.test(t)) out.push(line)
    else out.push(`<p>${line}</p>`)
  }
  return out.join('\n')
}

const body = mdToHtml(md)

const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Cahier des charges — Memory Haven</title>
  <style>
    @page { margin: 2cm; size: A4; }
    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #1e2d3d;
      max-width: 100%;
    }
    h1 { font-size: 22pt; color: #5b4d9e; border-bottom: 2px solid #5b4d9e; padding-bottom: 0.3em; page-break-after: avoid; }
    h2 { font-size: 16pt; color: #3d5a80; margin-top: 1.4em; page-break-after: avoid; }
    h3 { font-size: 13pt; color: #2a2640; page-break-after: avoid; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 10pt; page-break-inside: avoid; }
    th, td { border: 1px solid #c5b8e0; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f3f0fa; font-weight: 600; }
    tr:nth-child(even) td { background: #faf9fc; }
    pre { background: #f5f5f5; padding: 10px; overflow-x: auto; font-size: 9pt; border-radius: 6px; page-break-inside: avoid; }
    .mermaid-placeholder { border-left: 4px solid #5b4d9e; background: #f8f6fc; }
    ul { margin: 0.5em 0 1em 1.2em; }
    li { margin: 0.25em 0; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
    p { margin: 0.4em 0; }
    strong { color: #2a2640; }
  </style>
</head>
<body>
${body}
</body>
</html>`

writeFileSync(htmlPath, fullHtml, 'utf8')
console.log('HTML:', htmlPath)

const chromePaths = [
  process.env['PROGRAMFILES'] + '\\Google\\Chrome\\Application\\chrome.exe',
  process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
  process.env['LOCALAPPDATA'] + '\\Google\\Chrome\\Application\\chrome.exe',
  process.env['PROGRAMFILES'] + '\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean)

let chrome = chromePaths.find((p) => {
  try {
    readFileSync(p)
    return true
  } catch {
    return false
  }
})

if (!chrome) {
  console.error('Chrome/Edge introuvable. Ouvrez le fichier HTML et imprimez en PDF :')
  console.error(htmlPath)
  process.exit(1)
}

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/')
execSync(
  `"${chrome}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${fileUrl}"`,
  { stdio: 'inherit', timeout: 120000 }
)
console.log('PDF:', pdfPath)
