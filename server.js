const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const gradeRoutes = require("./routes/grades");

const app = express();

app.use(cors());
app.use(express.json());

// sanity check routes
app.get("/", (req, res) => {
  res.send("API running");
});

// 👇 IMPORTANT: test logs
console.log("authRoutes:", authRoutes);
console.log("gradeRoutes:", gradeRoutes);

// mount routes
app.use("/auth", authRoutes);
app.use("/grades", gradeRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});