// validators/auth.validator.js
import { z } from "zod";


export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher", "admin"])
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const updateRoleSchema = z.object({
  role: z.enum(["student", "teacher", "admin"]),
});

export const updateProfileSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
  })
  .refine((data) => data.name || data.password, {
    message: "At least one field (name or password) must be provided",
  });
