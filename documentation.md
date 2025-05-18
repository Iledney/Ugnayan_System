# LUPON - UGNAYAN
## Church Management System Documentation

### Project Team
- **Project Manager:** Cristine Mariel Sabado
- **Back-end Programmer:** Yendell David Gainsan
- **Course:** BSIT 2B

---

## Table of Contents
1. [Planning Phase](#planning-phase)
2. [Requirements Phase](#requirements-phase)
3. [Design Phase](#design-phase)
4. [Implementation Phase](#implementation-phase)
5. [Testing Phase](#testing-phase)

---

## Planning Phase

### 1. Project Title
**Lupon-Ugnayan**

### 2. Project Description
The Ugnayan System is a web-based platform designed to streamline church operations. It addresses common challenges such as managing attendance, sermons, finances, and events. By centralizing these functions, the system improves efficiency, reduces errors, and enhances member engagement.

### 3. Objectives
- Develop a centralized system to manage church operations efficiently
- Provide modules for attendance tracking, sermon management, financial management, and event announcements
- Ensure the system is user-friendly, responsive, and secure
- Enable church administrators to generate reports and manage data effectively

### 4. Current Implementation Status

#### Working Features
- **User Authentication:** 
  - Login functionality
  - Role-based access (Admin/User)
  - User registration

- **Events Management:**
  - Add new events with details and images
  - View list of events
  - Update event information
  - Delete events
  - Image upload functionality

- **Attendance System:**
  - QR code-based attendance tracking
  - View attendance records per event
  - Record attendance with timestamp
  - Status tracking (Present/Absent)

- **Dashboard:**
  - Basic statistics display
  - Daily verse section
  - Announcements section
  - Quick stats widget

#### Partially Working Features
- **Sermons Management:**
  - Basic upload functionality
  - View sermon list
  - Issues with file storage

- **Finance Module:**
  - Basic contribution tracking
  - Simple financial records
  - Needs improvement in reporting

#### Features Under Development
- **Violations Management**
- **User Profile Management**
- **Advanced Financial Reporting**
- **Event Analytics**

### 5. Known Issues
1. Backend API occasionally fails due to dependency issues
2. Image upload size limitations
3. QR code scanning sometimes unreliable
4. Dashboard data not updating in real-time
5. Some API endpoints return incorrect data formats

### 6. Tools and Technologies Currently in Use
- **Frontend:** Angular 17
- **Backend:** PHP 7.3.29
- **Database:** MySQL
- **Development Server:** XAMPP
- **Version Control:** Git
- **API Testing:** Postman

---

## Implementation Details

### 1. Current API Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| /auth/login | ✅ Working | User authentication |
| /events | ✅ Working | CRUD operations for events |
| /attendance | ✅ Working | Attendance tracking |
| /sermons | ⚠️ Partial | Upload issues |
| /violations | ❌ Not Working | Under development |
| /dashboard | ⚠️ Partial | Data sync issues |
| /finance | ⚠️ Partial | Basic functionality only |

### 2. Database Tables in Use

| Table | Status | Purpose |
|-------|--------|---------|
| users | ✅ Active | User information and authentication |
| events | ✅ Active | Event management |
| attendance | ✅ Active | Attendance records |
| sermons | ⚠️ Partial | Sermon recordings and details |
| finances | ⚠️ Partial | Financial records |

### 3. Current Dependencies
- Firebase JWT for authentication
- QR Code library for attendance
- Axios for HTTP requests
- Angular Material for UI components

---

## Testing Status

### 1. Working Features Test Results

| Feature | Test Cases | Status |
|---------|------------|---------|
| Login | 2/2 | ✅ Pass |
| Event Management | 4/4 | ✅ Pass |
| Attendance | 3/3 | ✅ Pass |
| Dashboard | 2/4 | ⚠️ Partial |
| Sermons | 1/3 | ⚠️ Partial |
| Finance | 1/2 | ⚠️ Partial |

### 2. Known Bugs
1. Dashboard statistics don't update automatically
2. Some image uploads fail silently
3. Attendance QR code scanning needs multiple attempts
4. Session management issues on certain browsers
5. API endpoint timeouts under heavy load

### 3. Next Steps
1. Fix backend dependency issues
2. Implement proper error handling
3. Complete the violations module
4. Enhance financial reporting
5. Improve real-time data updates 