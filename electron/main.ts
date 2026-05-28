import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { getDb, insertInterns, searchInterns, getAllInterns } from './db/index.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const xlsx = require('node-xlsx')
const Handlebars = require('handlebars')

type ColumnMapping = {
  dbFields: string[]
  split: boolean
}

const COLUMN_MAPPINGS: Record<string, ColumnMapping> = {
  'name of student/roll of institution': { dbFields: ['name', 'institution_roll'], split: true },
  'father/guardian': { dbFields: ['guardian_name'], split: false },
  'relationship': { dbFields: ['guardian_relation'], split: false },
  'branch/year': { dbFields: ['branch', 'year_of_study'], split: true },
  'date of internship': { dbFields: ['starting_date'], split: false },
  'no of days': { dbFields: ['no_of_days'], split: false },
  'section to be posted': { dbFields: ['section_posted'], split: false },
  'name of institution': { dbFields: ['institution_name'], split: false },
}

function normalize(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*\/\s*/, '/')
}

function parseDate(value: string | number): string {
  if (typeof value === 'number') {
    const epoch = new Date(1899, 11, 30)
    const date = new Date(epoch.getTime() + value * 86400000)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const parts = value.trim().split('/')
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts
    return `${yyyy}-${mm}-${dd}`
  }
  return value
}

function buildColumnNameIndex(headers: (string | number | null)[]): Map<number, ColumnMapping> {
  const map = new Map<number, ColumnMapping>()
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] == null) continue
    const normalized = normalize(String(headers[i]))
    const mapping = COLUMN_MAPPINGS[normalized]
    if (mapping) {
      map.set(i, mapping)
    }
  }
  return map
}

function processRow(
  row: (string | number | null)[],
  colIndex: Map<number, ColumnMapping>,
): Record<string, string | number> | null {
  const record: Record<string, string | number> = {}

  for (const [colIdx, mapping] of colIndex) {
    const rawValue = row[colIdx]
    if (rawValue == null) continue

    if (mapping.split) {
      const cellValue = String(rawValue).trim()
      if (cellValue === '') continue
      const parts = cellValue.split('/').map((p: string) => p.trim())
      for (let j = 0; j < mapping.dbFields.length; j++) {
        const field = mapping.dbFields[j]
        if (field === 'starting_date') {
          record[field] = parseDate(rawValue)
        } else if (field === 'no_of_days') {
          record[field] = parseInt(parts[j] ?? '0', 10)
        } else {
          record[field] = parts[j] ?? ''
        }
      }
    } else {
      const field = mapping.dbFields[0]
      if (field === 'starting_date') {
        record[field] = parseDate(rawValue)
      } else if (field === 'no_of_days') {
        record[field] = parseInt(String(rawValue), 10)
      } else {
        const cellValue = String(rawValue).trim()
        if (cellValue === '') continue
        record[field] = cellValue
      }
    }
  }

  if (!record.name && !record.institution_roll) return null

  return record
}

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  getDb()
  createWindow()
})

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: [
      { name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const filePath = result.filePaths[0]

  try {
    const sheets = xlsx.parse(filePath)
    const firstSheet = sheets[0]
    const columns: string[] = firstSheet.data[0].map(String)

    return { filePath, columns }
  } catch (err) {
    return { filePath, columns: [], error: String(err) }
  }
})

ipcMain.handle('import:excelData', async (_event, args: { filePath: string }) => {
  try {
    const sheets = xlsx.parse(args.filePath)
    const firstSheet = sheets[0]
    const rows = firstSheet.data as (string | number | null)[][]
    if (rows.length < 2) {
      return { imported: 0, error: 'File has no data rows' }
    }

    const headers = rows[0]
    const colIndex = buildColumnNameIndex(headers)
    if (colIndex.size === 0) {
      return { imported: 0, error: 'No recognized columns found' }
    }

    const internRows: Array<{
      name: string
      institution_roll: string
      guardian_name: string
      guardian_relation: string
      branch: string
      year_of_study: string
      starting_date: string
      no_of_days: number
      section_posted: string
      institution_name: string
    }> = []

    for (let i = 1; i < rows.length; i++) {
      const record = processRow(rows[i], colIndex)
      if (record) {
        internRows.push(record as typeof internRows[number])
      }
    }

    if (internRows.length === 0) {
      return { imported: 0, error: 'No valid rows found' }
    }

    const imported = insertInterns(internRows)
    return { imported }
  } catch (err) {
    return { imported: 0, error: String(err) }
  }
})

ipcMain.handle('search:interns', async (_event, filters: Record<string, string>) => {
  try {
    const results = searchInterns(filters)
    return { success: true, data: results, count: results.length }
  } catch (err) {
    return { success: false, error: String(err), data: [], count: 0 }
  }
})

ipcMain.handle('dashboard:getAllInterns', async () => {
  try {
    const interns = getAllInterns()
    return { success: true, data: interns, count: interns.length }
  } catch (err) {
    return { success: false, error: String(err), data: [], count: 0 }
  }
})

type InternData = {
  name: string
  institution_name: string
  starting_date: string
  no_of_days: number
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function computeEndDate(startDateStr: string, days: number): string {
  const start = new Date(startDateStr)
  const end = new Date(start)
  end.setDate(end.getDate() + days)
  return formatDate(end.toISOString().slice(0, 10))
}

function getTemplate(filename: string): string {
  return fs.readFileSync(path.join(__dirname, 'templates', filename), 'utf-8')
}

async function generatePDF(html: string): Promise<Buffer> {
  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false },
  })

  const encodedHtml = Buffer.from(html).toString('base64')
  await pdfWindow.loadURL(`data:text/html;base64,${encodedHtml}`)

  const pdfData = await pdfWindow.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
  })

  pdfWindow.close()
  return pdfData
}

async function generateDocument(
  intern: InternData,
  templateName: string,
  docLabel: string,
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const endDate = computeEndDate(intern.starting_date, intern.no_of_days)
  const templateContent = getTemplate(templateName)
  const compiled = Handlebars.compile(templateContent)
  const html = compiled({
    name: intern.name,
    institution_name: intern.institution_name,
    start_date: formatDate(intern.starting_date),
    end_date: endDate,
    signature_image: '',
  })

  const pdfData = await generatePDF(html)

  const result = await dialog.showSaveDialog(win!, {
    title: `Save ${docLabel}`,
    defaultPath: path.join(
      app.getPath('downloads'),
      `${docLabel.replace(/\s/g, '_')}_${intern.name}.pdf`,
    ),
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  })

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Save cancelled' }
  }

  fs.writeFileSync(result.filePath, pdfData)
  return { success: true, filePath: result.filePath }
}

ipcMain.handle('document:generateCertificate', async (_event, intern: InternData) => {
  try {
    return await generateDocument(intern, 'certificate.html', 'Certificate')
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('document:generateGatePass', async (_event, intern: InternData) => {
  try {
    return await generateDocument(intern, 'gatepass.html', 'Gate Pass')
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory', 'createDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0]
})

async function renderPDF(html: string, pdfWindow: BrowserWindow): Promise<Buffer> {
  const encodedHtml = Buffer.from(html).toString('base64')
  await pdfWindow.loadURL(`data:text/html;base64,${encodedHtml}`)
  return await pdfWindow.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
  })
}

ipcMain.handle(
  'document:bulkGenerate',
  async (_event, args: { folderPath: string; type: 'certificate' | 'gatepass' }) => {
    try {
      const interns = getAllInterns()
      const templateName =
        args.type === 'certificate' ? 'certificate.html' : 'gatepass.html'
      const docLabel =
        args.type === 'certificate' ? 'Certificate' : 'Gate_Pass'
      const templateContent = getTemplate(templateName)
      const compiled = Handlebars.compile(templateContent)
      const errors: string[] = []
      let generated = 0

      const pdfWindow = new BrowserWindow({
        show: false,
        webPreferences: { nodeIntegration: false },
      })

      for (const intern of interns) {
        try {
          const endDate = computeEndDate(
            intern.starting_date,
            intern.no_of_days,
          )
          const html = compiled({
            name: intern.name,
            institution_name: intern.institution_name,
            start_date: formatDate(intern.starting_date),
            end_date: endDate,
            signature_image: '',
          })
          const pdfData = await renderPDF(html, pdfWindow)
          const sanitized = intern.name
            .replace(/[<>:"/\\|?*]/g, '_')
            .trim()
          const filePath = path.join(
            args.folderPath,
            `${docLabel}_${sanitized}.pdf`,
          )
          fs.writeFileSync(filePath, pdfData)
          generated++
        } catch (err) {
          errors.push(`${intern.name}: ${String(err)}`)
        }
      }

      pdfWindow.close()
      return { success: true, generated, errors }
    } catch (err) {
      return { success: false, error: String(err), generated: 0, errors: [] }
    }
  },
)
