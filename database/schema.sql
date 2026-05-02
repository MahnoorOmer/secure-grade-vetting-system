-- ============================================================
-- SECURE GRADE VETTING SYSTEM — SQLite Schema + Seed Data
-- Roles: Student, Instructor, HoD, Admin
-- ============================================================

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id              TEXT            PRIMARY KEY,
    email           TEXT            NOT NULL UNIQUE,
    password_hash   TEXT            NOT NULL,
    role            TEXT            NOT NULL DEFAULT 'Student',
    profile         TEXT            DEFAULT '{}',
    mfa_type        TEXT,
    mfa_secret      TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

-- ============================================================
-- TABLE: grades
-- ============================================================

CREATE TABLE IF NOT EXISTS grades (
    id              TEXT            PRIMARY KEY,
    data            TEXT            NOT NULL,
    signature       TEXT,
    status          TEXT            NOT NULL DEFAULT 'pending',
    created_by      TEXT            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by     TEXT            REFERENCES users(id) ON DELETE SET NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_grades_created_by ON grades (created_by);
CREATE INDEX IF NOT EXISTS idx_grades_status     ON grades (status);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id              TEXT            PRIMARY KEY,
    action          TEXT            NOT NULL,
    user_id         TEXT            REFERENCES users(id) ON DELETE SET NULL,
    timestamp       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hash            TEXT            NOT NULL UNIQUE,
    previous_hash   TEXT            NOT NULL DEFAULT '0',
    metadata        TEXT            DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id   ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action    ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs (timestamp);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE TRIGGER IF NOT EXISTS set_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS set_grades_updated_at
    AFTER UPDATE ON grades
    FOR EACH ROW
BEGIN
    UPDATE grades SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================
-- SEED USERS
-- All passwords = Admin@1234  (bcrypt hash, 10 rounds)
-- ============================================================

INSERT OR IGNORE INTO users (id, email, password_hash, role, profile) VALUES
('u1_admin', 'admin@university.edu', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyNjZf8/2', 'Admin', '{"name":"System Administrator","emp_id":"ADM-001","dept":"IT Administration","phone":"+92-300-0000001"}'),
('u2_hod', 'hod@university.edu', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyNjZf8/2', 'HoD', '{"name":"Prof. Tariq Malik","emp_id":"EMP-2010-001","dept":"Computer Science","phone":"+92-300-1234567"}'),
('u3_inst', 'instructor@university.edu', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyNjZf8/2', 'Instructor', '{"name":"Dr. Sarah Ahmed","emp_id":"EMP-2019-045","dept":"Computer Science","courses":"CY321, CS401"}'),
('u4_stud', 'student@university.edu', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyNjZf8/2', 'Student', '{"name":"Ali Hassan","student_id":"CS-2021-001","program":"BS Computer Science","semester":"5th Semester"}');

-- ============================================================
-- SEED GRADES (submitted by instructor, referencing student)
-- ============================================================

INSERT OR IGNORE INTO grades (id, data, signature, status, created_by, approved_by) VALUES
('g1', '{"studentId":"CS-2021-001","studentName":"Ali Hassan","course":"CY321 - Cyber Security","gradeValue":"A","semester":"5th Semester","remarks":"Excellent performance"}', 'sig_grade1', 'approved', 'u3_inst', 'u2_hod'),
('g2', '{"studentId":"CS-2021-002","studentName":"Sara Khan","course":"CS401 - Software Engineering","gradeValue":"B+","semester":"5th Semester","remarks":"Good work"}', 'sig_grade2', 'pending', 'u3_inst', NULL),
('g3', '{"studentId":"CS-2021-003","studentName":"Ahmed Raza","course":"CY321 - Cyber Security","gradeValue":"B","semester":"5th Semester","remarks":"Needs improvement"}', 'sig_grade3', 'rejected', 'u3_inst', NULL),
('g4', '{"studentId":"CS-2021-001","studentName":"Ali Hassan","course":"CS401 - Software Engineering","gradeValue":"A+","semester":"5th Semester","remarks":"Outstanding"}', 'sig_grade4', 'pending', 'u3_inst', NULL);

-- ============================================================
-- SEED AUDIT LOGS
-- ============================================================

INSERT OR IGNORE INTO audit_logs (id, action, user_id, hash, previous_hash, metadata) VALUES
('a1', 'REGISTER', 'u1_admin', 'hash1', '0', '{"role":"Admin"}'),
('a2', 'LOGIN', 'u1_admin', 'hash2', 'hash1', '{"role":"Admin","ip":"127.0.0.1"}'),
('a3', 'GRADE_SUBMITTED', 'u3_inst', 'hash3', 'hash2', '{"course":"CY321","studentId":"CS-2021-001"}'),
('a4', 'GRADE_STATUS_UPDATED', 'u2_hod', 'hash4', 'hash3', '{"oldStatus":"pending","newStatus":"approved"}');
