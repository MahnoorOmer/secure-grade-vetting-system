
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const chalk = require("chalk");
const https = require('https');
const fs = require('fs');
const rateLimit = require("express-rate-limit");

// Import Routes
const authRoutes = require("./routes/auth");
const gradeRoutes = require("./routes/grades");

const app = express();

// ==========================================
// 1. SECURITY & LOGGING MIDDLEWARE
// ==========================================

// Standard Logging (Morgan)
app.use(morgan("dev"));

// 🛡️ Helmet: Security Headers with CSP for Frontend
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"], 
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);

// 🛡️ Rate Limiting: Prevent Brute Force on Auth Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: { error: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter specifically to auth
app.use("/auth", authLimiter);

// CORS & Body Parsing

app.use(express.json({ limit: "10kb" })); // Security: Limit body size to prevent DoS

// ✅ Catch invalid JSON errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ Invalid JSON received:", err.message);
    return res.status(400).json({ error: "Invalid JSON format" });
  }
  next();
});
// ==========================================
// 2. STATIC FILES & ROUTES
// ==========================================

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Route Mounts
app.use("/auth", authRoutes);
app.use("/grades", gradeRoutes);

// Root Redirect
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ==========================================
// 3. PROFESSIONAL ERROR HANDLING
// ==========================================

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// 🛡️ Global Error Handler (Prevents sensitive stack traces from leaking)
app.use((err, req, res, next) => {
  console.error(chalk.red("🔥 SERVER ERROR:"), err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" 
      ? "An internal error occurred" 
      : err.message
  });
});

// ==========================================
// 4. SERVER STARTUP
// ==========================================
const PORT = process.env.PORT || 5000;

// 🔒 Load SSL Certificates
let sslOptions;
try {
    sslOptions = {
        key: fs.readFileSync(path.join(__dirname, 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
    };
} catch (err) {
    console.error(chalk.red.bold("❌ SSL Certificate Error: Could not find key.pem or cert.pem"));
    process.exit(1); // Exit if security certificates are missing
}

// 🛡️ Create HTTPS Server
https.createServer(sslOptions, app).listen(PORT, () => {
  console.clear();
  const boxLine = chalk.blue.bold("========================================");
  console.log(boxLine);
  console.log(chalk.green.bold("   ✅ SECURE HTTPS SERVER IS ACTIVE"));
  console.log(boxLine);
  console.log(`${chalk.white("PORT:")}    ${chalk.cyan(PORT)}`);
  console.log(`${chalk.white("PROTO:")}   ${chalk.yellow("HTTPS/TLS 1.3")}`);
  console.log(`${chalk.white("URL:")}     ${chalk.cyan.underline(`https://localhost:${PORT}`)}`);
  console.log(boxLine);
  console.log(chalk.gray("\nActivity Stream:"));
});