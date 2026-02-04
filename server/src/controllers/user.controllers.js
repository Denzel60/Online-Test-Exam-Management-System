import bcrypt from "bcrypt";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // 2️⃣ Validate role
    const allowedRoles = ["student", "teacher"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be student or teacher"
      });
    }

    // 3️⃣ Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: "User with this email already exists"
      });
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create user
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      });

    // 6️⃣ Response
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

const loginUser = (req, res) => {
  res.send('User route');
};

const updateUser = (req, res) => {
  res.send(`Update user with id ${req.params.id}`);
}

const deleteUser = (req, res) => {
  res.send(`Delete user with id ${req.params.id}`);
}

export { loginUser, createUser, updateUser, deleteUser };