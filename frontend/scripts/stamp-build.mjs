/**
 * Met à jour le commentaire mh-build dans index.html depuis appVersion.js
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const versionFile = join(root, 'src/lib/appVersion.js')
const indexFile = join(root, 'index.html')

const src = readFileSync(versionFile, 'utf8')
const m = src.match(/export const APP_BUILD = '([^']+)'/)
if (!m) {
  console.error('APP_BUILD introuvable dans appVersion.js')
  process.exit(1)
}
const build = m[1]

let html = readFileSync(indexFile, 'utf8')
if (html.includes('<!-- mh-build:')) {
  html = html.replace(/<!-- mh-build:[^>]+ -->/, `<!-- mh-build:${build} -->`)
} else {
  html = html.replace('</title>', `</title>\n    <!-- mh-build:${build} -->`)
}
writeFileSync(indexFile, html)
console.log(`index.html → mh-build:${build}`)
