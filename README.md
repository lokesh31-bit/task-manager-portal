# 🚀 TaskFlow — Premium Task Management Workspace

A premium, full-stack Task Management Workspace built to satisfy both the core assessment guidelines and the advanced requirements, delivering a production-ready application with rich aesthetics, robust validation, secure JWT authentication, and automated tests.

---

## 🎨 Technology Stack & Design Highlights

- **Frontend:** React.js, Axios, React Router v6.
- **Backend:** Node.js + Express.js.
- **Database:** Unified Database Access Layer supporting **MySQL** and **SQLite** (Auto-fallback).
- **Testing:** Jest & Supertest.
- **Styling:** Custom, hand-crafted **Vanilla CSS Design System** featuring:
  - Default Premium Glassmorphic Dark Theme with a Light Theme toggle.
  - Micro-animations and hover effects on controls, inputs, and task cards.
  - Active character counter validator for task descriptions.
  - Live dashboard KPI counter cards (Total, Pending, In Progress, Completed).

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher.
- **npm:** v9.0.0 or higher.
- **MySQL (Optional):** If you wish to run on a MySQL database. If MySQL is not present, the app automatically runs on a local SQLite file.

### Step 1: Clone or extract the project
Navigate to the root directory `task-manager-portal`.

### Step 2: Run Setup Command
From the root directory, run the workspace setup command. This installs all package dependencies for the root, backend, and frontend directories concurrently:
```bash
npm run setup
```

### Step 3: Configure Environment Variables
By default, the backend will run on SQLite out-of-the-box. If you want to use MySQL, configure the database variables.
Rename the `backend/.env` file or create one with the following values:
```env
PORT=5000
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=task_portal
JWT_SECRET=task_manager_portal_jwt_secret_key_9977
NODE_ENV=development
```
*(Note: Keep `DB_TYPE=sqlite` or leave the defaults to run SQLite immediately without configuration).*

### Step 4: Run the Application
Start both the Express backend API server and the Vite React development server concurrently with a single command from the root folder:
```bash
npm run dev
```
- **React Frontend:** Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Express Backend:** Running on [http://localhost:5000](http://localhost:5000).

---

## 🧪 Running Automated Tests

A comprehensive integration test suite is available for testing the Express REST API, authorization gates, and search/sort/pagination logic.
To run the Jest tests:
```bash
npm test
```
*(This command runs against a temporary database file `database.test.sqlite` which is auto-created and cleaned up after tests execute).*

---

## 📝 Developer Assumptions

1. **Local MySQL Service:** If `DB_TYPE=mysql` is configured, it is assumed that the MySQL service is running locally on port 3306 and that the configured database schema (e.g. `task_portal`) has been created, or root has privileges to create it.
2. **Session Storage:** JWT tokens are stored in the client browser's `localStorage`. In case of a 401 Unauthorized API response, the frontend intercepts the error, flushes credentials, and redirects the user to `/login`.
3. **Task Ownership:** All tasks are bound to the authenticated user ID. Users can only view, create, edit, or delete tasks belonging to their own account.
4. **Description Length:** The constraint "Description minimum 20 characters" is enforced strictly on both the frontend form validation and backend Express validation layer.

---

## 📡 REST API Documentation

All task endpoints require an `Authorization` header in the format `Bearer <JWT_TOKEN>`.

### 1. Authentication Endpoints

#### `POST /api/auth/register`
- **Description:** Registers a new user.
- **Request Body:**
  ```json
  {
    "username": "candidate123",
    "password": "securepassword"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "User registered successfully.",
    "userId": 1
  }
  ```

#### `POST /api/auth/login`
- **Description:** Validates credentials and returns a JWT token.
- **Request Body:**
  ```json
  {
    "username": "candidate123",
    "password": "securepassword"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Login successful.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "candidate123"
    }
  }
  ```

#### `GET /api/auth/me` *(Authenticated)*
- **Description:** Returns profile info of the currently logged-in user.

---

### 2. Task Management Endpoints *(All Authenticated)*

#### `GET /api/tasks`
- **Description:** Returns the paginated list of tasks for the logged-in user.
- **Query Parameters (Optional):**
  - `search` (string): Text filter matching title or description.
  - `status` (string): Filter by task status (`Pending`, `In Progress`, `Completed`).
  - `sort` (string): Sorting order of `created_at` (`DESC` or `ASC`). Defaults to `DESC`.
  - `page` (number): Page number (defaults to `1`).
  - `limit` (number): Number of items per page (defaults to `10`).
- **Response (200 OK):**
  ```json
  {
    "tasks": [
      {
        "id": 5,
        "user_id": 1,
        "title": "Build Login Page",
        "description": "Create a responsive login page with form validation.",
        "status": "Pending",
        "created_at": "2026-06-19T17:15:30.000Z"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
  ```

#### `GET /api/tasks/stats`
- **Description:** Retrieves metrics for the user's dashboard KPI cards.
- **Response (200 OK):**
  ```json
  {
    "total": 5,
    "pending": 2,
    "inProgress": 2,
    "completed": 1
  }
  ```

#### `POST /api/tasks`
- **Description:** Creates a task for the logged-in user.
- **Request Body:**
  ```json
  {
    "title": "Integrate REST APIs",
    "description": "Connect React frontend components with Axios to Express API endpoints.",
    "status": "In Progress"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Task created successfully.",
    "task": {
      "id": 6,
      "user_id": 1,
      "title": "Integrate REST APIs",
      "description": "Connect React frontend components with Axios to Express API endpoints.",
      "status": "In Progress",
      "created_at": "2026-06-19T17:18:22.000Z"
    }
  }
  ```

#### `PUT /api/tasks/:id`
- **Description:** Updates the status or details of a task.
- **Request Body (Optional fields):**
  ```json
  {
    "status": "Completed"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Task updated successfully.",
    "task": {
      "id": 6,
      "status": "Completed",
      "title": "Integrate REST APIs",
      "description": "Connect React frontend components with Axios to Express API endpoints."
    }
  }
  ```

#### `DELETE /api/tasks/:id`
- **Description:** Deletes a task.
- **Response (200 OK):**
  ```json
  {
    "message": "Task deleted successfully."
  }
  ```
