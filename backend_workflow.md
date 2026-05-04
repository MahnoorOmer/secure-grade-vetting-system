# 🖥️ Backend Workflow Breakdown

The backend of the **Secure Grade Vetting System** is a robust Node.js/Express application engineered with a "Security-First" architecture. It handles authentication, authorization, grade management, and immutable audit logging.

---

## 1. Server Initialization (`server.js`)

The entry point of the application sets up a secure execution environment:

- **HTTPS/TLS 1.3**: The server runs exclusively over HTTPS using local SSL certificates (`key.pem`, `cert.pem`) to ensure all data in transit is encrypted.
- **Security Middleware**:
  - **Helmet**: Enforces secure HTTP headers and a strict **Content Security Policy (CSP)**.
  - **CORS**: Configured to restrict cross-origin requests to trusted sources.
  - **Rate Limiting**: Protects authentication endpoints from brute-force attacks by limiting requests per IP.
- **Static Hosting**: Serves the frontend files directly from the `frontend` directory.

---

## 2. Authentication & Authorization
The system uses a multi-layered approach to verify identity:
- **JWT (JSON Web Tokens)**: Once a user logs in, they receive a signed JWT stored in `localStorage`. This token is required for all subsequent API requests.
- **bcrypt Hashing**: Passwords are never stored in plain text; they are hashed with a salt (10 rounds) before being saved to the database.
- **Role-Based Access Control (RBAC)**: Custom middleware (`rolemiddleware.js`) verifies the user's role before allowing access to specific routes (e.g., only HoDs can approve grades).

---

## 3. Core Workflow Components

### A. Authentication Route (`routes/auth.js`)
- **Register**: Validates input using Zod schemas, hashes passwords, and initializes user profiles.
- **Login**: Verifies credentials and generates the JWT.

### B. Grade Management Route (`routes/grades.js`)
- **Submission**: Instructors submit grades which are digitally "signed" using a SHA-256 hash of the grade data and instructor ID.
- **Retrieval**: Different views for Students (own grades), Instructors (submitted grades), and HoDs (all pending grades).
- **Approval**: HoDs can transition grades from `pending` to `approved` or `rejected`.

### C. Tamper-Evident Audit Logger (`middleware/auditlogger.js`)
This is a critical security component:
- **Hash Chain**: Every log entry contains a SHA-256 hash of its own data plus the hash of the *previous* entry.
- **Immutability**: This creates a cryptographically linked chain, making it impossible to alter a previous log entry without breaking the entire chain.
- **Event Tracking**: Logs every Login, Registration, Grade Submission, and Status Update.

---

## 4. Error Handling & Validation
- **Input Validation**: Uses `validators/authValidator.js` to ensure data integrity before processing.
- **Global Error Handler**: Catches server crashes and prevents sensitive stack traces from leaking to the client in production.
- **JSON Sanitization**: Protects against malformed JSON payloads and DoS attacks by limiting body size.
