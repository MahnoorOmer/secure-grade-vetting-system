// require('dotenv').config();

// const express = require("express");
// const router = express.Router();

// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");




// // temporary in-memory users
// const users = [];

// // =====================
// // REGISTER
// // =====================
// router.post("/register", async (req, res) => {
//   const { email, password, role } = req.body;

//   if (!email || !password || !role) {
//     return res.status(400).json({ error: "All fields required" });
//   }

//   const existingUser = users.find(u => u.email === email);

//   if (existingUser) {
//     return res.status(400).json({ error: "User already exists" });
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const user = {
//     id: Date.now(),
//     email,
//     password: hashedPassword,
//     role
//   };

//   users.push(user);

//   res.json({ message: "User registered successfully" });
// });

// // =====================
// // LOGIN
// // =====================
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   const user = users.find(u => u.email === email);

//   if (!user) {
//     return res.status(404).json({ error: "User not found" });
//   }

//   const valid = await bcrypt.compare(password, user.password);

//   if (!valid) {
//     return res.status(401).json({ error: "Invalid password" });
//   }

//   const token = jwt.sign(
//     { id: user.id, email: user.email, role: user.role },
//     "secretkey",
//     { expiresIn: "1h" }
//   );

//   const token = jwt.sign(
//       { id: user.id, email: user.email, role: user.role },
//       process.env.JWT_SECRET, // Use the variable here
//       { expiresIn: "1h" }
//     );
//     ```

//   res.json({ token });
// });

// module.exports = router;










// require("dotenv").config();

// const express = require("express");
// const router = express.Router();

// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");

// const { registerSchema, loginSchema } = require("../validators/authValidator");

// // temporary in-memory users
// const users = [];

// // =====================
// // REGISTER
// // =====================
// router.post("/register", async (req, res) => {
//   try {
//     const result = registerSchema.safeParse(req.body);

//     console.log(chalk.magenta("RECV DATA:"), req.body);

// if (!result.success) {
//   return res.status(400).json({ error: result.error.errors });
// }

// const { email, password, role } = result.data;
//     const existingUser = users.find(u => u.email === email);

//     if (existingUser) {
//       return res.status(400).json({ error: "User already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = {
//       id: Date.now(),
//       email,
//       password: hashedPassword,
//       role
//     };

//     users.push(user);

//     res.json({ message: "User registered successfully" });

//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // =====================
// // LOGIN
// // =====================
// router.post("/login", async (req, res) => {
//   try {
//    const result = loginSchema.safeParse(req.body);

// if (!result.success) {
//   return res.status(400).json({ error: result.error.errors });
// }

// console.log("Current Users in Memory:", users);

// const { email, password } = result.data;

//     const user = users.find(u => u.email === email);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const valid = await bcrypt.compare(password, user.password);

//     if (!valid) {
//       return res.status(401).json({ error: "Invalid password" });
//     }

//     // ✅ Use environment variable for secret
//     const token = jwt.sign(
//       { id: user.id, email: user.email, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.json({ token });

//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;





















require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

const { registerSchema, loginSchema } = require("../validators/authValidator");
const usersFilePath = path.join(__dirname, "../data/users.json");

// Helper: Ensure the file exists so the server doesn't crash on first run
if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([]));
}

// Helper: Standardized way to read users from the file
const getUsersFromFile = () => {
    try {
        const fileData = fs.readFileSync(usersFilePath, "utf8");
        return JSON.parse(fileData);
    } catch (err) {
        console.error(chalk.red("File Read Error:"), err);
        return [];
    }
};

// =====================
// REGISTER
// =====================
router.post("/register", async (req, res) => {
    try {
        // 1. Validate Input
        const result = registerSchema.safeParse(req.body);
        console.log(chalk.magenta("📥 RECV REGISTER:"), req.body.email);

        if (!result.success) {
            console.log(chalk.red("❌ Validation Failed"), result.error.errors);
            return res.status(400).json({ error: "Invalid input data" });
        }

        const { email, password, role } = result.data;
        const normalizedEmail = email.toLowerCase();

        // 2. Persistent Check (Read from File)
        const users = getUsersFromFile();

        const existingUser = users.find(u => u.email === normalizedEmail);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // 3. Securely Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create User Object
        const newUser = {
            id: Date.now(), 
            email: normalizedEmail,
            password: hashedPassword,
            role: role || 'Student',
            createdAt: new Date().toISOString()
        };

        // 5. Persistent Save (Write to File)
        users.push(newUser);
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

        console.log(chalk.green("✅ User Registered Permanently. Total Users:"), users.length);
        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        console.error(chalk.red("🔥 Register Crash:"), err); 
        res.status(500).json({ error: "Internal Server error" });
    }
});

// =====================
// LOGIN
// =====================
router.post("/login", async (req, res) => {
    try {
        // 1. Validate Input
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const { email, password } = result.data;
        const normalizedEmail = email.toLowerCase();

        // 2. Find User in Persistent Store
        const users = getUsersFromFile();
        const user = users.find(u => u.email === normalizedEmail);

        if (!user) {
            console.log(chalk.red("❌ Login Fail:"), normalizedEmail, "not found");
            return res.status(404).json({ error: "User not found" });
        }

        // 3. Verify Password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            console.log(chalk.red("❌ Login Fail: Wrong password for"), normalizedEmail);
            return res.status(401).json({ error: "Invalid password" });
        }

        // 4. Generate JWT Securely
        const secret = process.env.JWT_SECRET || "fallback_secret_for_lab_only";
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            secret,
            { expiresIn: "1h" }
        );

        console.log(chalk.green("🔓 Login Success:"), normalizedEmail);
        res.json({ 
            message: "Login successful",
            token,
            role: user.role // Send role so frontend knows where to redirect
        });

    } catch (err) {
        console.error(chalk.red("🔥 Login Crash:"), err.message);
        res.status(500).json({ error: "Internal Server error" });
    }
});

module.exports = router;