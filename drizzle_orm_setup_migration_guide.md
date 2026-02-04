# Drizzle ORM Setup & Migration Guide (PostgreSQL + Node.js)

This guide explains how to install **Drizzle ORM**, configure it with **PostgreSQL**, and run **database migrations** in a Node.js + Express project using **ES Modules (import/export)**.

This setup is a lightweight, Prisma-free alternative that avoids binary/WASM issues (especially on Windows).

---

## 🧱 Prerequisites

Before you start, make sure you have:

- **Node.js v18+**
- **PostgreSQL** running locally or remotely
- A Node.js project using **ES Modules**

Your `package.json` must include:

```json
{
  "type": "module"
}
```

---

## 📦 1. Install Drizzle & Dependencies

From your project root (usually `server/`):

```bash
npm install drizzle-orm pg dotenv
npm install -D drizzle-kit
```

---

## 🔐 2. Environment Variables

Create a `.env` file in your project root:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/your_database
```

Load environment variables once in your app entry file:

```js
import "dotenv/config";
```

---

## 🔌 3. Create Database Connection

Create the database connection using `pg` and Drizzle.

### `src/db/index.js`

```js
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const db = drizzle(pool, { schema });
```

This replaces the Prisma Client.

---

## 🗂️ 4. Define Database Schema

Drizzle is **code-first**. Tables are defined in JavaScript.

### `src/db/schema.js`

```js
import {
  pgTable,
  serial,
  text,
  timestamp
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
```

This file replaces `schema.prisma`.

---

## ⚙️ 5. Drizzle Migration Configuration

Create the Drizzle config file in the project root.

### `drizzle.config.js`

```js
import "dotenv/config";

export default {
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
};
```

### ⚠️ Important Notes

- `dialect` is **required** (postgresql, mysql, sqlite, etc.)
- Do **NOT** use `driver: "pg"` (deprecated)
- Use `dbCredentials.url`, not `connectionString`

---

## 🧪 6. Generate & Run Migrations

### Generate migration files

```bash
npx drizzle-kit generate
```

### Apply migrations to the database

```bash
npx drizzle-kit migrate
```

This will:
- Create a `drizzle/` folder
- Generate SQL migration files
- Create tables in your database

Equivalent to:

```bash
prisma migrate dev
```

---

## 📁 Recommended Folder Structure

```text
src/
 ├── db/
 │   ├── index.js
 │   └── schema.js
 ├── controllers/
 ├── routes/
 ├── app.js
 └── server.js

drizzle/
 ├── 0000_initial.sql

drizzle.config.js
.env
```

---

## 🧠 Prisma → Drizzle Comparison

| Prisma | Drizzle |
|------|--------|
| schema.prisma | schema.js |
| prisma.user.create | db.insert(users) |
| prisma generate | ❌ Not needed |
| migrate dev | drizzle-kit migrate |
| Binary engine | ❌ None |

---

## ✅ Why Use Drizzle

- No binary/WASM issues
- Works perfectly on Windows
- Faster startup than Prisma
- SQL-like, predictable queries
- Full TypeScript support (optional)

---

## 🚀 Next Steps

You can now:

- Build queries using `db.se