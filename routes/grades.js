const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authmiddleware");
const roleMiddleware = require("../middleware/rolemiddleware");
const { addLog, getLogs } = require("../middleware/auditlogger");

const grades = [];


// =====================
// SUBMIT GRADE (Instructor)
// =====================
router.post("/", authMiddleware, roleMiddleware("Instructor"), (req, res) => {
  const grade = {
    ...req.body,
    id: Date.now(),
    status: "PENDING",
    submittedBy: req.user.email,
    createdAt: new Date().toISOString()
  };

  grades.push(grade);

  // 🔥 ADD LOG HERE
  addLog("GRADE_SUBMITTED", req.user.email, {
    gradeId: grade.id
  });

  res.json(grade);
});


// =====================
// GET ALL GRADES (HoD)
// =====================
router.get("/", authMiddleware, roleMiddleware("HoD"), (req, res) => {
  res.json(grades);
});


// =====================
// UPDATE GRADE STATUS (HoD)
// =====================
router.patch("/:id", authMiddleware, roleMiddleware("HoD"), (req, res) => {
  const grade = grades.find(g => g.id == req.params.id);

  if (!grade) {
    return res.status(404).json({ error: "Grade not found" });
  }

  const oldStatus = grade.status;

  grade.status = req.body.status;
  grade.reviewedBy = req.user.email;
  grade.reviewedAt = new Date().toISOString();

  // 🔥 ADD LOG HERE
  addLog("GRADE_UPDATED", req.user.email, {
    gradeId: grade.id,
    oldStatus,
    newStatus: grade.status
  });

  res.json(grade);
});


// =====================
// VIEW LOGS (HoD ONLY)
// =====================
router.get("/logs", authMiddleware, roleMiddleware("HoD"), (req, res) => {
  res.json(getLogs());
});

module.exports = router;