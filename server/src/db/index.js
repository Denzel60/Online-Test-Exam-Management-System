import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });


// import { Pool } from "pg";
// import { drizzle } from "drizzle-orm/node-postgres";
// import dotenv from "dotenv";

// dotenv.config();

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: String(process.env.DB_PASSWORD), // ensure string
//   database: process.env.DB_NAME,
//   port: 5432,
// });

// export const db = drizzle(pool);