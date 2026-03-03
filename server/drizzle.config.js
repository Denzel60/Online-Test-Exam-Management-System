// import "dotenv/config";
// import { defineConfig } from 'drizzle-kit';

// export default defineConfig({
//   schema: "./src/db/schema.js",
//   out: "./drizzle",

//   // ✅ REQUIRED
//   dialect: "postgresql",

//   // ✅ REQUIRED
//   dbCredentials: {
//     url: process.env.DATABASE_URL,
//   }
// });


import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.js",
  out: "./drizzle",

  // ✅ Must be exactly "pg" for Drizzle Kit v0.20.14
  driver: "pg",

  // ✅ Connection string
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
});
