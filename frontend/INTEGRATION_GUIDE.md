# SecureGrade Frontend – Integration Guide

## 📁 File Structure
```
SecureGrade-Frontend/
├── index.html                  ← Landing + Login + Signup + MFA
├── student-dashboard.html      ← Student: view grades, GPA
├── instructor-dashboard.html   ← Instructor: submit grades
├── hod-dashboard.html          ← HoD: approve grades, audit log
├── admin-dashboard.html        ← Admin: full system management
└── INTEGRATION_GUIDE.md        ← This file
```

---

## 🚀 Step-by-Step Setup

### Step 1: Start the Backend
```bash
cd secure-grade-vetting-sys
node backend/server.js
# Server runs on http://localhost:5000
```

### Step 2: Open the Frontend
Simply open `index.html` in your browser. No build step needed.
> If you get CORS errors, install the **Allow CORS** Chrome extension or serve via `npx serve .`

### Step 3: Test the Flow
1. Click **Sign Up** → choose a role → fill info → set up MFA → create account
2. Go to **Login** → enter credentials → verify MFA → reach dashboard

---

## 🔌 API Integration Details

### Base URL
All API calls go to: `http://localhost:5000`

### Endpoints Used by Frontend

| Screen | Method | URL | Auth |
|--------|--------|-----|------|
| Signup | POST | `/auth/register` | None |
| Login | POST | `/auth/login` | None |
| Submit Grade | POST | `/grades` | Bearer JWT |
| Get All Grades | GET | `/grades` | Bearer JWT (HoD only) |
| Update Grade | PATCH | `/grades/:id` | Bearer JWT (HoD only) |
| Get Audit Logs | GET | `/grades/logs` | Bearer JWT (HoD only) |

### Request/Response Examples

**Register:**
```js
POST /auth/register
Body: { email, password, role }
Response: { message: "User registered successfully" }
```

**Login:**
```js
POST /auth/login
Body: { email, password }
Response: { token: "eyJhbGciOiJIUzI1NiIs..." }
```

**Submit Grade (Instructor):**
```js
POST /grades
Headers: { Authorization: "Bearer <token>" }
Body: { studentEmail, courseCode, marks, letterGrade, semester }
Response: { id, status: "PENDING", submittedBy, createdAt, ... }
```

**Approve/Reject Grade (HoD):**
```js
PATCH /grades/:id
Headers: { Authorization: "Bearer <token>" }
Body: { status: "APPROVED" | "REJECTED" }
```

---

## 🔐 Security Features Implemented

### Authentication
- **JWT Tokens** — signed with `secretkey`, expire in 1 hour
- Stored in `localStorage` as `sg_token`
- Sent as `Authorization: Bearer <token>` header

### Role-Based Access
| Role | Dashboard | Key Permissions |
|------|-----------|-----------------|
| Student | student-dashboard.html | View own grades only |
| Instructor | instructor-dashboard.html | Submit grades via POST /grades |
| HoD | hod-dashboard.html | Approve/Reject via PATCH, view audit logs |
| Admin | admin-dashboard.html | Full system, user management |

### MFA (Simulated, Role-Specific)
| Role | MFA Type | How It Works |
|------|----------|--------------|
| Student | Security Questions | Answer 2 questions set during signup |
| Instructor | TOTP (Authenticator App) | Enter any 6-digit code (simulated) |
| HoD | SMS OTP | Enter 123456 (demo OTP) |
| Admin | Hardware Security Key | Paste key output or click simulate |

### End-to-End Encryption (Simulated)
- All forms show encryption indicators
- In production: implement AES-256 on the frontend before sending sensitive data
- Use `crypto.subtle` Web Crypto API for real E2E encryption

---

## 🔧 Making It Production-Ready

### 1. Fix the JWT Secret
In `backend/routes/auth.js`, change:
```js
// BEFORE (insecure)
const token = jwt.sign(..., "secretkey", ...)

// AFTER (secure)
const token = jwt.sign(..., process.env.JWT_SECRET, ...)
```
And in `.env`:
```
JWT_SECRET=your-super-secret-64-char-random-key
```

### 2. Add Rate Limiting to Backend
```bash
npm install express-rate-limit
```
In `server.js`:
```js
const rateLimit = require('express-rate-limit');
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));
```

### 3. Add HTTPS
Use a reverse proxy (nginx) with SSL cert, or deploy to Vercel/Railway which auto-provides HTTPS.

### 4. Real MFA (TOTP)
```bash
npm install speakeasy qrcode
```
Generate a secret per user and verify TOTP codes server-side.

### 5. Real Database
Replace in-memory arrays with MongoDB or PostgreSQL.

### 6. Update CORS in server.js
```js
app.use(cors({ origin: 'https://your-frontend-domain.com' }));
```

---

## 🎨 Demo Credentials (Demo Mode)

If the backend is offline, the frontend runs in **Demo Mode**:

| Role | Email hint | Password |
|------|-----------|----------|
| Admin | admin@... | anything |
| HoD | hod@... | anything |
| Instructor | instructor@... | anything |
| Student | anything else | anything |

The role is auto-detected from the email prefix.
