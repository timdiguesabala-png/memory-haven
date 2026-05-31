/**
 * Génère les PNG PWA à partir des SVG (nécessite sharp).
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = join(root, 'public', 'icons')

async function main() {
  const sharp = (await import('sharp')).default
  const svg = readFileSync(join(iconsDir, 'icon.svg'))
  const maskable = readFileSync(join(iconsDir, 'icon-maskable.svg'))

  await sharp(svg).resize(192, 192).png().toFile(join(iconsDir, 'icon-192.png'))
  await sharp(svg).resize(512, 512).png().toFile(join(iconsDir, 'icon-512.png'))
  await sharp(maskable).resize(512, 512).png().toFile(join(iconsDir, 'icon-512-maskable.png'))

  console.log('PWA icons generated in public/icons/')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
