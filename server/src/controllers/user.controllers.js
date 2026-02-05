import bcrypt from "bcrypt";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { loginSchema } from "../middlewares/validators/auth.validator.js";
import {
  generateAccessToken,
  generateRefreshToken
} from "../utils/jwt.js";

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2️⃣ Create user
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role: "student" // ✅ enforced here
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      });

    // 3️⃣ Response
    return res.status(201).json({
      message: "User created successfully",
      user
    });

  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const loginUser = async (req, res) => {
  try {
    // 1️⃣ Validate request body
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error().fieldErrors
      });
    }

    const { email, password } = parsed.data;

    // 2️⃣ Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3️⃣ Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4️⃣ Tokens
    const payload = { userId: user.id, role: user.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // (Optional but recommended) Store refresh token in DB
    // await saveRefreshToken(user.id, refreshToken);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// controllers/users.controller.js
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const allowedRoles = ["student", "teacher", "admin"];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const [user] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      role: users.role
    });

  res.json({
    message: "Role updated",
    user
  });
};

const deleteUser = (req, res) => {
  res.send(`Delete user with id ${req.params.id}`);
}

export { loginUser, createUser, updateUserRole, deleteUser };