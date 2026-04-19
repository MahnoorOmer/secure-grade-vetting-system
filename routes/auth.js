const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");




// temporary in-memory users
const users = [];

// =====================
// REGISTER
// =====================
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "All fields required" });
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: Date.now(),
    email,
    password: hashedPassword,
    role
  };

  users.push(user);

  res.json({ message: "User registered successfully" });
});

// =====================
// LOGIN
// =====================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    "secretkey",
    { expiresIn: "1h" }
  );

  res.json({ token });
});

module.exports = router;