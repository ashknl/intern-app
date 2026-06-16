import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getDb, insertInterns, searchInterns, getAllInterns, getUserByUsername, insertManualIntern, getAllUsers, createUser, getAllOfficers, insertOfficer, deleteOfficer, getDistinctColumn, getAllFeedbacks, insertFeedback, deleteFeedback } from './db/index.js'
import { generateGatePass, bulkGenerateGatePasses, generateInternshipOffer, generateSectionAttachment, generateCertificate, type InternData, type InternshipOfferData } from './documents.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const xlsx = require('node-xlsx')
const bcryptjs = require('bcryptjs')

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

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory', 'createDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0]
})

ipcMain.handle('document:generateGatePass', async (_event, intern: InternData) => {
  return await generateGatePass(intern, win!)
})

ipcMain.handle('document:bulkGenerateGatePass', async (_event, args: { folderPath: string }) => {
  try {
    const interns = getAllInterns() as InternData[]
    return await bulkGenerateGatePasses(interns, args.folderPath)
  } catch (err) {
    return { success: false, error: String(err), generated: 0, errors: [] }
  }
})

ipcMain.handle('document:generateInternshipOffer', async (_event, args: {
  intern: InternshipOfferData
  applicationDate: string
  nocDate: string
  officerName: string
  officerDesignation: string
}) => {
  try {
    const serial = String(args.intern.id ?? '')
    return await generateInternshipOffer(args.intern, {
      name: args.officerName,
      designation: args.officerDesignation,
    }, {
      applicationDate: args.applicationDate,
      nocDate: args.nocDate,
      serial,
    }, win!)
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('document:generateSectionAttachment', async (_event, args: {
  intern: InternData & { degree?: string; branch?: string; section_posted?: string }
  gmApprovalDate: string
}) => {
  try {
    return await generateSectionAttachment(args.intern, {
      gmApprovalDate: args.gmApprovalDate,
    }, win!)
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('document:generateCertificate', async (_event, args: {
  intern: InternData
  workAreas: string[]
  rating: string
  officerName: string
  officerDesignation: string
}) => {
  try {
    return await generateCertificate(args.intern, {
      name: args.officerName,
      designation: args.officerDesignation,
    }, {
      workAreas: args.workAreas,
      rating: args.rating,
    }, win!)
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('auth:login', async (_event, args: { username: string; password: string }) => {
  try {
    const user = getUserByUsername(args.username)
    if (!user) {
      return { success: false, error: 'Invalid username or password.' }
    }
    const match = bcryptjs.compareSync(args.password, user.password_hash)
    if (!match) {
      return { success: false, error: 'Invalid username or password.' }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('manual:register', async (_event, args: { formData: Record<string, string>; registration_id: string }) => {
  try {
    insertManualIntern({
      name: args.formData.name,
      gender: args.formData.gender,
      identification_mark: args.formData.identification_mark,
      institution_roll: args.formData.institution_roll,
      degree: args.formData.degree,
      branch: args.formData.branch,
      year_of_study: args.formData.year_of_study,
      guardian_name: args.formData.guardian_name,
      guardian_relation: args.formData.guardian_relation,
      res_c_o: args.formData.res_c_o,
      res_p_o: args.formData.res_p_o,
      res_pin: args.formData.res_pin,
      res_contact: args.formData.res_contact,
      cur_c_o: args.formData.cur_c_o,
      cur_p_o: args.formData.cur_p_o,
      cur_pin: args.formData.cur_pin,
      cur_contact: args.formData.cur_contact,
      starting_date: args.formData.starting_date,
      no_of_days: Number(args.formData.no_of_days),
      section_posted: args.formData.section_posted,
      institution_name: args.formData.institution_name,
      registration_id: args.registration_id,
    })
    return { success: true, registration_id: args.registration_id }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('admin:getAllUsers', async () => {
  try {
    const users = getAllUsers()
    return { success: true, data: users, count: users.length }
  } catch (err) {
    return { success: false, error: String(err), data: [], count: 0 }
  }
})

ipcMain.handle('admin:createUser', async (_event, args: {
  username: string
  password: string
  securityQuestion: string
  securityAnswer: string
}) => {
  try {
    const passwordHash = bcryptjs.hashSync(args.password, 10)
    const answerHash = bcryptjs.hashSync(args.securityAnswer, 10)
    createUser(args.username, passwordHash, args.securityQuestion, answerHash)
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('admin:getAllOfficers', async () => {
  try {
    const officers = getAllOfficers()
    return { success: true, data: officers, count: officers.length }
  } catch (err) {
    return { success: false, error: String(err), data: [], count: 0 }
  }
})

ipcMain.handle('admin:insertOfficer', async (_event, args: {
  officerName: string
  officerDesignation: string
}) => {
  try {
    const id = insertOfficer(args.officerName, args.officerDesignation)
    return { success: true, id }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('admin:deleteOfficer', async (_event, args: { id: number }) => {
  try {
    const deleted = deleteOfficer(args.id)
    if (!deleted) {
      return { success: false, error: 'Officer not found.' }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('search:distinctValues', async (_event, args: { column: string }) => {
  try {
    const values = getDistinctColumn(args.column)
    return { success: true, data: values }
  } catch (err) {
    return { success: false, error: String(err), data: [] }
  }
})

ipcMain.handle('feedback:getAllFeedbacks', async () => {
  try {
    const feedbacks = getAllFeedbacks()
    return { success: true, data: feedbacks, count: feedbacks.length }
  } catch (err) {
    return { success: false, error: String(err), data: [], count: 0 }
  }
})

ipcMain.handle('feedback:insertFeedback', async (_event, args: {
  internId: number
  feedbackText: string
}) => {
  try {
    insertFeedback(args.internId, args.feedbackText)
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('feedback:deleteFeedback', async (_event, args: { internId: number }) => {
  try {
    const deleted = deleteFeedback(args.internId)
    if (!deleted) {
      return { success: false, error: 'Feedback not found.' }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})
