<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Online Test & Exam Management System — API](#online-test--exam-management-system--api)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Environment Variables](#environment-variables)
  - [API Endpoints](#api-endpoints)
    - [🔐 Auth (Public)](#-auth-public)
      - [Register](#register)
      - [Login](#login)
    - [👤 Self-Service (Authenticated Users)](#-self-service-authenticated-users)
      - [Update Profile](#update-profile)
    - [🛡️ Admin Only](#-admin-only)
      - [Get All Users — Query Params](#get-all-users--query-params)
      - [Update Role](#update-role)
  - [Roles](#roles)
  - [Authentication Flow](#authentication-flow)
    - [Using Postman](#using-postman)
  - [Validation Schemas (Zod)](#validation-schemas-zod)
  - [Security Notes](#security-notes)
  - [Error Responses](#error-responses)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Online Test & Exam Management System — API

A RESTful API built with **Node.js**, **Express**, **Drizzle ORM**, and **PostgreSQL**, featuring JWT-based authentication and role-based access control.

---

## Tech Stack

- **Runtime:** Node.js v20 (ESM)
- **Framework:** Express.js
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **Auth:** JSON Web Tokens (JWT) — access + refresh tokens
- **Validation:** Zod
- **Password Hashing:** bcrypt

---

## Project Structure

```
src/
├── controllers/
│   └── user.controllers.js       # All user & auth logic
├── db/
│   ├── index.js                  # Drizzle DB instance
│   |── schema.js                 # Users table schema
|   └── seed.js                   # Create superuser
├── middlewares/
│   ├── auth.middlewares.js       # JWT authenticate middleware
│   ├── roles.middlewares.js      # studentOnly, teacherOnly, adminOnly
│   └── validators/
│       └── auth.validator.js     # Zod schemas
├── routes/
│   └── user.routes.js            # All user routes
└── utils/
    └── jwt.js                    # generateAccessToken, generateRefreshToken
```

---

## Environment Variables

Create a `.env` file in the root of your project:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/yourdb
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=3000
```

---

## API Endpoints

### 🔐 Auth (Public)

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| POST   | `/users/register` | Register a new user (role defaults to `student`) |
| POST   | `/users/login`    | Login and receive access + refresh tokens |

#### Register
```json
// POST /users/register
// Body
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}

// Response 201
{
  "message": "User created successfully",
  "user": { "id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "student", "createdAt": "..." }
}
```

#### Login
```json
// POST /users/login
// Body
{
  "email": "jane@example.com",
  "password": "password123"
}

// Response 200
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": { "id": 1, "email": "jane@example.com", "role": "student" }
}
```

---

### 👤 Self-Service (Authenticated Users)

All routes require `Authorization: Bearer <accessToken>` header.

| Method | Endpoint   | Description                        |
|--------|------------|------------------------------------|
| GET    | `/users/me` | Get own profile                   |
| PATCH  | `/users/me` | Update own name and/or password   |

#### Update Profile
```json
// PATCH /users/me
// Body (at least one field required)
{
  "name": "Jane Smith",
  "password": "newpassword123"
}

// Response 200
{
  "message": "Profile updated",
  "user": { "id": 1, "name": "Jane Smith", "email": "jane@example.com", "role": "student" }
}
```

---

### 🛡️ Admin Only

All routes require `Authorization: Bearer <accessToken>` and the authenticated user must have role `admin`.

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/users`              | Get all users (paginated)          |
| GET    | `/users/:id`          | Get a single user by ID            |
| PATCH  | `/users/:id/role`     | Update a user's role               |
| DELETE | `/users/:id`          | Delete a user                      |

#### Get All Users — Query Params

| Param    | Type   | Default     | Description                          |
|----------|--------|-------------|--------------------------------------|
| `page`   | number | `1`         | Page number                          |
| `limit`  | number | `20`        | Results per page (max 100)           |
| `search` | string | —           | Search by name or email              |
| `role`   | string | —           | Filter by `student`, `teacher`, `admin` |
| `sortBy` | string | `createdAt` | Sort field: `name`, `email`, `role`, `createdAt` |
| `order`  | string | `desc`      | `asc` or `desc`                      |

```json
// GET /users?page=1&limit=10&search=jane&role=student
// Response 200
{
  "users": [...],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

#### Update Role
```json
// PATCH /users/2/role
// Body
{ "role": "teacher" }

// Response 200
{ "message": "Role updated successfully", "user": { "id": 2, "email": "...", "role": "teacher" } }
```

---

## Roles

| Role      | Permissions                                     |
|-----------|-------------------------------------------------|
| `student` | Access own profile, update own name/password    |
| `teacher` | Same as student (extend via `teacherOnly` middleware) |
| `admin`   | Full access — manage all users, assign roles, delete accounts |

> **Note:** All new registrations are assigned `student` by default. Only an admin can promote users to `teacher` or `admin`.

---

## Authentication Flow

```
1. POST /users/register  →  create account
2. POST /users/login     →  receive { accessToken, refreshToken }
3. Add header to requests:
   Authorization: Bearer <accessToken>
```

### Using Postman

To avoid pasting tokens manually on every request:

1. Send `POST /users/login`
2. In the **Scripts** tab of the login request, add:
   ```js
   const res = pm.response.json();
   pm.collectionVariables.set("accessToken", res.accessToken);
   ```
3. On protected requests, set **Authorization → Bearer Token** to `{{accessToken}}`

---

## Validation Schemas (Zod)

Located in `src/middlewares/validators/auth.validator.js`:

```js
// Register
createUserSchema: { name, email, password }

// Login
loginSchema: { email, password }

// Update role (admin)
updateRoleSchema: { role: enum["student", "teacher", "admin"] }

// Update profile (self)
updateProfileSchema: { name?, password? }  // at least one required
```

---

## Security Notes

- Passwords are hashed with **bcrypt** (10 salt rounds) — never stored in plain text
- JWTs are verified using `JWT_ACCESS_SECRET` from environment variables — never hardcoded
- Admins **cannot demote or delete themselves**
- The `password` field is never returned in any API response
- All ID parameters are validated and cast to numbers — invalid IDs return `400`

---

## Error Responses

| Status | Meaning                                  |
|--------|------------------------------------------|
| 400    | Validation error or bad request          |
| 401    | Missing, expired, or invalid token       |
| 403    | Forbidden — insufficient permissions     |
| 404    | Resource not found                       |
| 409    | Conflict — e.g. email already in use     |
| 500    | Internal server error                    |