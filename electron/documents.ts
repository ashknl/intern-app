import { app, BrowserWindow, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const Handlebars = require('handlebars')

export interface InternData {
  id?: number
  name: string
  guardian_name: string
  institution_name: string
  starting_date: string
  no_of_days: number
  degree?: string
  branch?: string
  identification_mark?: string
  gender?: string
  section_posted?: string
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function computeEndDate(startDateStr: string, days: number): string {
  const start = new Date(startDateStr)
  const end = new Date(start)
  end.setDate(end.getDate() + days)
  return formatDate(end.toISOString().slice(0, 10))
}

function getTemplate(filename: string): string {
  return fs.readFileSync(path.join(__dirname, 'templates', filename), 'utf-8')
}

function formatSimpleDate(dateStr: string): string {
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function todayDate(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function todayDotDate(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function computeYearRange(startDateStr: string): string {
  const year = new Date(startDateStr).getFullYear()
  const nextYearShort = String(year + 1).slice(2)
  return `${year}-${nextYearShort}`
}

function getGenderDesignation(gender: string | undefined): string {
  if (gender === 'Male') return 'Mr.'
  if (gender === 'Female') return 'Ms.'
  return 'Mr./Ms.'
}

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  return parts[parts.length - 1]
}

export interface InternshipOfferData extends InternData {
  gender?: string
}

function compileInternshipOfferHtml(
  intern: InternshipOfferData,
  officer: { name: string; designation: string },
  opts: { applicationDate: string; nocDate: string; serial: string },
): string {
  const templateContent = getTemplate('internship_offer.html')
  const compiled = Handlebars.compile(templateContent)
  return compiled({
    logo: getLogoDataUrl(),
    'year-range': computeYearRange(intern.starting_date),
    serial: opts.serial,
    generation_date: todayDate(),
    gender_designation: getGenderDesignation(intern.gender),
    name: intern.name,
    last_name: getLastName(intern.name),
    university: intern.institution_name,
    application_date: formatSimpleDate(opts.applicationDate),
    noc_date: formatSimpleDate(opts.nocDate),
    start_date: formatDate(intern.starting_date),
    end_date: computeEndDate(intern.starting_date, intern.no_of_days),
    signing_officer_name: officer.name,
    signing_officer_designation: officer.designation,
  })
}

export async function generateInternshipOffer(
  intern: InternshipOfferData,
  officer: { name: string; designation: string },
  opts: { applicationDate: string; nocDate: string; serial: string },
  win: BrowserWindow,
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const html = compileInternshipOfferHtml(intern, officer, opts)
    const pdfData = await generatePDF(html)

    const result = await dialog.showSaveDialog(win, {
      title: 'Save Internship Offer',
      defaultPath: path.join(
        app.getPath('downloads'),
        `Internship_Offer_${intern.name}.pdf`,
      ),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Save cancelled' }
    }

    fs.writeFileSync(result.filePath, pdfData)
    return { success: true, filePath: result.filePath }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

function getLogoDataUrl(): string {
  const logoPath = path.join(__dirname, 'templates', 'logo.jpg')
  const buffer = fs.readFileSync(logoPath)
  return `data:image/jpeg;base64,${buffer.toString('base64')}`
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

async function renderPDF(html: string, pdfWindow: BrowserWindow): Promise<Buffer> {
  const encodedHtml = Buffer.from(html).toString('base64')
  await pdfWindow.loadURL(`data:text/html;base64,${encodedHtml}`)
  return await pdfWindow.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
  })
}

function compileGatePassHtml(intern: InternData): string {
  const templateContent = getTemplate('gatepass.html')
  const compiled = Handlebars.compile(templateContent)
  return compiled({
    name: intern.name,
    guardian_name: intern.guardian_name,
    degree: intern.degree ?? '',
    branch: intern.branch ?? '',
    institution_name: intern.institution_name,
    identification_mark: intern.identification_mark ?? '',
    logo: getLogoDataUrl(),
  })
}

export async function generateGatePass(
  intern: InternData,
  win: BrowserWindow,
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const html = compileGatePassHtml(intern)
    const pdfData = await generatePDF(html)

    const result = await dialog.showSaveDialog(win, {
      title: 'Save Gate Pass',
      defaultPath: path.join(
        app.getPath('downloads'),
        `Gate_Pass_${intern.name}.pdf`,
      ),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Save cancelled' }
    }

    fs.writeFileSync(result.filePath, pdfData)
    return { success: true, filePath: result.filePath }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function bulkGenerateGatePasses(
  interns: InternData[],
  folderPath: string,
): Promise<{ success: boolean; generated: number; errors: string[]; error?: string }> {
  const errors: string[] = []
  let generated = 0

  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false },
  })

  try {
    for (const intern of interns) {
      try {
        const html = compileGatePassHtml(intern)
        const pdfData = await renderPDF(html, pdfWindow)
        const sanitized = intern.name
          .replace(/[<>:"/\\|?*]/g, '_')
          .trim()
        const filePath = path.join(
          folderPath,
          `Gate_Pass_${sanitized}.pdf`,
        )
        fs.writeFileSync(filePath, pdfData)
        generated++
      } catch (err) {
        errors.push(`${intern.name}: ${String(err)}`)
      }
    }
  } catch (err) {
    return { success: false, error: String(err), generated: 0, errors: [] }
  } finally {
    pdfWindow.close()
  }

  return { success: true, generated, errors }
}

function compileSectionAttachmentHtml(
  intern: InternData & { degree?: string; branch?: string; section_posted?: string },
  opts: { serial: string; gmApprovalDate: string },
): string {
  const templateContent = getTemplate('section_attachment.html')
  const compiled = Handlebars.compile(templateContent)
  return compiled({
    logo: getLogoDataUrl(),
    year_range: computeYearRange(intern.starting_date),
    serial: opts.serial,
    generation_date: todayDate(),
    gm_approval_date: formatSimpleDate(opts.gmApprovalDate),
    name: intern.name,
    degree: intern.degree ?? '',
    branch: intern.branch ?? '',
    start_date: formatDate(intern.starting_date),
    end_date: computeEndDate(intern.starting_date, intern.no_of_days),
    section_name: intern.section_posted ?? '',
  })
}

export async function generateSectionAttachment(
  intern: InternData & { degree?: string; branch?: string; section_posted?: string },
  opts: { gmApprovalDate: string },
  win: BrowserWindow,
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const serial = String(intern.id ?? '')
    const html = compileSectionAttachmentHtml(intern, { serial, gmApprovalDate: opts.gmApprovalDate })
    const pdfData = await generatePDF(html)

    const result = await dialog.showSaveDialog(win, {
      title: 'Save Section Attachment',
      defaultPath: path.join(
        app.getPath('downloads'),
        `Section_Attachment_${intern.name}.pdf`,
      ),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Save cancelled' }
    }

    fs.writeFileSync(result.filePath, pdfData)
    return { success: true, filePath: result.filePath }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

function compileCertificateHtml(
  intern: InternData,
  officer: { name: string; designation: string },
  opts: { workAreas: string[]; rating: string },
): string {
  const templateContent = getTemplate('certificate.html')
  const compiled = Handlebars.compile(templateContent)
  return compiled({
    logo: getLogoDataUrl(),
    name: intern.name,
    institution_name: intern.institution_name,
    start_date: formatDate(intern.starting_date),
    end_date: computeEndDate(intern.starting_date, intern.no_of_days),
    work_areas: opts.workAreas,
    rating: opts.rating,
    signing_officer_name: officer.name,
    signing_officer_designation: officer.designation,
  })
}

export async function generateCertificate(
  intern: InternData,
  officer: { name: string; designation: string },
  opts: { workAreas: string[]; rating: string },
  win: BrowserWindow,
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const html = compileCertificateHtml(intern, officer, opts)
    const pdfData = await generatePDF(html)

    const result = await dialog.showSaveDialog(win, {
      title: 'Save Certificate',
      defaultPath: path.join(
        app.getPath('downloads'),
        `Certificate_${intern.name}.pdf`,
      ),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Save cancelled' }
    }

    fs.writeFileSync(result.filePath, pdfData)
    return { success: true, filePath: result.filePath }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
