const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters"),
  role: z.enum(["Instructor", "HoD", "Student"]) 
}).passthrough();

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

module.exports = { registerSchema, loginSchema };