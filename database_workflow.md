# 🗄️ Database Workflow Breakdown

The system utilizes **SQLite** for its database layer, providing a portable, file-based relational storage solution that is optimized for reliability and performance in this vetting system.

---

## 1. Database Architecture (`schema.sql`)
The database is structured around three primary tables designed to ensure data integrity and security:

### A. `users` Table
- **Primary Key**: UUID-based unique identifiers.
- **Security**: Stores hashed passwords (`password_hash`) and MFA secrets.
- **Profiles**: Stores role-specific metadata in a JSON-formatted `profile` column.
- **Status**: Includes `is_active` to allow for account deactivation.

### B. `grades` Table
- **Data Integrity**: Uses a `data` column (JSON) for grade details and a `signature` column for digital verification.
- **Workflow State**: Tracks status (`pending`, `approved`, `rejected`).
- **Relationships**: Links to `users` via `created_by` (Instructor) and `approved_by` (HoD).

### C. `audit_logs` Table
- **Tamper-Evidence**: Implements a hashing chain (`hash` and `previous_hash`) where each entry depends on the one before it.
- **Traceability**: Records every significant action with a timestamp and the actor's ID.

---

## 2. Database Logic & Connectivity (`db.js`)
- **Initialization**: On server startup, `db.js` checks for the existence of `secure_grade.sqlite`. If missing, it automatically creates the file and executes `schema.sql` to set up tables and seed data.
- **Agnostic Query Wrapper**: A custom wrapper is implemented to allow the backend to use Postgres-style query syntax (`$1`, `$2`) with SQLite, ensuring compatibility and ease of use.
- **Triggers**: Automated SQLite triggers are used to update the `updated_at` timestamps whenever a row in the `users` or `grades` tables is modified.

---

## 3. Data Integrity & Constraints
- **Foreign Keys**: Enforced to ensure that grades always refer to valid users and instructors.
- **Unique Constraints**: Emails and audit log hashes are strictly unique.
- **Cascading Rules**: `ON DELETE RESTRICT` and `SET NULL` are used strategically to prevent accidental data loss while maintaining an audit trail.

---

## 4. Seed Data
The database comes pre-seeded with a comprehensive set of data for demonstration:
- **Default Users**: Pre-configured accounts for Admin, HoD, Instructor, and Student.
- **Sample Grades**: A mix of approved, pending, and rejected grades to demonstrate the vetting workflow.
- **Initial Audit Trail**: Example logs to showcase the transparency of the system.
