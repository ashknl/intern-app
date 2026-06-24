4.1 Introduction

The Intern App is a desktop-based application developed for Ordnance Factory Badmal, a unit of Munitions India Limited under the Ministry of Defence, Government of India. The application is designed to manage student internship records, replacing manual paperwork with an automated digital solution.

The system is implemented using Electron as the desktop shell, React with TypeScript for the user interface, and SQLite as the embedded database. The application supports manual registration of interns, bulk import of data from Excel files, search functionality with dynamic filters, generation of official PDF documents, and user authentication with password recovery.

The application follows an architecture where the Electron main process handles all heavy operations — database queries, file I/O, PDF generation, and password hashing — while the React renderer process provides the user interface. Communication between these processes occurs exclusively through Electron's IPC (Inter-Process Communication) mechanism.

4.2 System Overview

The system consists of a single application window with sidebar navigation providing access to all operational functionalities:

Dashboard — Displays key metrics including total students, total institutions, average internship duration, and distribution charts for branch allocation and year of study. A paginated data table lists all registered interns.

Add Data — Provides dual-mode data entry: a manual registration form with six sectioned field groups (personal, academic, guardian, residential address, current address, and internship details) and an Excel import module for bulk data entry using node-xlsx.

Reports — Implements a search interface with dropdown filters populated from distinct database values. Results are displayed in a sortable, paginated table with a print function that renders a landscape A4 PDF view.

Documents — A tabbed container with four sub-pages, each generating a specific PDF document type: Gate Pass, Internship Offer, Section Attachment, and Certificate. Documents are rendered from Handlebars HTML templates and converted to PDF via Electron's printToPDF API.

Admin — A tabbed container with four management sub-pages: Users (create and view user accounts), Signing Officers (add and delete signing authorities used in documents), Feedback (search interns and record training feedback), and Manage Students (search and delete intern records with expandable detail rows).

4.3 System Architecture

The system follows a 3-tier architecture model adapted for the Electron desktop environment:

1. Presentation Layer (Renderer Process)
   - React 18 with TypeScript
   - Tailwind CSS 4 and shadcn/ui components
   - TanStack React Table for data tables with sorting and pagination
   - Recharts for pie chart visualizations
   - Handles all user interaction, form inputs, and data display

2. Application Layer (Main Process)
   - Electron main process acting as the backend server
   - IPC handlers routing all requests to appropriate functions
   - Dedicated modules: db/index.ts for database operations, documents.ts for PDF generation
   - Business logic: Excel parsing with column mapping, date conversion (Excel serial to ISO), template compilation with Handlebars, PDF rendering via hidden BrowserWindow

3. Database Layer
   - SQLite embedded database via node:sqlite (DatabaseSync API)
   - Single-file database stored in the user's application data directory
   - WAL (Write-Ahead Logging) journal mode for concurrent read/write performance
   - Schema migrations run on first application launch

Communication between the main process and renderer follows a strict pattern: all operations are invoked via window.ipcRenderer.invoke(channel, args) and handled by ipcMain.handle(channel, handler). The preload script exposes only the invoke method through contextBridge, maintaining process isolation.

4.4 Module Description

4.4.1 Add Data Module (Manual Registration and Excel Import)

This module provides two methods for entering intern data into the system.

Manual Registration:
- Six-section form covering all 22 database columns
- Auto-detection of duplicate address fields with a "Same as Residential" checkbox
- Automatic generation of unique registration IDs in REG-YYYYMMDD-XXXXXX format
- Branch and Section dropdowns with predefined options plus a custom text input ("Other" option)
- Phone number validation enforcing exactly 10 digits
- Form validation ensuring all required fields are completed
- Submits data via manual:register IPC channel

Excel Import:
- File selection dialog filtering for .xlsx, .xls, and .csv formats
- Automatic column mapping based on header recognition (case-insensitive matching with normalization)
- Date conversion handling both DD/MM/YYYY string format and Excel serial numbers
- Null column handling (skips empty columns)
- Row-level validation requiring at minimum name and institution roll number
- Batch insertion within a SQLite transaction for atomicity
- Submits via dialog:openFile and import:excelData IPC channels

4.4.2 Reports Module

This module provides a comprehensive search and visualization interface for intern data.

Search Filters:
- Eight dropdown filters (name, institution roll, guardian name, guardian relation, branch, year of study, section posted, institution name) populated with distinct values from the database via search:distinctValues IPC
- Two direct input fields for starting date and number of days
- Branch and Section dropdowns feature an "Other (type your own)" option for custom values
- All text fields use LIKE-based partial matching for flexible search

Results Display:
- TanStack React Table with 10 sortable columns showing all intern details
- Paginated display with configurable page size
- Sort toggles on column headers
- All filtering logic executed server-side via search:interns IPC

Print Functionality:
- Landscape A4 print layout with compact font sizing (8pt)
- CSS media print rules hide all UI chrome (sidebar, buttons, filters)
- Full dataset printed without pagination limits
- Horizontal overflow contained within the print area

4.4.3 Document Generation Module

This is the most critical output module of the system. It generates four types of official PDF documents using Handlebars HTML templates rendered to PDF via a hidden Electron BrowserWindow.

Gate Pass:
- Variables: name, guardian name, degree, branch, institution name, identification mark
- Compact single-page A4 layout with photo placeholder, address fields, and LHT impression block
- Supports bulk generation — processes all interns and saves individual PDFs to a selected folder
- IPC: document:generateGatePass (single), document:bulkGenerateGatePass (bulk)

Internship Offer:
- Variables: name (with gender-based salutation), university, application date, NOC date, internship period, signing officer
- User inputs: application date and NOC date per intern row, signing officer selected from dropdown
- Serial number derived from intern database ID
- IPC: document:generateInternshipOffer

Section Attachment:
- Variables: name, degree, branch, internship period, section name, GM approval date, serial number
- User input: shared GM approval date applied to all generated documents
- Includes internal office communication copy sections
- IPC: document:generateSectionAttachment

Certificate:
- Variables: name, institution name, internship period, work areas (as an ordered list), performance rating, signing officer
- User inputs: work areas (textarea, one per line), rating (5-level dropdown), signing officer selection
- Generate button disabled until feedback has been submitted for the intern
- Work areas rendered as an HTML ordered list with Roman numeral numbering
- IPC: document:generateCertificate

Template Engine:
- Handlebars compiles HTML with injected variables
- Logo image embedded as base64 data URI in the HTML before rendering
- Hidden BrowserWindow loads the compiled HTML and calls printToPDF()
- Save dialog prompts user for file location
- All templates use flexbox layout with footer-at-bottom design for single-page output

4.4.4 Feedback Module

This module enables administrators to record training feedback for individual interns.

- Search interface with the same distinct-value dropdown filters as Reports
- Results display shows intern name, roll number, and institution
- Inline feedback text entry per intern row with a save button
- All existing feedback displayed in a separate table with delete capability
- Certificate generation is gated — the Generate button is disabled until feedback exists for the intern
- IPC: feedback:getAllFeedbacks, feedback:insertFeedback, feedback:deleteFeedback

4.4.5 Admin Module

This module provides administrative control over the application's configuration and data.

Users Sub-page:
- View all registered users in a sortable, paginated table
- Create new users with username, password, security question (5 presets plus custom input), and answer
- Passwords and security answers hashed with bcryptjs (10 rounds) before storage
- Only safe columns (id, username, security question, created_at) are returned to the renderer

Signing Officers Sub-page:
- View, add, and delete signing officers used in document generation
- Each officer has a name and designation
- Officer list is used as a shared dropdown in Internship Offer and Certificate pages

Manage Students Sub-page:
- Search interns with distinct-value dropdown filters
- Collapsible accordion rows showing all 22 database fields per intern
- Delete button with confirmation dialog removes the intern and associated feedback
- IPC: admin:deleteIntern

4.4.6 Authentication Module

This module controls access to the application.

Login:
- Username and password submitted to auth:login IPC handler
- Main process retrieves user record and compares password hash using bcryptjs.compareSync
- On success, the AuthContext sets isAuthenticated = true and the React router renders the main layout
- The login screen gates the entire application — no routes are accessible before authentication

Password Recovery:
- User enters username and clicks "Forgot Password"
- System retrieves the stored security question via auth:getSecurityQuestion IPC
- User provides the answer, hashed and compared against the stored hash
- Correct answer logs the user in without requiring the password

Default Admin:
- A default administrator account (username: admin, password: 0000) is seeded during first-run database migration
- Uses INSERT ... WHERE NOT EXISTS pattern for idempotent creation

4.5 Database Design

The system uses a relational database model with SQLite. The database file (interns.db) is stored in the Electron user data directory and uses WAL journal mode for performance.

4.5.1 interns table

Stores all intern registration data with 23 columns.

Fields:
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- name, institution_roll, branch, year_of_study, guardian_name, guardian_relation, starting_date, no_of_days, section_posted, institution_name (NOT NULL)
- gender, identification_mark, degree (nullable)
- res_c_o, res_p_o, res_pin, res_contact (residential address, nullable)
- cur_c_o, cur_p_o, cur_pin, cur_contact (current address, nullable)
- registration_id (UNIQUE, nullable)
- created_at (DEFAULT CURRENT_TIMESTAMP)

Excel import uses a subset of 10 columns; manual registration uses all 22 columns.

4.5.2 users table

Stores administrator login credentials.

Fields:
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- username (TEXT NOT NULL UNIQUE)
- password_hash (TEXT NOT NULL)
- security_question (TEXT NOT NULL)
- security_answer_hash (TEXT NOT NULL)
- created_at (DEFAULT CURRENT_TIMESTAMP)

Password and security answer hashes are generated server-side in the main process using bcryptjs. Plain-text passwords never leave the main process or persist to the database.

4.5.3 signing_officers table

Stores signing authority information for document generation.

Fields:
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- officer_name (TEXT NOT NULL)
- officer_designation (TEXT NOT NULL)
- created_at (DEFAULT CURRENT_TIMESTAMP)

4.5.4 intern_feedback table

Stores training feedback linked to interns through a foreign key relationship.

Fields:
- id (INTEGER PRIMARY KEY, FOREIGN KEY REFERENCES interns(id))
- feedback_text (TEXT NOT NULL)
- created_at (DEFAULT CURRENT_TIMESTAMP)

The id serves as both primary key and foreign key, enforcing a strict one-to-one relationship. INSERT OR REPLACE is used to allow feedback updates. Cascade-like behavior is handled in the deleteIntern function.

4.6 System Workflow

The workflow of the system is as follows:

1. Application launches and main process initializes SQLite database
2. On first run, database migrations create all tables and seed the default admin user
3. Main process creates the BrowserWindow and loads the React renderer
4. Login screen appears — user must authenticate before accessing any functionality
5. After login, the Dashboard displays with metrics and charts computed from intern data
6. Administrator registers interns manually through forms or imports Excel files
7. Intern data is searchable through the Reports page with dynamic dropdowns
8. Signing officers are configured in the Admin panel
9. Feedback is collected for each intern through the Feedback interface
10. Documents are generated per intern or in bulk (Gate Pass only):
    - Template compiled with Handlebars using intern data and user inputs
    - HTML rendered in hidden BrowserWindow
    - PDF generated via printToPDF()
    - Save dialog prompted, PDF written to disk
11. Certificate generation is conditional on feedback submission
12. Administrators can manage users, officers, and delete erroneous records
13. Reports can be printed in landscape A4 format with all columns visible

4.7 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│              Electron Main Process (electron/)            │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   main.ts   │  │  db/index.ts  │  │ documents.ts   │  │
│  │  IPC Hub    │  │  SQLite CRUD  │  │  PDF Generator │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │           │
│  ┌──────┴────────────────┴───────────────────┴────────┐  │
│  │              preload.ts (contextBridge)            │  │
│  └──────────────────────┬─────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────┘
                          │ IPC (invoke/handle)
┌─────────────────────────┼────────────────────────────────┐
│          Electron Renderer Process (src/)                │
│                          │                               │
│  ┌───────────────────────┴──────────────────────────┐   │
│  │              AuthProvider (Gate)                 │   │
│  │         Login → isAuthenticated → Routes          │   │
│  └───────────────────────┬──────────────────────────┘   │
│                          │                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Dashboard │ │ Add Data │ │Documents │ │  Admin   │   │
│  │ Metrics  │ │  Forms   │ │  4 Tabs  │ │  4 Tabs  │   │
│  │  Charts  │ │  Excel   │ │ GatePass │ │  Users   │   │
│  │  Table   │ │  Import  │ │ Offer... │ │ Officers │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                          │                               │
│               ┌──────────┴──────────┐                    │
│               │     Reports         │                    │
│               │  Search + Print     │                    │
│               └─────────────────────┘                    │
└──────────────────────────────────────────────────────────┘
```

4.8 Database Entity Relationship

```
┌──────────────────┐       ┌─────────────────────┐
│     interns      │       │  intern_feedback     │
│──────────────────│       │─────────────────────│
│ id (PK)         ◄├───────┤ id (PK, FK)         │
│ name             │  1:1  │ feedback_text        │
│ institution_roll │       │ created_at           │
│ ... (22 cols)    │       └─────────────────────┘
└──────────────────┘

┌──────────────────┐       ┌─────────────────────┐
│      users       │       │  signing_officers   │
│──────────────────│       │─────────────────────│
│ id (PK)          │       │ id (PK)             │
│ username (UNIQUE)│       │ officer_name        │
│ password_hash    │       │ officer_designation │
│ security_q/a     │       │ created_at          │
│ created_at       │       └─────────────────────┘
└──────────────────┘
```

4.9 Input and Output Design

Input:
- Manual registration form with 22 fields across 6 sections
- Excel file upload (.xlsx/.xls/.csv) with automatic column mapping
- Search filter selections from distinct-value dropdowns
- Application dates, NOC dates, and GM approval dates for document generation
- Work areas text input (one item per line) and rating selection for certificates
- Feedback text entry per intern
- User creation form with security questions and answers
- Signing officer name and designation entries

Output:
- PDF documents: Gate Pass, Internship Offer, Section Attachment, Certificate
- Printed reports in landscape A4 format
- Data tables with sorting and pagination
- Dashboard metrics (total students, institutions, average duration)
- Pie charts for branch and year distribution
- Bulk-generated gate pass PDFs to user-selected folder
- Registration confirmation with auto-generated ID

4.10 Security Features

- Password hashing with bcryptjs (10 salt rounds) — plain-text passwords never stored
- Security answer hashing with bcryptjs for password recovery
- IPC isolation: renderer process has no direct access to Node.js APIs or the file system
- contextBridge whitelist: only ipcRenderer.invoke is exposed to the renderer
- Authentication gate: Login screen renders before any application routes are accessible
- Security answers compared server-side with bcryptjs.compareSync — hashes never leave the main process
- SafeUserRow pattern: database queries for user listing exclude password_hash and security_answer_hash columns
- SQL injection prevention: all queries use parameterized prepared statements
- Auto-generated registration IDs prevent manual ID conflicts
- Input validation on all forms with required field checks

4.11 Advantages of the System

- Replaces manual paperwork with a centralized digital database
- Eliminates data entry errors through Excel column mapping and date conversion
- Supports large-scale intern data management with search and filter capabilities
- Generates professional PDF documents automatically from templates
- Provides self-service password recovery via security questions
- Desktop application works offline without internet connectivity
- Single-file SQLite database simplifies backup and migration
- Modular code architecture separates concerns (DB, documents, UI)
- Reusable search filter component reduces code duplication across pages
- WAL journal mode ensures reliable concurrent database access
- Bulk PDF generation saves time for Gate Pass document creation
- Feedback gating ensures certificates are only issued after training feedback

4.12 Limitations of the System

- Desktop-only application — not accessible from mobile devices or web browsers
- Single-user system — no concurrent multi-user access
- No cloud synchronization or remote database backup
- Database schema changes require manual migration (no version-tracking migration system)
- Excel import requires specific column naming conventions for automatic mapping
- PDF generation uses BrowserWindow instances which consume memory during bulk operations
- No real-time notification system for data changes
- Windows MSI installer not yet implemented (currently portable .exe only)
- Node.js experimental SQLite module requires --experimental-sqlite flag for standalone scripts
- Document templates are hardcoded — customization requires code changes

4.13 Future Enhancements

- Windows MSI installer for enterprise deployment
- Cloud synchronization for multi-machine access
- Multi-user role-based access control
- Automated database migration system with version tracking
- Real-time biometric or RFID integration for gate pass validation
- Customizable document templates through a visual editor
- Email integration for sending generated PDFs to interns and institutions
- Analytics dashboard with trend analysis and semester comparisons
- Backup and restore functionality for the SQLite database
- Audit logging for all administrative actions
- Password update functionality for existing users

4.14 Chapter Summary

This chapter presented a detailed explanation of the Intern App including its architecture, modules, database structure, workflow, and processing logic. The system successfully automates internship record management for Ordnance Factory Badmal, replacing manual processes with a digital solution that handles intern registration, Excel data import, search and reporting, official PDF document generation, user authentication, and administrative management.

The application follows a modular Electron architecture with React on the frontend, SQLite for data persistence, and Handlebars-based template rendering for PDF output. Key modules — Add Data, Reports, Documents, Admin, and Authentication — work together to provide a complete internship management workflow from data entry through certificate issuance.

The system improves efficiency, accuracy, and scalability in managing student internship records while maintaining security through bcrypt password hashing and IPC process isolation.
