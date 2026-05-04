# 🎨 Frontend Workflow Breakdown

The frontend is a modern, responsive Single Page Application (SPA) designed for clarity, security, and role-specific functionality. It communicates with the backend via secure HTTPS API calls.

---

## 1. Application Structure
- **Main Entry (`index.html`)**: Acts as the central hub. It contains the landing page, login forms, registration steps, and MFA (Multi-Factor Authentication) screens.
- **Role-Based Dashboards**: Separate HTML files are used for different user roles to ensure clean separation of concerns:
  - `student-dashboard.html`
  - `instructor-dashboard.html`
  - `hod-dashboard.html`
  - `admin-dashboard.html`

---

## 2. Core User Flows

### A. Registration & Onboarding
- **Role Selection**: Users first choose their role, which dynamically updates the registration fields.
- **Multi-Step Signup**: 
  1. Profile Info (Name, ID, Department, etc.)
  2. Credentials (Email, Password with strength validation)
  3. MFA Setup (Tailored to the role)
- **Encryption**: Data is prepared for secure transmission to the backend.

### B. Secure Login & MFA
- **Primary Auth**: Users enter email and password.
- **Secondary Auth (MFA)**: Upon successful primary auth, users are redirected to an MFA screen specific to their role:
  - **Student**: Email OTP (One-Time Password)
  - **Instructor**: TOTP (Authenticator App)
  - **HoD**: SMS OTP
  - **Admin**: Hardware Security Key (YubiKey)
- **Token Management**: The backend JWT is stored in `localStorage` and used for all subsequent authenticated requests.

### C. Dashboard Interaction
- **Grade Viewing**: Students view their own grades with a focus on data privacy (E2E simulation).
- **Grade Submission**: Instructors use a specialized form to submit student grades with remarks.
- **Vetting/Approval**: HoDs see a list of pending grades and can approve or reject them with a single click.

---

## 3. Security Features (Frontend)
- **Client-Side Validation**: Immediate feedback on form inputs, password strength, and data formats.
- **Session Security**: Automatic redirection to login if the JWT is missing or expired.
- **Content Security Policy (CSP)**: The frontend is protected by headers served by the backend, preventing XSS and data injection.
- **Input Sanitization**: Helper scripts (like `script.js`) manage interactive elements like MFA digit boxes with automatic focus switching.
