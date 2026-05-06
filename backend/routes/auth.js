require("dotenv").config();
const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const chalk    = require("chalk");
const crypto   = require("crypto");
const pool     = require("../../database/db");
const { registerSchema, loginSchema } = require("../validators/authValidator");
const { addLog } = require("../middleware/auditlogger");
const authMiddleware = require("../middleware/authmiddleware");

// =====================
// REGISTER
// =====================
router.post("/register", async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    console.log(chalk.blue.bold("📝 [REGISTRATION ATTEMPT]: ") + chalk.white(req.body.email));

    if (!result.success) {
      console.error(chalk.red("❌ Validation Error:"), result.error.errors);
      return res.status(400).json({ error: "Invalid input data", details: result.error.errors });
    }

    const { email, password, role } = result.data;
    const normalizedEmail = email.toLowerCase();
    const allowedRoles = ["Student", "Instructor", "HoD", "Admin"];
    const userRole = allowedRoles.includes(role) ? role : "Student";

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1", [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Check for duplicate Student ID or Emp ID in profile
    const studentId = req.body.studentId;
    const empId = req.body.empId;

    if (studentId) {
      const existingStudent = await pool.query(
        "SELECT id FROM users WHERE json_extract(profile, '$.student_id') = $1", [studentId]
      );
      if (existingStudent.rows.length > 0) {
        return res.status(400).json({ error: "User with this Student ID already exists" });
      }
    }

    if (empId) {
      const existingEmp = await pool.query(
        "SELECT id FROM users WHERE json_extract(profile, '$.emp_id') = $1", [empId]
      );
      if (existingEmp.rows.length > 0) {
        return res.status(400).json({ error: "User with this Employee ID already exists" });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);

    const profile = {
      name:       req.body.name       || null,
      student_id: req.body.studentId  || null,
      emp_id:     req.body.empId      || null,
      dept:       req.body.dept       || null,
      phone:      req.body.phone      || null,
      program:    req.body.program    || null,
      semester:   req.body.semester   || null,
      courses:    req.body.courses    || null,
    };

    const id = crypto.randomUUID();
    const insertResult = await pool.query(
      `INSERT INTO users (id, email, password_hash, role, profile)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role`,
      [id, normalizedEmail, password_hash, userRole, JSON.stringify(profile)]
    );

    const newUser = insertResult.rows[0];
    await addLog(normalizedEmail, "REGISTER", { role: userRole }, newUser.id);

    console.log(chalk.green("✅ User Registered:"), normalizedEmail, `[${userRole}]`);
    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    console.error(chalk.red("🔥 Register Crash:"), err.message);
    res.status(500).json({ error: "Internal Server error" });
  }
});

// =====================
// LOGIN
// =====================
router.post("/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase();

    const userResult = await pool.query(
      "SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      console.log(chalk.red("❌ Login Fail:"), normalizedEmail, "not found");
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    if (!user.is_active && user.is_active !== 1) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      console.log(chalk.red("❌ Login Fail: Wrong password for"), normalizedEmail);
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    await pool.query(
      "UPDATE users SET otp_code = $1, otp_expires = $2 WHERE id = $3",
      [otp, expires, user.id]
    );

    console.log(chalk.yellow("🔑 OTP GENERATED:"), chalk.bold(otp), "for", normalizedEmail);
    
    if (user.role === 'Instructor' || user.role === 'HoD') {
      console.log(chalk.cyan.bold(`📢 [${user.role.toUpperCase()} OTP]: `) + chalk.bgYellow.black(` ${otp} `));
    }
    // In a real system, we'd send an email here.
    
    res.json({ message: "OTP sent to your registered email", requiresOTP: true, email: normalizedEmail });

  } catch (err) {
    console.error(chalk.red("🔥 Login Crash:"), err.message);
    res.status(500).json({ error: "Internal Server error" });
  }
});

// =====================
// VERIFY OTP
// =====================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP required" });
    }

    const normalizedEmail = email.toLowerCase();
    const userResult = await pool.query(
      "SELECT id, email, role, otp_code, otp_expires FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(401).json({ error: "Invalid OTP code" });
    }

    if (new Date() > new Date(user.otp_expires)) {
      return res.status(401).json({ error: "OTP has expired" });
    }

    // Clear OTP after successful use
    await pool.query(
      "UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE id = $1",
      [user.id]
    );

    const secret = process.env.JWT_SECRET || "fallback_secret_for_lab_only";
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: "1h" }
    );

    await addLog(normalizedEmail, "LOGIN_MFA_SUCCESS", { role: user.role }, user.id);

    console.log(chalk.green("🔓 MFA Login Success:"), normalizedEmail, `[${user.role}]`);
    res.json({ message: "Login successful", token, role: user.role });

  } catch (err) {
    console.error(chalk.red("🔥 OTP Verify Crash:"), err.message);
    res.status(500).json({ error: "Internal Server error" });
  }
});

// =====================
// GET PROFILE
// =====================
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query("SELECT profile FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(userResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// =====================
// UPDATE COURSES
// =====================
router.put("/profile/courses", authMiddleware, async (req, res) => {
  try {
    const { name, instructor, action, index } = req.body;
    const userResult = await pool.query("SELECT profile FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });

    let profile = JSON.parse(userResult.rows[0].profile || "{}");
    let courses = [];
    
    if (profile.courses) {
      if (Array.isArray(profile.courses)) {
        courses = profile.courses;
      } else if (typeof profile.courses === 'string') {
        courses = profile.courses.split(',').map(c => ({ name: c.trim(), instructor: 'N/A' })).filter(c => c.name);
      }
    }

    if (action === "add" && name) {
      if (!courses.find(c => c.name === name)) {
        courses.push({ name, instructor: instructor || 'N/A' });
      }
    } else if (action === "remove" && index !== undefined) {
      courses.splice(index, 1);
    }

    profile.courses = courses;
    await pool.query("UPDATE users SET profile = $1 WHERE id = $2", [JSON.stringify(profile), req.user.id]);

    res.json({ message: "Courses updated successfully", profile });
  } catch (err) {
    console.error("Course update error:", err);
    res.status(500).json({ error: "Failed to update courses" });
  }
});

module.exports = router;