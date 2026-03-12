# ExamFlow — Frontend

# client

<div align="center" style="margin: 30px;">
    <a href="https://refine.dev">
    <img alt="refine logo" src="https://refine.ams3.cdn.digitaloceanspaces.com/readme/refine-readme-banner.png">
    </a>
</div>
<br/>

This [Refine](https://github.com/refinedev/refine) project was generated with [create refine-app](https://github.com/refinedev/refine/tree/master/packages/create-refine-app).

## Getting Started

A React Framework for building internal tools, admin panels, dashboards & B2B apps with unmatched flexibility ✨

Refine's hooks and components simplifies the development process and eliminates the repetitive tasks by providing industry-standard solutions for crucial aspects of a project, including authentication, access control, routing, networking, state management, and i18n.

A modern exam management interface built with **Refine**, **Ant Design**, and **React (Vite)**. Supports three role-based dashboards for Admins, Teachers, and Students.

---

## Tech Stack

| Package | Purpose |
|---|---|
| React 18 + Vite | Core framework and build tool |
| Refine v4 | Admin framework (data, auth, routing) |
| Ant Design v5 | UI component library |
| React Router v6 | Client-side routing |
| Axios | HTTP requests to the backend API |
| Recharts | Charts and data visualizations |
| Day.js | Date formatting |
| JWT Decode | Reading JWT token payload |

---

## Prerequisites

Make sure you have the following installed before proceeding:

- **Node.js** v18 or higher → https://nodejs.org
- **npm** v9 or higher (comes with Node.js)
- The **backend server** must be running on `http://localhost:3000`

To verify your Node version:
```bash
node -v
npm -v
```

---

## Project Structure

```
client/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   └── axiosInstance.ts        # Axios instance with auth token interceptor
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx           # Login page
│   │   │   └── Register.jsx        # Register page
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx       # Admin overview
│   │   │   ├── UserList.jsx        # Manage all users
│   │   │   └── AllTests.jsx        # View all tests
│   │   ├── teacher/
│   │   │   ├── Dashboard.jsx       # Teacher overview
│   │   │   ├── MyTests.jsx         # Manage own tests
│   │   │   ├── CreateTest.jsx      # Create a new test
│   │   │   └── TestResults.jsx     # View student results
│   │   └── student/
│   │       ├── Dashboard.jsx       # Student overview
│   │       ├── AvailableTests.jsx  # Browse published tests
│   │       ├── TakeTest.jsx        # Attempt a test
│   │       └── MyResults.jsx       # View own results
│   ├── providers/
│   │   └── authProvider.ts         # Refine auth provider (login, logout, permissions)
│   ├── components/
│   │   ├── StatCard.jsx            # Reusable stat card component
│   │   ├── ProtectedRoute.jsx      # Role-based route guard
│   │   └── Sidebar.jsx             # Sidebar navigation
│   ├── App.tsx                     # Root app with routes and Refine setup
│   ├── main.tsx                    # React DOM entry point
│   └── index.css                   # Global styles
├── index.html                      # HTML entry point with Google Fonts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Installation

### Step 1 — Clone or navigate to the project
```bash
cd Online-Test-Exam-Management-System/client
```

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Install additional required packages
```bash
npm install axios recharts dayjs jwt-decode
npm install @refinedev/simple-rest
npm install @ant-design/icons
```

### Step 4 — Verify all Refine packages are on matching versions

All Refine packages must be on the **same major version** to avoid import errors. Check with:
```bash
npm list @refinedev/core @refinedev/antd @refinedev/react-router-v6
```

If there is a mismatch, reinstall with fixed versions:
```bash
# Delete existing installs
rd /s /q node_modules      # Windows
rm -rf node_modules        # Mac/Linux

del package-lock.json      # Windows
rm package-lock.json       # Mac/Linux

# Reinstall with pinned versions
npm install @refinedev/core@^4.54.0 @refinedev/antd@^5.40.0 @refinedev/react-router-v6@^4.6.0
npm install
```

---

## Environment Configuration

The backend API URL is set directly in `src/api/axiosInstance.ts` and `src/App.tsx`. If your backend runs on a different port, update both files:

```typescript
// src/api/axiosInstance.ts
export const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api", // 👈 change port if needed
});

// src/App.tsx
const API_URL = "http://localhost:3000/api"; // 👈 change port if needed
```

---

## Running the App

### Development mode
```bash
npm run dev
```
The app will be available at:
```
http://localhost:5173
```

### If you hit dependency or cache errors
```bash
npx vite --force
```

### Production build
```bash
npm run build
```

### Preview production build locally
```bash
npm run preview
```

---

## Running Frontend and Backend Together

Open two terminal windows and run each separately:

```bash
# Terminal 1 — Backend (Express)
cd Online-Test-Exam-Management-System/server
npm run dev

# Terminal 2 — Frontend (React + Vite)
cd Online-Test-Exam-Management-System/client
npm run dev
```

| Service | URL |
|---|---|
| Backend API | http://localhost:3000 |
| Frontend App | http://localhost:5173 |

---

## Authentication & Roles

The app has three roles. After login, users are automatically redirected to their role-specific dashboard:

| Role | Redirect | Access |
|---|---|---|
| `admin` | `/admin/dashboard` | Full access — users, all tests, oversight |
| `teacher` | `/teacher/dashboard` | Own tests, question banks, student results |
| `student` | `/student/dashboard` | Available tests, attempts, own results |

Tokens are stored in `localStorage` and automatically attached to every API request via the Axios interceptor. If a token expires or is invalid, the user is redirected to `/login` automatically.

> **Note:** Admin accounts cannot be created through the Register page. They must be created directly in the database or by an existing admin via the API.

---

## Route Protection

All dashboard routes are protected. Accessing a route without a valid token or with the wrong role redirects to `/login`.

| Path | Allowed Role |
|---|---|
| `/admin/*` | `admin` only |
| `/teacher/*` | `teacher` only |
| `/student/*` | `student` only |
| `/login` | Public |
| `/register` | Public |

---

## Common Errors & Fixes

### `No matching export for "useResource"`
Refine package version mismatch. Fix:
```bash
rd /s /q node_modules && del package-lock.json
npm install @refinedev/core@^4.54.0 @refinedev/antd@^5.40.0 @refinedev/react-router-v6@^4.6.0
npm install
npx vite --force
```

### Blank page after login
Check that your backend is running and the `baseURL` in `axiosInstance.ts` matches your server port.

### `401 Unauthorized` on all requests
Your token has expired. Log out and log back in to get a fresh token.

### CORS error in browser console
Add CORS configuration to your Express backend:
```javascript
// server/src/app.js
import cors from "cors";
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
```
Then install the package:
```bash
cd server && npm install cors
```

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |