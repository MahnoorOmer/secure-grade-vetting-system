const express  = require("express");
const router   = express.Router();
const crypto   = require("crypto");
const pool     = require("../../database/db");
const authMiddleware = require("../middleware/authmiddleware");
const roleMiddleware = require("../middleware/rolemiddleware");
const { addLog } = require("../middleware/auditlogger");

// SUBMIT GRADE (Instructor)
router.post("/", authMiddleware, roleMiddleware(["Instructor"]), async (req, res) => {
  try {
    const sanitizeStr = (str) => typeof str === 'string' ? str.replace(/[<>'"]/g, '') : str;
    
    const gradeData = {
      studentId:   sanitizeStr(req.body.studentId || req.body.studentEmail),
      studentName: sanitizeStr(req.body.studentName),
      course:      sanitizeStr(req.body.course || req.body.courseCode),
      gradeValue:  req.body.gradeValue !== undefined ? req.body.gradeValue : req.body.marks,
      letterGrade: sanitizeStr(req.body.letterGrade),
      semester:    sanitizeStr(req.body.semester),
      remarks:     sanitizeStr(req.body.remarks),
    };

    if (!gradeData.studentId || gradeData.gradeValue === undefined) {
      return res.status(400).json({ error: "Missing studentId/email or gradeValue/marks" });
    }
    
    const signature = crypto.createHash("sha256")
      .update(JSON.stringify(gradeData) + req.user.id + Date.now()).digest("hex");

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO grades (id, data, signature, status, created_by)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING id, data, signature, status, created_at`,
      [id, JSON.stringify(gradeData), signature, req.user.id]
    );
    const grade = result.rows[0];
    await addLog(req.user.email, "GRADE_SUBMITTED", { gradeId: grade.id, studentId: gradeData.studentId }, req.user.id);
    res.status(201).json(grade);
  } catch (err) {
    console.error("Grade submit error:", err.message);
    res.status(500).json({ error: "Failed to submit grade" });
  }
});

// GET ALL GRADES (HoD / Admin)
router.get("/", authMiddleware, roleMiddleware(["HoD", "Admin"]), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.data, g.signature, g.status, g.created_at, g.updated_at,
              u1.email AS submitted_by, u1.role AS submitted_role,
              u2.email AS approved_by
       FROM grades g
       JOIN users u1 ON g.created_by = u1.id
       LEFT JOIN users u2 ON g.approved_by = u2.id
       ORDER BY g.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get grades error:", err.message);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

// GET MY GRADES (Student — by student_id in profile)
router.get("/my", authMiddleware, roleMiddleware(["Student"]), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.data, g.status, g.created_at, u1.email AS instructor_email
       FROM grades g
       JOIN users u1 ON g.created_by = u1.id
       ORDER BY g.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get my grades error:", err.message);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

// UPDATE GRADE STATUS (HoD)
router.patch("/:id", authMiddleware, roleMiddleware(["HoD"]), async (req, res) => {
  try {
    const allowedStatuses = ["approved", "rejected"];
    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }
    const current = await pool.query("SELECT id, status FROM grades WHERE id = $1", [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ error: "Grade not found" });
    const oldStatus = current.rows[0].status;

    const result = await pool.query(
      `UPDATE grades SET status = $1, approved_by = $2, updated_at = NOW()
       WHERE id = $3 RETURNING id, data, signature, status, updated_at`,
      [req.body.status, req.user.id, req.params.id]
    );
    const updated = result.rows[0];
    await addLog(req.user.email, "GRADE_STATUS_UPDATED", { gradeId: updated.id, oldStatus, newStatus: updated.status }, req.user.id);
    res.json(updated);
  } catch (err) {
    console.error("Update grade error:", err.message);
    res.status(500).json({ error: "Failed to update grade" });
  }
});

// VIEW AUDIT LOGS (HoD / Admin)
router.get("/logs", authMiddleware, roleMiddleware(["HoD", "Admin"]), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.id, al.action, al.timestamp, al.hash, al.previous_hash, al.metadata,
              u.email AS user_email, u.role AS user_role
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.timestamp DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get logs error:", err.message);
    res.status(500).json({ error: "Failed to retrieve audit trail" });
  }
});

module.exports = router;
