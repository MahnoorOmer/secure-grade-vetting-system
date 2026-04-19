-- ===================================================
-- SecureGrade Vetting System – Database Schema
-- ===================================================

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ── USERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,
  role       TEXT    NOT NULL CHECK(role IN ('Student','Instructor','HoD','Admin')),
  full_name  TEXT,
  department TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  is_active  INTEGER NOT NULL DEFAULT 1
);

-- ── COURSES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT    NOT NULL UNIQUE,
  course_name TEXT    NOT NULL,
  department  TEXT,
  credits     INTEGER DEFAULT 3,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── GRADES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grades (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  student_email  TEXT    NOT NULL,
  course_code    TEXT    NOT NULL,
  marks          REAL    NOT NULL CHECK(marks >= 0 AND marks <= 100),
  letter_grade   TEXT    NOT NULL,
  semester       TEXT    NOT NULL,
  status         TEXT    NOT NULL DEFAULT 'PENDING'
                          CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  submitted_by   TEXT    NOT NULL,
  reviewed_by    TEXT,
  rejection_note TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  reviewed_at    TEXT,
  FOREIGN KEY (student_email) REFERENCES users(email),
  FOREIGN KEY (submitted_by)  REFERENCES users(email)
);

-- ── AUDIT LOGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  action     TEXT    NOT NULL,
  actor      TEXT    NOT NULL,
  details    TEXT,                -- JSON blob
  ip_address TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── INDEXES ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_grades_student  ON grades(student_email);
CREATE INDEX IF NOT EXISTS idx_grades_status   ON grades(status);
CREATE INDEX IF NOT EXISTS idx_grades_semester ON grades(semester);
CREATE INDEX IF NOT EXISTS idx_audit_action    ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_actor     ON audit_logs(actor);

-- ── SEED DATA ──────────────────────────────────────
-- Default courses
INSERT OR IGNORE INTO courses (course_code, course_name, department, credits) VALUES
  ('CS101', 'Introduction to Programming', 'Computer Science', 3),
  ('CS201', 'Data Structures & Algorithms', 'Computer Science', 4),
  ('CS301', 'Database Systems', 'Computer Science', 3),
  ('CS401', 'Software Engineering', 'Computer Science', 4),
  ('MATH101', 'Calculus I', 'Mathematics', 3),
  ('MATH201', 'Linear Algebra', 'Mathematics', 3),
  ('ENG101', 'Technical Writing', 'English', 2),
  ('PHY101', 'Physics I', 'Physics', 4);

