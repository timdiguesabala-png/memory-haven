/**
 * Génère CAHIER-DES-CHARGES-MEMORY-HAVEN.docx depuis le Markdown.
 * Usage: node scripts/generate-cdc-docx.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle
} from 'docx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mdPath = join(root, 'CAHIER-DES-CHARGES-MEMORY-HAVEN.md')
const docxPath = join(root, 'CAHIER-DES-CHARGES-MEMORY-HAVEN.docx')

const md = readFileSync(mdPath, 'utf8')
const lines = md.split('\n')
const children = []

function headingLevel(line) {
  if (line.startsWith('#### ')) return HeadingLevel.HEADING_4
  if (line.startsWith('### ')) return HeadingLevel.HEADING_3
  if (line.startsWith('## ')) return HeadingLevel.HEADING_2
  if (line.startsWith('# ')) return HeadingLevel.HEADING_1
  return null
}

function stripMdInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function parseTableRows(tableLines) {
  return tableLines
    .filter((l) => l.trim().startsWith('|') && !/^\|\s*[-:]/.test(l))
    .map((l) =>
      l
        .slice(1, l.endsWith('|') ? -1 : undefined)
        .split('|')
        .map((c) => stripMdInline(c.trim()))
    )
}

function tableFromRows(rows) {
  if (!rows.length) return null
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (cells, ri) =>
        new TableRow({
          children: cells.map(
            (text) =>
              new TableCell({
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 }
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text,
                        bold: ri === 0,
                        size: 20
                      })
                    ]
                  })
                ]
              })
          )
        })
    )
  })
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  if (line.startsWith('```')) {
    const code = []
    i++
    while (i < lines.length && !lines[i].startsWith('```')) {
      code.push(lines[i])
      i++
    }
    if (code.length) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: code.join('\n'), font: 'Consolas', size: 18 })],
          spacing: { before: 120, after: 120 }
        })
      )
    }
    continue
  }

  if (line.trim().startsWith('|')) {
    const tableLines = [line]
    while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
      i++
      tableLines.push(lines[i])
    }
    const table = tableFromRows(parseTableRows(tableLines))
    if (table) children.push(table)
    continue
  }

  const hl = headingLevel(line)
  if (hl) {
    children.push(
      new Paragraph({
        text: stripMdInline(line.replace(/^#+\s*/, '')),
        heading: hl,
        spacing: { before: hl === HeadingLevel.HEADING_1 ? 240 : 180, after: 120 }
      })
    )
    continue
  }

  if (line.trim() === '---') {
    children.push(new Paragraph({ text: '—'.repeat(40), spacing: { before: 120, after: 120 } }))
    continue
  }

  if (line.trim().startsWith('- ')) {
    children.push(
      new Paragraph({
        text: stripMdInline(line.replace(/^-\s*/, '• ')),
        spacing: { after: 60 }
      })
    )
    continue
  }

  if (!line.trim()) continue

  children.push(
    new Paragraph({
      children: [new TextRun({ text: stripMdInline(line), size: 22 })],
      spacing: { after: 80 }
    })
  )
}

const doc = new Document({
  creator: 'Memory Haven',
  title: 'Cahier des charges — Memory Haven',
  description: 'Cahier des charges logiciel v1.0',
  sections: [{ properties: {}, children }]
})

const buffer = await Packer.toBuffer(doc)
writeFileSync(docxPath, buffer)
console.log('DOCX:', docxPath)
