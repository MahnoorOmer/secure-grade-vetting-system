// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authmiddleware");
// const roleMiddleware = require("../middleware/rolemiddleware");
// const { addLog, getLogs } = require("../middleware/auditlogger");

// const grades = [];


// // =====================
// // SUBMIT GRADE (Instructor)
// // =====================
// router.post("/", authMiddleware, roleMiddleware("Instructor"), (req, res) => {
//   const grade = {
//     ...req.body,
//     id: Date.now(),
//     status: "PENDING",
//     submittedBy: req.user.email,
//     createdAt: new Date().toISOString()
//   };

//   grades.push(grade);

//   // 🔥 ADD LOG HERE
//   addLog("GRADE_SUBMITTED", req.user.email, {
//     gradeId: grade.id
//   });

//   res.json(grade);
// });


// // =====================
// // GET ALL GRADES (HoD)
// // =====================
// router.get("/", authMiddleware, roleMiddleware("HoD"), (req, res) => {
//   res.json(grades);
// });


// // =====================
// // UPDATE GRADE STATUS (HoD)
// // =====================
// router.patch("/:id", authMiddleware, roleMiddleware("HoD"), (req, res) => {
//   const grade = grades.find(g => g.id == req.params.id);

//   if (!grade) {
//     return res.status(404).json({ error: "Grade not found" });
//   }

//   const oldStatus = grade.status;

//   grade.status = req.body.status;
//   grade.reviewedBy = req.user.email;
//   grade.reviewedAt = new Date().toISOString();

//   // 🔥 ADD LOG HERE
//   addLog("GRADE_UPDATED", req.user.email, {
//     gradeId: grade.id,
//     oldStatus,
//     newStatus: grade.status
//   });

//   res.json(grade);
// });


// // =====================
// // VIEW LOGS (HoD ONLY)
// // =====================
// router.get("/logs", authMiddleware, roleMiddleware("HoD"), (req, res) => {
//   res.json(getLogs());
// });

// module.exports = router;









const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authmiddleware");
const roleMiddleware = require("../middleware/rolemiddleware");
const { addLog, getLogs } = require("../middleware/auditlogger");

// In-memory store (Consider moving this to a JSON file in Phase 4 for persistence)
const grades = [];

// =====================
// SUBMIT GRADE (Instructor)
// =====================
// Security Upgrade: Using array in roleMiddleware to allow for future role expansion
router.post("/", authMiddleware, roleMiddleware(["Instructor"]), (req, res) => {
    // Basic Input Validation
    if (!req.body.studentId || !req.body.gradeValue) {
        return res.status(400).json({ error: "Missing required grade details" });
    }

    const grade = {
        ...req.body,
        id: Date.now(),
        status: "PENDING",
        submittedBy: req.user.email, // Integrity: Always use verified email from JWT
        createdAt: new Date().toISOString()
    };

    grades.push(grade);

    // 🔥 AUDIT LOG: Part of Phase 3 Security
    // This will be hashed in the logger to ensure the trail is tamper-evident
    addLog(req.user.email, "GRADE_SUBMITTED", {
        gradeId: grade.id,
        studentId: grade.studentId
    });

    res.json(grade);
});


// =====================
// GET ALL GRADES (HoD / Admin)
// =====================
// Security Upgrade: Granting Admin access for system oversight
router.get("/", authMiddleware, roleMiddleware(["HoD", "Admin"]), (req, res) => {
    res.json(grades);
});


// =====================
// UPDATE GRADE STATUS (HoD)
// =====================
router.patch("/:id", authMiddleware, roleMiddleware(["HoD"]), (req, res) => {
    const grade = grades.find(g => g.id == req.params.id);

    if (!grade) {
        return res.status(404).json({ error: "Grade not found" });
    }

    // Security Upgrade: Validate status transition (e.g., only ALLOWED statuses)
    const allowedStatuses = ["APPROVED", "REJECTED"];
    if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ error: "Invalid status update" });
    }

    const oldStatus = grade.status;
    grade.status = req.body.status;
    grade.reviewedBy = req.user.email;
    grade.reviewedAt = new Date().toISOString();

    // 🔥 AUDIT LOG: Records the vetting decision
    addLog(req.user.email, "GRADE_UPDATED", {
        gradeId: grade.id,
        oldStatus,
        newStatus: grade.status
    });

    res.json(grade);
});


// =====================
// VIEW LOGS (HoD / Admin ONLY)
// =====================
// This endpoint allows the HoD to view the tamper-evident audit trail
router.get("/logs", authMiddleware, roleMiddleware(["HoD", "Admin"]), (req, res) => {
    try {
        const logs = getLogs();
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve audit trail" });
    }
});

module.exports = router;
