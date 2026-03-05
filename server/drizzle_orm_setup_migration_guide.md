<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Drizzle ORM Setup \& Migration Guide (PostgreSQL + Node.js)](#drizzle-orm-setup--migration-guide-postgresql--nodejs)
  - [🧱 Prerequisites](#-prerequisites)
  - [📦 1. Install Drizzle \& Dependencies](#-1-install-drizzle--dependencies)
  - [🔐 2. Environment Variables](#-2-environment-variables)
  - [🔌 3. Create Database Connection](#-3-create-database-connection)
    - [`src/db/index.js`](#srcdbindexjs)
  - [🗂️ 4. Define Database Schema](#️-4-define-database-schema)
    - [`src/db/schema.js`](#srcdbschemajs)
  - [⚙️ 5. Drizzle Migration Configuration](#️-5-drizzle-migration-configuration)
    - [`drizzle.config.js`](#drizzleconfigjs)
    - [⚠️ Important Notes](#️-important-notes)
  - [🧪 6. Generate \& Run Migrations](#-6-generate--run-migrations)
    - [Generate migration files](#generate-migration-files)
    - [Push migration files](#push-migration-files)
    - [Apply migrations to the database](#apply-migrations-to-the-database)
  - [📁 Recommended Folder Structure](#-recommended-folder-structure)
  - [🧠 Prisma → Drizzle Comparison](#-prisma--drizzle-comparison)
  - [✅ Why Use Drizzle](#-why-use-drizzle)
  - [🚀 Next Steps](#-next-steps)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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
npm install drizzle-orm@0.29.5 pg dotenv
npm install -D drizzle-kit@0.20.14
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
  driver: "pg",
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
npx drizzle-kit generate:pg
```
### Push migration files

```bash
npx drizzle-kit push:pg
```

### Apply migrations to the database

```bash
npx drizzle-kit migrate:pg
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
 ├── index.js
 └── drizzle.config.js

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