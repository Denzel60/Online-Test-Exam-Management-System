import bcrypt from "bcrypt";
import { db } from "./index.js";
import { users } from "./schema.js";

const hashedPassword = await bcrypt.hash("yourpassword", 10);

await db.insert(users).values({
  name: "Super Admin",
  email: "admin@yourdomain.com",
  password: hashedPassword,
  role: "admin",
});

console.log("Admin created");
process.exit(0);