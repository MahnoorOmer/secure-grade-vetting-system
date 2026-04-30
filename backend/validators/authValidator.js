const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // ✅ Added "Student" to the enum to match your frontend data
  role: z.enum(["Instructor", "HoD", "Admin", "Student"]) 
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

module.exports = { registerSchema, loginSchema };