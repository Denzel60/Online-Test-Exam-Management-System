import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const validateUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // 1️⃣ Validate input
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // 2️⃣ Validate role
        const allowedRoles = ["student", "teacher", "admin"];
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

        next();

    } catch (error) {
        console.error("Validation error:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
}

export default validateUser;