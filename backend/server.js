// const express = require("express");
// const cors = require("cors");

// const authRoutes = require("./routes/auth");
// const gradeRoutes = require("./routes/grades");

// const app = express();

// app.use(cors());
// app.use(express.json());

// // sanity check routes
// app.get("/", (req, res) => {
//   res.send("API running");
// });

// // 👇 IMPORTANT: test logs
// console.log("authRoutes:", authRoutes);
// console.log("gradeRoutes:", gradeRoutes);

// // mount routes
// app.use("/auth", authRoutes);
// app.use("/grades", gradeRoutes);

// app.listen(5000, () => {
//   console.log("Server running on http://localhost:5000");
// });





// const express = require("express");
// const cors = require("cors");
// const path = require("path"); // 1. Import path module

// const authRoutes = require("./routes/auth");
// const gradeRoutes = require("./routes/grades");

// const app = express();

// app.use(cors());
// app.use(express.json());

// // 2. Serve static files from the 'frontend' directory
// // This allows the browser to find your CSS, images, and JS files
// app.use(express.static(path.join(__dirname, "../frontend")));

// // 3. Update the root route to serve index.html
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/index.html"));
// });

// // mount routes
// app.use("/auth", authRoutes);
// app.use("/grades", gradeRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// const helmet = require("helmet"); // ✅ added

// const authRoutes = require("./routes/auth");
// const gradeRoutes = require("./routes/grades");

// const app = express();

// // ✅ security middleware FIRST
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'", "'unsafe-inline'"],
//         scriptSrcAttr: ["'unsafe-inline'"],
//       },
//     },
//   })
// );

// // middleware
// app.use(cors());
// app.use(express.json());

// // serve frontend
// app.use(express.static(path.join(__dirname, "../frontend")));

// // root route
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/index.html"));
// });

// // routes
// app.use("/auth", authRoutes);
// app.use("/grades", gradeRoutes);

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });







const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan"); 
const chalk = require("chalk"); // Cleaned up the typo here

const authRoutes = require("./routes/auth");
const gradeRoutes = require("./routes/grades");

const app = express();

// 1. Manual Debug Logger (Temporary)
app.use((req, res, next) => {
  console.log(chalk.yellow(`DEBUG: ${req.method} request to ${req.url}`));
  next();
});

// 2. Standard Logging
app.use(morgan("dev")); 

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
      },
    },
  })
);

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "../frontend")));

// 3. Mount Routes
app.use("/auth", authRoutes);
app.use("/grades", gradeRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.clear();
  console.log(chalk.blue.bold("========================================"));
  console.log(chalk.green.bold("   ✅ SECURE API SERVER IS ACTIVE"));
  console.log(chalk.blue.bold("========================================"));
  console.log(`${chalk.white("URL:   ")}  ${chalk.cyan.underline(`http://localhost:${PORT}`)}`);
  console.log(chalk.blue.bold("========================================"));
  console.log(chalk.gray("\nActivity Stream:"));
});