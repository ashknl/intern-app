# Intern App — Application Specification

## 1. Overview

Intern App is a desktop application built for **Ordnance Factory Badmal** (a unit of Munitions India Limited, Ministry of Defence) to manage student internship records. It supports:

- Manual registration and Excel-based bulk import of intern data
- Search and dashboard analytics (charts, distribution metrics)
- Generation of official PDF documents (Gate Pass, Internship Offer, Section Attachment, Certificate)
- User authentication with security questions for password recovery
- Admin panel for user/officer management, student cleanup, and feedback collection

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 42 |
| Frontend Framework | React 18 with TypeScript |
| Routing | @tanstack/react-router (memory-based) |
| Tables | @tanstack/react-table |
| Charts | Recharts (pie charts) |
| UI Components | shadcn/ui + Base UI + Tailwind CSS 4 |
| Icons | lucide-react |
| Database | node:sqlite (SQLite via `DatabaseSync`) |
| PDF Rendering | Electron BrowserWindow → `printToPDF` |
| Template Engine | Handlebars |
| Password Hashing | bcryptjs |
| Excel Parsing | node-xlsx |
| Package Manager | pnpm |
| Bundler | Vite + vite-plugin-electron |
| Distribution | electron-builder (portable .exe / .AppImage) |

---

## 3. Architecture

### 3.1 Process Model

```
┌──────────────────────────────────────────────────┐
│  Electron Main Process (electron/)               │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  main.ts  │  │   db/    │  │ documents.ts  │  │
│  │ IPC hub   │  │ SQLite   │  │ PDF generator │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│        │                                        │
│  ┌─────┴─────┐                                   │
│  │ preload.ts │ ← contextBridge                  │
│  └─────┬─────┘                                   │
└────────┼────────────────────────────────────────┘
         │ IPC (invoke/handle)
┌────────┼────────────────────────────────────────┐
│  Electron Renderer Process (src/)               │
│                                                 │
│  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  Auth layer  │  │  React SPA              │  │
│  │  (gate)      │  │  MemoryRouter → Pages   │  │
│  └──────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 3.2 IPC Communication

All renderer → main communication uses `ipcRenderer.invoke(channel, ...args)` exposed via `contextBridge` as `window.ipcRenderer.invoke()`. The main process handles requests with `ipcMain.handle(channel, handler)`. No `send`/`on` event-based IPC is used for data operations.

### 3.3 Data Flow

1. **Startup**: Main process opens SQLite DB → runs migrations on first run → creates BrowserWindow → loads renderer
2. **Auth**: Renderer shows Login page → user submits credentials → `auth:login` IPC → main process hashes/compares via bcrypt → returns success/failure
3. **Data Operations**: Pages invoke search/insert IPC channels → main process queries SQLite → returns JSON → TanStack Table renders in React
4. **PDF Generation**: User selects intern → invokes document generation IPC → main process compiles Handlebars template → renders HTML in hidden BrowserWindow → `printToPDF()` → save dialog → writes PDF file

---

## 4. Directory Structure

```
intern-app2/
├── electron/                      # Main process
│   ├── main.ts                    # IPC handlers, window management
│   ├── preload.ts                 # contextBridge API exposure
│   ├── documents.ts               # PDF compilation & generation
│   ├── electron-env.d.ts          # Type declarations
│   └── db/
│       └── index.ts               # SQLite: schema, queries, migrations
├── src/                           # Renderer process
│   ├── main.tsx                   # Entry point, AuthProvider gate
│   ├── router.tsx                 # Route definitions (memory-based)
│   ├── index.css                  # Global styles, Tailwind, print media
│   ├── lib/
│   │   ├── auth.tsx               # AuthContext, useAuth hook
│   │   ├── IIntern.ts             # Intern type definition
│   │   └── utils.ts               # Utility functions
│   ├── hooks/
│   │   ├── useDashboardData.ts    # Dashboard metrics computation
│   │   ├── useExcelImport.ts      # Excel file dialog + import IPC
│   │   └── use-mobile.ts          # Mobile breakpoint hook
│   ├── components/
│   │   ├── Layout.tsx             # App shell (sidebar + outlet)
│   │   ├── ExcelImportCard.tsx    # Excel import UI (reusable)
│   │   ├── SearchFilters.tsx      # Shared search filter component
│   │   └── ui/                    # shadcn/ui components (~25 files)
│   ├── pages/
│   │   ├── Login.tsx              # Login form
│   │   ├── Dashboard.tsx          # Metrics, charts, intern table
│   │   ├── AddData.tsx            # Manual registration + Excel import
│   │   ├── Reports.tsx            # Search + printable table
│   │   ├── Documents.tsx          # Tab container for document pages
│   │   ├── Settings.tsx           # Placeholder settings page
│   │   ├── Admin.tsx              # Tab container for admin pages
│   │   ├── documents/
│   │   │   ├── GatePass.tsx
│   │   │   ├── InternshipOffer.tsx
│   │   │   ├── SectionAttachment.tsx
│   │   │   └── Certificate.tsx
│   │   └── admin/
│   │       ├── Users.tsx
│   │       ├── SigningOfficers.tsx
│   │       ├── FeedbackDetails.tsx
│   │       └── ManageStudents.tsx
│   └── templates/                 # Handlebars PDF templates
│       ├── gatepass.html
│       ├── internship_offer.html
│       ├── section_attachment.html
│       ├── certificate.html
│       ├── logo.jpg
│       └── signature_test.jpg
├── scripts/
│   └── hash.mjs                   # CLI bcrypt hash generator
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── SPEC.md                        # This file
```

---

## 5. Database Schema

### 5.1 `interns`

| Column | Type | Constraints |
|--------|------|------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `name` | TEXT | NOT NULL |
| `gender` | TEXT | |
| `identification_mark` | TEXT | |
| `institution_roll` | TEXT | NOT NULL |
| `degree` | TEXT | |
| `branch` | TEXT | NOT NULL |
| `year_of_study` | TEXT | NOT NULL |
| `guardian_name` | TEXT | NOT NULL |
| `guardian_relation` | TEXT | NOT NULL |
| `res_c_o` | TEXT | |
| `res_p_o` | TEXT | |
| `res_pin` | TEXT | |
| `res_contact` | TEXT | |
| `cur_c_o` | TEXT | |
| `cur_p_o` | TEXT | |
| `cur_pin` | TEXT | |
| `cur_contact` | TEXT | |
| `starting_date` | TEXT | NOT NULL |
| `no_of_days` | INTEGER | NOT NULL |
| `section_posted` | TEXT | NOT NULL |
| `institution_name` | TEXT | NOT NULL |
| `registration_id` | TEXT | UNIQUE |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP |

### 5.2 `users`

| Column | Type | Constraints |
|--------|------|------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `username` | TEXT | NOT NULL UNIQUE |
| `password_hash` | TEXT | NOT NULL |
| `security_question` | TEXT | NOT NULL |
| `security_answer_hash` | TEXT | NOT NULL |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP |

Default admin user seeded on first run: `admin` / `0000`.

### 5.3 `signing_officers`

| Column | Type | Constraints |
|--------|------|------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `officer_name` | TEXT | NOT NULL |
| `officer_designation` | TEXT | NOT NULL |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP |

### 5.4 `intern_feedback`

| Column | Type | Constraints |
|--------|------|------------|
| `id` | INTEGER | PRIMARY KEY, FOREIGN KEY → interns(id) |
| `feedback_text` | TEXT | NOT NULL |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP |

---

## 6. IPC Channels Reference

### 6.1 Auth

| Channel | Request | Response |
|---------|---------|----------|
| `auth:login` | `{ username, password }` | `{ success, error? }` |
| `auth:getSecurityQuestion` | `{ username }` | `{ success, question?, error? }` |
| `auth:verifySecurityAnswer` | `{ username, answer }` | `{ success, error? }` |

### 6.2 Intern Data

| Channel | Request | Response |
|---------|---------|----------|
| `manual:register` | `{ formData, registration_id }` | `{ success, registration_id, error? }` |
| `import:excelData` | `{ filePath }` | `{ imported, error? }` |
| `admin:deleteIntern` | `{ id }` | `{ success, error? }` |

### 6.3 Search & Dashboard

| Channel | Request | Response |
|---------|---------|----------|
| `search:interns` | `Record<string, string>` (filters) | `{ success, data[], count, error? }` |
| `search:distinctValues` | `{ column }` | `{ success, data[], error? }` |
| `dashboard:getAllInterns` | — | `{ success, data[], count, error? }` |

### 6.4 Document Generation

| Channel | Request | Response |
|---------|---------|----------|
| `document:generateGatePass` | `InternData` | `{ success, filePath?, error? }` |
| `document:bulkGenerateGatePass` | `{ folderPath }` | `{ success, generated, errors[], error? }` |
| `document:generateInternshipOffer` | `{ intern, applicationDate, nocDate, officerName, officerDesignation }` | `{ success, filePath?, error? }` |
| `document:generateSectionAttachment` | `{ intern: {...}, gmApprovalDate }` | `{ success, filePath?, error? }` |
| `document:generateCertificate` | `{ intern: {...}, workAreas[], rating, officerName, officerDesignation }` | `{ success, filePath?, error? }` |

### 6.5 Admin

| Channel | Request | Response |
|---------|---------|----------|
| `admin:getAllUsers` | — | `{ success, data: SafeUserRow[], count }` |
| `admin:createUser` | `{ username, password, securityQuestion, securityAnswer }` | `{ success, error? }` |
| `admin:getAllOfficers` | — | `{ success, data: OfficerRow[], count }` |
| `admin:insertOfficer` | `{ officerName, officerDesignation }` | `{ success, id, error? }` |
| `admin:deleteOfficer` | `{ id }` | `{ success, error? }` |

### 6.6 Feedback

| Channel | Request | Response |
|---------|---------|----------|
| `feedback:getAllFeedbacks` | — | `{ success, data: FeedbackDisplayRow[], count }` |
| `feedback:insertFeedback` | `{ internId, feedbackText }` | `{ success, error? }` |
| `feedback:deleteFeedback` | `{ internId }` | `{ success, error? }` |

### 6.7 Dialogs

| Channel | Request | Response |
|---------|---------|----------|
| `dialog:openFile` | — | `{ filePath, columns[], error? }` or `null` |
| `dialog:selectFolder` | — | folder path `string` or `null` |

---

## 7. Pages & Routes

### 7.1 Login (`/` — gateway)

The first screen shown. Not a routed page; gates the entire app via `AuthContext.isAuthenticated`.

- Centered card with app title, username/password inputs
- On submit: calls `auth:login` IPC → bcrypt comparison
- Supports "forgot password" flow: fetches security question → user answers → verifies through IPC
- On success: shows main layout
- **No database-backed** until `auth:login` — frontend only renders once auth context checks pass

### 7.2 Dashboard (`/`)

First page after login. Displays:

- **Metric cards**: Total Students, Total Institutions, Avg Duration, Year Range
- **Charts**: Branch Distribution (pie), Year of Study (pie)
- **Table**: All interns, sortable, paginated

Data fetched via `dashboard:getAllInterns`. Metrics computed client-side in `useDashboardData` hook.

### 7.3 Add Data (`/add-data`)

Dual-mode data entry:

**Register Intern** (Card 1):
- 6 sectioned form groups: Personal Info (name, gender, identification mark), Academic Details (roll, degree, branch, year), Guardian, Residential/Current Addresses, Internship Details
- "Same as Residential" checkbox for current address
- Auto-generates `REG-YYYYMMDD-XXXX` registration ID
- Submits via `manual:register` IPC

**Import from Excel** (Card 2, via `ExcelImportCard` component):
- File dialog → read Excel → show column selector → batch import
- Submits via `dialog:openFile` + `import:excelData` IPC

### 7.4 Reports (`/reports`)

- Search filters (select dropdowns with distinct values + date/number inputs)
- Results table with sortable, paginated columns
- **Print button** in table header triggers `window.print()` — CSS `@media print` hides sidebar and UI chrome, shows only the table
- Data via `search:interns` + `search:distinctValues` IPC

### 7.5 Documents (`/documents`)

Tabbed container with four sub-pages:

| Tab | Page | User Inputs | Template Variables |
|-----|------|------------|-------------------|
| **Gate Pass** | `GatePass.tsx` | None (all from DB) | name, guardian_name, degree, branch, institution, identification_mark |
| **Internship Offer** | `InternshipOffer.tsx` | Application Date, NOC Date (per row) + Signing Officer (page-level) | name, gender_designation, university, dates, officer |
| **Section Attachment** | `SectionAttachment.tsx` | GM Approval Date (page-level) | name, degree, branch, dates, section_name, serial from id |
| **Certificate** | `Certificate.tsx` | Work Areas list (textarea) + Rating (per row) + Signing Officer (page-level) | name, institution, dates, work_areas array, rating, officer |

All sub-pages share identical search filter patterns with distinct-value dropdowns.

### 7.6 Admin (`/admin`)

Tabbed container with four sub-pages:

| Tab | Page | Functionality |
|-----|------|--------------|
| **Users** | `Users.tsx` | View registered users, create new users (with security questions from predefined list). IPC: `admin:getAllUsers`, `admin:createUser` |
| **Signing Officers** | `SigningOfficers.tsx` | View/add/delete officers (name + designation). Used in document generation pages. IPC: `admin:getAllOfficers`, `admin:insertOfficer`, `admin:deleteOfficer` |
| **Add Feedback** | `FeedbackDetails.tsx` | Search interns → add feedback text per intern → save. View existing feedback. IPC: `search:interns`, `feedback:getAllFeedbacks`, `feedback:insertFeedback`, `feedback:deleteFeedback` |
| **Manage Students** | `ManageStudents.tsx` | Search interns → expand row for details (address, dates) → delete individual intern. IPC: `search:interns`, `admin:deleteIntern` |

---

## 8. Document Templates

Templates are stored in `src/templates/` as `.html` files and copied to `dist-electron/templates/` during build via the `copy-templates` Vite plugin.

All templates share a common letterhead (logo, bilingual address, contact info) and use Handlebars syntax. Each is rendered to HTML in a hidden `BrowserWindow`, then converted to PDF via `printToPDF`.

### 8.1 Gate Pass (`gatepass.html`)

| Variable | Source |
|----------|--------|
| `{{logo}}` | Backend (`getLogoDataUrl()`) |
| `{{name}}` | DB |
| `{{guardian_name}}` | DB |
| `{{degree}}` | DB |
| `{{branch}}` | DB |
| `{{institution_name}}` | DB |
| `{{identification_mark}}` | DB |

### 8.2 Internship Offer (`internship_offer.html`)

| Variable | Source |
|----------|--------|
| `{{logo}}` | Backend |
| `{{year-range}}` | Computed from starting_date |
| `{{serial}}` | `intern.id` |
| `{{generation_date}}` | Today (DD/MM/YYYY) |
| `{{gender_designation}}` | Mr./Ms. from gender |
| `{{name}}`, `{{last_name}}` | DB |
| `{{university}}` | DB (`institution_name`) |
| `{{application_date}}`, `{{noc_date}}` | User input |
| `{{start_date}}`, `{{end_date}}` | Computed from DB |
| `{{signing_officer_name}}`, `{{signing_officer_designation}}` | User-selected officer |

### 8.3 Section Attachment (`section_attachment.html`)

| Variable | Source |
|----------|--------|
| `{{logo}}` | Backend |
| `{{year_range}}` | Computed from starting_date |
| `{{serial}}` | `intern.id` |
| `{{generation_date}}` | Today (DD.MM.YYYY) |
| `{{gm_approval_date}}` | User input |
| `{{name}}` | DB |
| `{{degree}}`, `{{branch}}` | DB |
| `{{start_date}}`, `{{end_date}}` | Computed from DB |
| `{{section_name}}` | DB (`section_posted`) |

Contains a table with intern details and copy sections for internal office communication.

### 8.4 Certificate (`certificate.html`)

| Variable | Source |
|----------|--------|
| `{{logo}}` | Backend |
| `{{name}}` | DB |
| `{{institution_name}}` | DB |
| `{{start_date}}`, `{{end_date}}` | Computed from DB |
| `{{#each work_areas}}` `{{this}}` | User input (list from textarea) |
| `{{rating}}` | User input |
| `{{signing_officer_name}}`, `{{signing_officer_designation}}` | User-selected officer |

Uses flexbox layout to ensure single-page output with footer at bottom. Prevents page-break inside header, signature, and footer.

---

## 9. Auth & User Management

### 9.1 Login Flow

1. User enters username + password → `auth:login` IPC
2. Main process: `getUserByUsername()` → `bcryptjs.compareSync(password, hash)`
3. Success: `isAuthenticated = true`, router renders
4. Failure: error message displayed

### 9.2 Password Recovery

1. User enters username → `auth:getSecurityQuestion` IPC → displays question
2. User enters answer → `auth:verifySecurityAnswer` IPC → bcrypt comparison
3. If correct: user is logged in (can reset password via `updatePassword`)

### 9.3 User CRUD (Admin)

- Admin creates users via `admin:createUser` — hashes password and security answer with bcrypt before storage
- Only `SafeUserRow` (id, username, question, created_at) is returned to renderer — never exposes hashes

---

## 10. Build & Packaging

### Commands

| Script | Description |
|--------|------------|
| `pnpm dev` | Start Vite dev server (renderer + electron) |
| `pnpm build` | Production build + package with electron-builder |
| `pnpm build:win` | Build Windows portable `.exe` (x64) |
| `pnpm build:linux` | Build Linux `.AppImage` (x64) |
| `pnpm lint` | ESLint check |

### Build Output (Production)

```
dist/                             # Vite-built renderer
└── index.html + assets/         # React SPA bundle (~835 KB JS, ~90 KB CSS)

dist-electron/                    # Vite-built main process
├── main.js                       # Main process bundle (~22 KB)
├── preload.mjs                   # Preload script
└── templates/                    # Copied from src/templates/
    ├── gatepass.html
    ├── internship_offer.html
    ├── section_attachment.html
    ├── certificate.html
    └── logo.jpg

release/                          # electron-builder output
└── Intern App 0.0.0.exe         # Windows portable
```

### External Dependencies

Listed as externals in Vite config (not bundled, required at runtime):
- `node:sqlite` — SQLite native binding
- `bcryptjs` — Password hashing (pure JS, bundled but marked external)
- `node-xlsx` — Excel parsing

---

## 11. Key Design Decisions

1. **Memory-based routing**: Uses `createMemoryHistory` from TanStack Router instead of browser-based routing. Better suited for Electron's `file://` protocol.

2. **Auth as a gate, not a route**: Login is rendered conditionally via `AuthProvider`, not as a router route. The main layout + all pages don't load until authenticated.

3. **Migrations on first run only**: The `isFirstRun` check in `getDb()` runs `CREATE TABLE IF NOT EXISTS` statements only when the DB file doesn't exist. No version-tracking migration system — schema changes require manual DB deletion by the user.

4. **Templates as build assets**: Handlebars templates live in `src/templates/` and are copied to `dist-electron/templates/` during build by a custom Vite plugin. At runtime, `__dirname` resolves to `dist-electron/`, so templates load from `dist-electron/templates/`.

5. **PDF via hidden BrowserWindow**: Instead of a headless browser or PDF library, a second invisible `BrowserWindow` renders the compiled HTML and calls `printToPDF()`. This ensures full CSS and image support (including the base64-encoded logo).

6. **Distinct value dropdowns**: Search filter pages pre-fetch distinct values for each searchable column via `search:distinctValues` IPC. This avoids free-text typing and ensures only valid values are searched.

7. **Single-file DB module**: All database operations (queries, insertions, schema) reside in `electron/db/index.ts` with clear exported functions. No ORM — raw SQL with prepared statements.

8. **Manual Registration ID**: Format `REG-YYYYMMDD-XXXX` where `XXXX` is 4 random uppercase letters. Generated client-side before IPC submission.

9. **Shared search component**: `SearchFilters` is extracted as a reusable component used by Manage Students and Feedback Details pages, reducing duplication.

10. **Print CSS**: The Reports page uses `@media print` rules in `index.css` to hide sidebar, header, and UI chrome. Only the table content is printed.
