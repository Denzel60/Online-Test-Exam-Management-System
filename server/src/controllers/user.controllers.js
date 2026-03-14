import bcrypt from "bcrypt";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, asc, desc, ilike, or, and, count, inArray } from "drizzle-orm";
import {
  createUserSchema,
  loginSchema,
  updateRoleSchema,
  updateProfileSchema,
} from "../middlewares/validators/auth.validator.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

// ─────────────────────────────────────────────
// 📌 HELPERS
// ─────────────────────────────────────────────

const ALLOWED_ROLES = ["student", "teacher", "admin"];

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

// ─────────────────────────────────────────────
// 🔐 AUTH CONTROLLERS
// ─────────────────────────────────────────────

/**
 * POST /auth/register
 * Public — creates a new user with role "student"
 */
const createUser = async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { name, email, password } = parsed.data;

    // Check for duplicate email
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({ name, email, password: hashedPassword, role: "student" })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /auth/login
 * Public — returns access + refresh tokens
 */
const loginUser = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { email, password } = parsed.data;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("loginUser error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 👤 USER REFRESH TOKEN CONTROLLERS
// ─────────────────────────────────────────────

/**
 * post /refresh
 * Sends refres token — returns the refresh token if valid, else error
 */

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify the refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: decoded.userId,
        role: decoded.role,
      });

      return res.status(200).json({ accessToken });
    });
  } catch (error) {
    console.error("refreshToken error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 👤 USER SELF-SERVICE CONTROLLERS
// ─────────────────────────────────────────────

/**
 * GET /users/me
 * Authenticated — returns the currently logged-in user's profile
 */
const getMe = async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.userId),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /users/me
 * Authenticated — allows users to update their own name or password
 */
const updateMe = async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { name, password } = parsed.data;
    const updates = {};

    if (name) updates.name = name;
    if (password) updates.password = await bcrypt.hash(password, 10);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, req.user.userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    return res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    console.error("updateMe error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 🛡️ ADMIN CONTROLLERS
// ─────────────────────────────────────────────

/**
 * GET /admin/users
 * Admin only — returns paginated, searchable list of all users
 * Query params: page, limit, search, role, sortBy, order
 */

const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim();
    const roleFilter = req.query.role;
    const sortBy = ["name", "email", "createdAt", "role"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const orderFn = req.query.order === "asc" ? asc : desc;

    const conditions = [];
    if (search) {
      conditions.push(
        or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
      );
    }
    if (roleFilter && ALLOWED_ROLES.includes(roleFilter)) {
      conditions.push(eq(users.role, roleFilter));
    }

    const whereClause =
      conditions.length > 1
        ? and(...conditions)
        : conditions.length === 1
        ? conditions[0]
        : undefined;

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(orderFn(users[sortBy]))
      .limit(limit)
      .offset(offset);

    // ✅ Fixed: count() is imported from drizzle-orm, not db.fn.count()
    const [{ total }] = await db
      .select({ total: count(users.id) })
      .from(users)
      .where(whereClause);

    return res.status(200).json({
      users: allUsers,
      meta: {
        total: Number(total),
        page,
        limit,
        totalPages: Math.ceil(Number(total) / limit),
      },
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
/**
 * GET /admin/users/:id
 * Admin only — returns a single user by ID
 */
const getUserById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("getUserById error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /admin/users/:id/role
 * Admin only — updates a user's role
 * Prevents admin from demoting themselves
 */
const updateUserRole = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { role } = parsed.data;

    // Prevent self-demotion
    if (id === req.user.userId && role !== "admin") {
      return res.status(403).json({ message: "Admins cannot demote themselves" });
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      });

    return res.status(200).json({ message: "Role updated successfully", user: updatedUser });
  } catch (error) {
    console.error("updateUserRole error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /admin/users/:id
 * Admin only — hard deletes a user
 * Prevents admin from deleting themselves
 */
const deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Prevent self-deletion
    if (id === req.user.userId) {
      return res.status(403).json({ message: "Admins cannot delete themselves" });
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.delete(users).where(eq(users.id, id));

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteMultipleUsers = async (req, res) => {
  try {
    const { ids } = req.body;

    // Validate that ids is a non-empty array
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid or empty user IDs array" });
    }

    // Parse and validate each ID is a valid number
    const parsedIds = ids.map(Number);
    if (parsedIds.some(isNaN)) {
      return res.status(400).json({ message: "All user IDs must be valid numbers" });
    }

    // Prevent self-deletion
    if (parsedIds.includes(req.user.userId)) {
      return res.status(403).json({ message: "Admins cannot delete themselves" });
    }

    // Check which users actually exist
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, parsedIds));

    if (existing.length === 0) {
      return res.status(404).json({ message: "No users found for the provided IDs" });
    }

    // Perform the delete only on confirmed existing users
    const existingIds = existing.map((u) => u.id);
    await db.delete(users).where(inArray(users.id, existingIds));

    // Report back any IDs that were skipped (not found)
    const notFoundIds = parsedIds.filter((id) => !existingIds.includes(id));
    return res.status(200).json({
      message: `${existingIds.length} user(s) deleted successfully`,
      deleted: existingIds,
      ...(notFoundIds.length > 0 && { notFound: notFoundIds }),
    });
  } catch (error) {
    console.error("deleteMultipleUsers error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export {
  // Auth
  createUser,
  loginUser,
  refreshToken,
  // Self-service
  getMe,
  updateMe,
  // Admin
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  deleteMultipleUsers,
};