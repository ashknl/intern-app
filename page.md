.1 Introduction
The Attendance Management System developed in this project is a web-based application designed to automate and streamline the process of attendance tracking for contractual workers. The system is implemented using HTML, CSS, JavaScript for the frontend, PHP for backend processing, and MySQL as the database.
The system replaces traditional manual attendance methods with an automated solution that processes biometric punch data, calculates working hours, classifies attendance status, and generates structured reports. The system is specifically designed for industrial environments where multiple contractors manage a large workforce under varying shifts.
The application follows a modular architecture where each function such as contractor management, employee registration, CSV import, attendance calculation, and report generation operates as an independent module integrated into a unified system.

Fig 4.1 Overall Attendance Processing System Flow
4.2 System Overview
The system consists of two main interfaces:
Admin Dashboard 
Report/User Interface 
The admin dashboard is the control center of the system, providing access to all operational functionalities such as adding contractors, editing employee data, importing punch records, applying attendance corrections, and generating reports.
The system interacts with multiple database tables to ensure structured data storage:
master → Stores employee and contractor mapping 
raw_punch → Stores raw biometric punch data 
attendance_final → Stores processed attendance records 
contractor_details → Stores contractor information 
admin_login → Stores admin authentication details 

Fig4.2 Punch Data Grouping Logic
4.3 System Architecture
The system follows a 3-tier architecture model:
1. Presentation Layer (Frontend)
HTML, CSS, JavaScript 
Handles user interaction 
Provides forms, dashboards, and report UI 
2. Application Layer (Backend)
PHP 
Handles business logic such as: 
Attendance calculation 
CSV processing 
PRC updates 
Data validation 
3. Database Layer
MySQL 
Stores all structured data 
Ensures data integrity and relational mapping 
4.4 Module Description
4.4.1 Add Contractor Module
This module allows the administrator to register new contractors along with their employees.
Key functions:
Add contractor name and supply order details 
Add multiple employees under a contractor 
Auto-generate employee ID using Aadhaar number 
Validate duplicate Aadhaar and employee IDs 
Store employee details in the master table 
This module ensures structured onboarding of workforce data into the system.
4.4.2 Edit Employee Module (Manual Update)
This module allows administrators to update employee information.
Features:
Search employee using Employee ID 
Display existing details from master table 
Update fields such as: 
Name 
Phone number 
Category 
DOB 
Address 
Prevent invalid updates using form validation 
This ensures data remains accurate and up to date.
4.4.3 CSV Import Module (Raw Punch Entry)
This module is responsible for importing biometric attendance data.
Process:
Admin uploads CSV file from biometric system 
System reads and validates each record 
Data is inserted into raw_punch table 
Duplicate punch entries are ignored 
Employee existence is verified from master table 
After import, the system triggers automatic attendance processing using process_punching.php.
4.4.4 Attendance Processing Module (Core Engine)
This is the most critical component of the system.
The module processes raw punch data and converts it into structured attendance records stored in attendance_final.
Processing Logic:
Group punch data by employee and date 
Sort punches in chronological order 
Identify: 
First punch (IN time) 
Last punch (OUT time) 
Calculate working hours using time difference 
Apply night shift handling logic 
Assign attendance status based on rules 

Fig4.3 Working Hour Calculation
Attendance Status Rules:
PR (Present): Working hours ≥ 8.5 hours 
AB (Absent): No punch recorded 
SP (Single Punch): Only one punch available 
PP (Partially Present): Working hours < 8.5 hours but ≥ minimum threshold 
PRC (Corrected Present): Manually corrected attendance 

Fig4.4 Punch Data Grouping Logic


Night Shift Handling:
The system includes advanced logic for night shifts:
If punch occurs after 8:30 PM, it is treated as night shift start 
Cross-day punches are combined with next-day punches 
Ensures correct calculation across midnight boundaries 
Transaction Handling:
MySQL transactions are used 
Ensures data consistency 
Rolls back if processing fails 
This module acts as the core intelligence engine of the system.

Fig4.5 Night Shift Handling Logic


4.4.5 PRC (Attendance Correction Module)
This module allows administrators to correct attendance records.
Features:
Search attendance by Employee ID and Date 
View existing attendance status 
Change status to PRC (Present Corrected) 
Confirm update before saving changes 
This module ensures flexibility in handling exceptional attendance cases.
4.4.6 Report Generation Module
This module generates detailed attendance reports in tabular format.
Features:
Date range selection 
Contractor-wise grouping 
Category-wise grouping 
Daily attendance grid view 
Automatic calculation of: 
PR (Present) 
AB (Absent) 
SP (Single Punch) 
PP (Partially Present) 
PRC (Corrected Present) 
Reports are generated dynamically using SQL queries and displayed in printable format.
The report also supports printing directly from the browser.
4.5 Database Design
The system uses a relational database model.
4.5.1 master table
Stores employee and contractor mapping.
Fields:
employee_id 
contractor_name 
employee_name 
category 
aadhaar_number 
phone_number 
dob 
address 
4.5.2 raw_punch table
Stores raw biometric data.
Fields:
employee_id 
punch_date 
punch_time 
4.5.3 attendance_final table
Stores processed attendance.
Fields:
employee_id 
attendance_date 
in_time 
out_time 
working_hours 
status 
4.5.4 admin_login table
Stores admin credentials for secure login.
4.6 System Workflow
The workflow of the system is as follows:
Admin logs into the system 
Contractor and employee details are added 
Biometric CSV file is uploaded 
Raw punch data is stored in database 
Attendance processing engine calculates attendance 
Attendance records are stored in final table 
Reports are generated for analysis 
Corrections are applied if required

4.9 Input and Output Design
Input:
Contractor details 
Employee information 
CSV punch data 
Attendance correction data 
Date range for reports 
Output:
Attendance status (PR, AB, SP, PP, PRC) 
Working hours calculation 
Contractor-wise reports 
Printable monthly reports 
4.10 Security Features
Session-based authentication for admin login 
Auto logout after inactivity (1 hour) 
SQL injection prevention using escaping 
Input validation for all forms 






4.11 Screenshots 

Fig4.8 Admin Dashboard

Fig4.9 Add Contractor Page


Fig4.10 Import CSV page     

          Fig4.11 Attendance Report Page


       Fig4.12 Apply PRC page
4.12 Advantages of the System
Reduces manual attendance workload 
Eliminates calculation errors 
Supports large-scale workforce management 
Handles complex shift patterns 
Provides structured reporting 
Improves transparency and accuracy 
Enables quick data retrieval 
4.13 Limitations of the System
Requires manual CSV upload 
No real-time biometric integration 
Dependent on correct punch data format 
Web-based system requires server setup 
4.14 Future Enhancements
Real-time biometric device integration 
Mobile application support 
Cloud-based deployment 
AI-based attendance anomaly detection 
Payroll system integration 
Advanced analytics dashboard 
4.15 Chapter Summary
This chapter presented a detailed explanation of the Attendance Management System including its architecture, modules, database structure, workflow, and processing logic. The system successfully automates attendance tracking for contractual workers and improves efficiency, accuracy, and scalability in workforce management.







4.7 System Architecture of Attendance Management System

Fig4.6 System Architecture
4.8 Database Architecture of Attendance Management System

Fig4.7 Database Architecture
4.9 Input and Output Design
Input:
Contractor details 
Employee information 
CSV punch data 
Attendance correction data 
Date range for reports 
Output:
Attendance status (PR, AB, SP, PP, PRC) 
Working hours calculation 
Contractor-wise reports 
Printable monthly reports 
4.10 Security Features
Session-based authentication for admin login 
Auto logout after inactivity (1 hour) 
SQL injection prevention using escaping 
Input validation for all forms 

