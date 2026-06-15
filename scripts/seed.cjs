/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// Usage: npm run seed [db-path]
//  or:   node --experimental-sqlite scripts/import-mockdata.cjs [db-path]
// Default DB: ~/.config/intern-app/interns.db

const { DatabaseSync } = require('node:sqlite')
const path = require('node:path')
const os = require('node:os')

const dbPath = process.argv[2] || path.join(os.homedir(), '.config', 'intern-app', 'interns.db')

const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL')

db.exec(`CREATE TABLE IF NOT EXISTS interns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gender TEXT,
  identification_mark TEXT,
  institution_roll TEXT NOT NULL,
  degree TEXT,
  branch TEXT NOT NULL,
  year_of_study TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_relation TEXT NOT NULL,
  res_c_o TEXT,
  res_p_o TEXT,
  res_pin TEXT,
  res_contact TEXT,
  cur_c_o TEXT,
  cur_p_o TEXT,
  cur_pin TEXT,
  cur_contact TEXT,
  starting_date TEXT NOT NULL,
  no_of_days INTEGER NOT NULL,
  section_posted TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  registration_id TEXT UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`)

const stmt = db.prepare(`
  INSERT INTO interns (
    name, gender, identification_mark,
    institution_roll, degree, branch, year_of_study,
    guardian_name, guardian_relation,
    res_c_o, res_p_o, res_pin, res_contact,
    cur_c_o, cur_p_o, cur_pin, cur_contact,
    starting_date, no_of_days, section_posted, institution_name, registration_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const interns = [
  {
    name: 'Ashutosh Nayak', gender: 'Male', identification_mark: 'Mole on left cheek',
    institution_roll: '202320324', degree: 'B.Tech', branch: 'CSE', year_of_study: '1st',
    guardian_name: 'Lokesh Nayak', guardian_relation: 'Father',
    res_c_o: 'C/o Ramesh Nayak', res_p_o: 'Berhampur', res_pin: '760001', res_contact: '9437000001',
    cur_c_o: 'NIST Hostel Block A', cur_p_o: 'Berhampur', cur_pin: '760008', cur_contact: '9437000001',
    starting_date: '2026-05-01', no_of_days: 30, section_posted: 'ITC',
    institution_name: 'NIST UNIVERSITY', registration_id: 'REG-20260501-AB12CD',
  },
  {
    name: 'Anubhav Budek', gender: 'Male', identification_mark: 'Scar on right forearm',
    institution_roll: '1404930392', degree: 'B.Tech', branch: 'ECE', year_of_study: '2nd',
    guardian_name: 'Premananda Budek', guardian_relation: 'Father',
    res_c_o: 'C/o Pravat Budek', res_p_o: 'Sambalpur', res_pin: '768001', res_contact: '9438100002',
    cur_c_o: 'SU Hostel', cur_p_o: 'Sambalpur', cur_pin: '768019', cur_contact: '9438100002',
    starting_date: '2026-05-02', no_of_days: 45, section_posted: 'HRD',
    institution_name: 'Sambalpur University', registration_id: 'REG-20260502-EF34GH',
  },
  {
    name: 'Balkishore Sipka', gender: 'Male', identification_mark: 'Wart on left thumb',
    institution_roll: '245768736', degree: 'B.Tech', branch: 'CSE', year_of_study: '3rd',
    guardian_name: 'H.K Sipka', guardian_relation: 'Father',
    res_c_o: 'C/o Harmohan Sipka', res_p_o: 'Jeypore', res_pin: '764001', res_contact: '9437400003',
    cur_c_o: 'IIIT PG Hostel', cur_p_o: 'Bhubaneswar', cur_pin: '751003', cur_contact: '9437400003',
    starting_date: '2026-05-03', no_of_days: 60, section_posted: 'UNIT-1',
    institution_name: 'IIIT Bhubaneswar', registration_id: 'REG-20260503-IJ56KL',
  },
  {
    name: 'Krishnakant Dash', gender: 'Male', identification_mark: 'Birthmark on right shoulder',
    institution_roll: '3839380', degree: 'B.Tech', branch: 'ME', year_of_study: '4th',
    guardian_name: 'Kiran Dash', guardian_relation: 'Father',
    res_c_o: 'C/o Kartik Dash', res_p_o: 'Rourkela', res_pin: '769001', res_contact: '9437200004',
    cur_c_o: 'NITR Hall 3', cur_p_o: 'Rourkela', cur_pin: '769008', cur_contact: '9437200004',
    starting_date: '2026-05-04', no_of_days: 30, section_posted: 'UNIT-2',
    institution_name: 'NIT ROURKELA', registration_id: 'REG-20260504-MN78OP',
  },
  {
    name: 'Siddhant', gender: 'Male', identification_mark: 'Dimple on chin',
    institution_roll: '2929202', degree: 'BCA', branch: 'EE', year_of_study: '2nd',
    guardian_name: 'MS Dhoni', guardian_relation: 'Father',
    res_c_o: 'C/o MS Dhoni', res_p_o: 'Ranchi', res_pin: '834001', res_contact: '9437100005',
    cur_c_o: 'NITT Hostel', cur_p_o: 'Tiruchirappalli', cur_pin: '620015', cur_contact: '9437100005',
    starting_date: '2026-05-05', no_of_days: 45, section_posted: 'UNIT-3',
    institution_name: 'NIT TRICHY', registration_id: 'REG-20260505-QR90ST',
  },
  {
    name: 'Priya Kumari', gender: 'Female', identification_mark: 'Bindi mark on forehead',
    institution_roll: '9393393', degree: 'BSc', branch: 'ECE', year_of_study: '2nd',
    guardian_name: 'Arman Kumar', guardian_relation: 'Father',
    res_c_o: 'C/o Arman Kumar', res_p_o: 'Burla', res_pin: '768018', res_contact: '9437000006',
    cur_c_o: 'VSSUT Ladies Hostel', cur_p_o: 'Burla', cur_pin: '768018', cur_contact: '9437000006',
    starting_date: '2026-05-06', no_of_days: 60, section_posted: 'UNIT-4',
    institution_name: 'VSSUT BURLA', registration_id: 'REG-20260506-UV12WX',
  },
  {
    name: 'Piyush Pradhan', gender: 'Male', identification_mark: 'Scar on left knee',
    institution_roll: '939303928', degree: 'B.Tech', branch: 'CHE', year_of_study: '1st',
    guardian_name: 'Virat Pradhan', guardian_relation: 'Father',
    res_c_o: 'C/o Santosh Pradhan', res_p_o: 'Angul', res_pin: '759001', res_contact: '9437000007',
    cur_c_o: 'IIT BBSR Hostel', cur_p_o: 'Bhubaneswar', cur_pin: '751013', cur_contact: '9437000007',
    starting_date: '2026-05-07', no_of_days: 30, section_posted: 'UNIT-3',
    institution_name: 'IIT Bhubaneswar', registration_id: 'REG-20260507-YZ34AB',
  },
  {
    name: 'Ashutosh Mund', gender: 'Male', identification_mark: 'Mole on right ear',
    institution_roll: '93839282', degree: 'BSc', branch: 'EEE', year_of_study: '2nd',
    guardian_name: 'Rohit Mund', guardian_relation: 'Father',
    res_c_o: 'C/o Rohit Mund', res_p_o: 'Bhawanipatna', res_pin: '766001', res_contact: '9437000008',
    cur_c_o: 'BEC Hostel', cur_p_o: 'Bhawanipatna', cur_pin: '766001', cur_contact: '9437000008',
    starting_date: '2026-05-08', no_of_days: 45, section_posted: 'UNIT-3',
    institution_name: 'Bhawanipatna College of Engineering', registration_id: 'REG-20260508-CD56EF',
  },
  {
    name: 'Aniket Mishra', gender: 'Male', identification_mark: 'Freckles on nose',
    institution_roll: '029208424', degree: 'MCA', branch: 'MT', year_of_study: '2nd',
    guardian_name: 'Ravindra Mishra', guardian_relation: 'Father',
    res_c_o: 'C/o Ravindra Mishra', res_p_o: 'Patia', res_pin: '751024', res_contact: '9437100009',
    cur_c_o: 'DCE Hostel', cur_p_o: 'New Delhi', cur_pin: '110001', cur_contact: '9437100009',
    starting_date: '2026-05-09', no_of_days: 60, section_posted: 'UNIT-4',
    institution_name: 'Delhi College of Engineering', registration_id: 'REG-20260509-GH78IJ',
  },
  {
    name: 'Aditya Sahu', gender: 'Male', identification_mark: 'Tattoo on left wrist',
    institution_roll: '2627t43', degree: 'BCA', branch: 'FE', year_of_study: '3rd',
    guardian_name: 'Virandra Sahu', guardian_relation: 'Father',
    res_c_o: 'C/o Dev Sahu', res_p_o: 'Bilaspur', res_pin: '495001', res_contact: '9437000010',
    cur_c_o: 'MU Hostel', cur_p_o: 'Mumbai', cur_pin: '400001', cur_contact: '9437000010',
    starting_date: '2026-05-10', no_of_days: 30, section_posted: 'UNIT-3',
    institution_name: 'Mumbai University', registration_id: 'REG-20260510-KL90MN',
  },
  {
    name: 'Nikhil Kumar', gender: 'Male', identification_mark: 'Mole under right eye',
    institution_roll: '726473', degree: 'B.Tech', branch: 'FE', year_of_study: '3rd',
    guardian_name: 'Kapil Kumar', guardian_relation: 'Father',
    res_c_o: 'C/o Kamal Kumar', res_p_o: 'Patna', res_pin: '800001', res_contact: '9437100011',
    cur_c_o: 'DU Hostel', cur_p_o: 'New Delhi', cur_pin: '110007', cur_contact: '9437100011',
    starting_date: '2026-05-11', no_of_days: 30, section_posted: 'UNIT-3',
    institution_name: 'Delhi University', registration_id: 'REG-20260511-OP12QR',
  },
  {
    name: 'Nitish mahakul', gender: 'Male', identification_mark: 'Burn mark on left hand',
    institution_roll: '726471', degree: 'B.Tech', branch: 'CSE', year_of_study: '2nd',
    guardian_name: 'Ajay mahakul', guardian_relation: 'Father',
    res_c_o: 'C/o Surath Mahakul', res_p_o: 'Sambalpur', res_pin: '768002', res_contact: '9437000012',
    cur_c_o: 'GU Hostel', cur_p_o: 'Greater Noida', cur_pin: '201310', cur_contact: '9437000012',
    starting_date: '2026-05-12', no_of_days: 30, section_posted: 'UNIT-4',
    institution_name: 'Galgotias University', registration_id: 'REG-20260512-ST34UV',
  },
  {
    name: 'Ruturaj Gaikwad', gender: 'Male', identification_mark: 'Scar on chin',
    institution_roll: '726473', degree: 'B.Tech', branch: 'CSE', year_of_study: '2nd',
    guardian_name: 'Mohit Gaikwad', guardian_relation: 'Father',
    res_c_o: 'C/o M Gaikwad', res_p_o: 'Pune', res_pin: '411001', res_contact: '9437000013',
    cur_c_o: 'PCE Hostel', cur_p_o: 'Chandigarh', cur_pin: '160001', cur_contact: '9437000013',
    starting_date: '2026-05-13', no_of_days: 30, section_posted: 'UNIT-3',
    institution_name: 'Punjab College Of Engineering', registration_id: 'REG-20260513-WX56YZ',
  },
  {
    name: 'Sanju Samson', gender: 'Male', identification_mark: 'Hairline scar on temple',
    institution_roll: '726473', degree: 'BCA', branch: 'CSE', year_of_study: '3rd',
    guardian_name: 'Sanjay Samson', guardian_relation: 'Father',
    res_c_o: 'C/o Sanjay Samson', res_p_o: 'Kerala', res_pin: '682001', res_contact: '9437000014',
    cur_c_o: 'GIET Hostel', cur_p_o: 'Bhubaneswar', cur_pin: '751012', cur_contact: '9437000014',
    starting_date: '2026-05-14', no_of_days: 30, section_posted: 'UNIT-3',
    institution_name: 'GIET University', registration_id: 'REG-20260514-AB78CD',
  },
  {
    name: 'Urvil Patel', gender: 'Male', identification_mark: 'Gold tooth upper left',
    institution_roll: '726473', degree: 'B.Tech', branch: 'ME', year_of_study: '2nd',
    guardian_name: 'Daksh Patel', guardian_relation: 'Father',
    res_c_o: 'C/o Daksh Patel', res_p_o: 'Ahmedabad', res_pin: '380001', res_contact: '9437000015',
    cur_c_o: 'OUTR Hostel', cur_p_o: 'Bhubaneswar', cur_pin: '751013', cur_contact: '9437000015',
    starting_date: '2026-05-15', no_of_days: 30, section_posted: 'UNIT-4',
    institution_name: 'Odisha University of Technical Research', registration_id: 'REG-20260515-EF90GH',
  },
  {
    name: 'Hardik Sharma', gender: 'Male', identification_mark: 'Pierced left ear',
    institution_roll: '726471', degree: 'BSc', branch: 'CV', year_of_study: '3rd',
    guardian_name: 'Jay Sharma', guardian_relation: 'Father',
    res_c_o: 'C/o Jay Sharma', res_p_o: 'Kanpur', res_pin: '208001', res_contact: '9437000016',
    cur_c_o: 'IITM Hostel', cur_p_o: 'Chennai', cur_pin: '600001', cur_contact: '9437000016',
    starting_date: '2026-05-16', no_of_days: 30, section_posted: 'UNIT-7',
    institution_name: 'IIT Madras', registration_id: 'REG-20260516-IJ12KL',
  },
  {
    name: 'Kartik Sharma', gender: 'Male', identification_mark: 'Mole on right cheek',
    institution_roll: '726472', degree: 'B.Tech', branch: 'CV', year_of_study: '2nd',
    guardian_name: 'Pratik Sharma', guardian_relation: 'Father',
    res_c_o: 'C/o Pratik Sharma', res_p_o: 'Agra', res_pin: '282001', res_contact: '9437000017',
    cur_c_o: 'IITK Hall 5', cur_p_o: 'Kanpur', cur_pin: '208016', cur_contact: '9437000017',
    starting_date: '2026-05-17', no_of_days: 30, section_posted: 'UNIT-6',
    institution_name: 'IIT Kanpur', registration_id: 'REG-20260517-MN34OP',
  },
  {
    name: 'Dewald Brivis', gender: 'Male', identification_mark: 'Tattoo on right bicep',
    institution_roll: '726473', degree: 'MCA', branch: 'ME', year_of_study: '1st',
    guardian_name: 'Johnny Brivis', guardian_relation: 'Relative',
    res_c_o: 'C/o J Brivis', res_p_o: 'Goa', res_pin: '403001', res_contact: '9437000018',
    cur_c_o: 'IIIT KGP Hostel', cur_p_o: 'Kharagpur', cur_pin: '721001', cur_contact: '9437000018',
    starting_date: '2026-05-18', no_of_days: 30, section_posted: 'UNIT-3',
    institution_name: 'IIIT Kharagpur', registration_id: 'REG-20260518-QR56ST',
  },
  {
    name: 'Shivam Dube', gender: 'Male', identification_mark: 'Cleft chin',
    institution_roll: '726474', degree: 'BCA', branch: 'CV', year_of_study: '1st',
    guardian_name: 'Sanjay Dube', guardian_relation: 'Relative',
    res_c_o: 'C/o Sanjay Dube', res_p_o: 'Balangir', res_pin: '767001', res_contact: '9437000019',
    cur_c_o: 'Polytechnic Hostel', cur_p_o: 'Balangir', cur_pin: '767001', cur_contact: '9437000019',
    starting_date: '2026-05-19', no_of_days: 45, section_posted: 'UNIT-2',
    institution_name: 'Polytechnic Balangir', registration_id: 'REG-20260519-UV78WX',
  },
  {
    name: 'Jemi Overturn', gender: 'Female', identification_mark: 'Beauty spot on upper lip',
    institution_roll: '726475', degree: 'BSc', branch: 'CV', year_of_study: '4th',
    guardian_name: 'Orio Overturn', guardian_relation: 'Father',
    res_c_o: 'C/o Orio Overturn', res_p_o: 'Saintala', res_pin: '767032', res_contact: '9437000020',
    cur_c_o: 'PS College Hostel', cur_p_o: 'Saintala', cur_pin: '767032', cur_contact: '9437000020',
    starting_date: '2026-05-20', no_of_days: 45, section_posted: 'UNIT-10',
    institution_name: 'Saintala PS College', registration_id: 'REG-20260520-YZ90AB',
  },
]

db.exec('BEGIN')
let inserted = 0
let skipped = 0

for (const row of interns) {
  if (!row.name || !row.institution_roll) {
    console.log(`Skipping: missing name or institution_roll`)
    skipped++
    continue
  }
  try {
    stmt.run(
      row.name, row.gender, row.identification_mark,
      row.institution_roll, row.degree, row.branch, row.year_of_study,
      row.guardian_name, row.guardian_relation,
      row.res_c_o, row.res_p_o, row.res_pin, row.res_contact,
      row.cur_c_o, row.cur_p_o, row.cur_pin, row.cur_contact,
      row.starting_date, row.no_of_days, row.section_posted,
      row.institution_name, row.registration_id,
    )
    inserted++
  } catch (err) {
    console.log(`Error on "${row.name}": ${err.message}`)
    skipped++
  }
}

db.exec('COMMIT')
db.close()
console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`)
