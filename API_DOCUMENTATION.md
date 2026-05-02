# API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User

Creates a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "string (required)",
  "email": "string (required, unique)",
  "password": "string (required, min 6 chars)"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "userId": 1
}
```

**Error Response (400):**
```json
{
  "error": "User already exists"
}
```

---

### Login User

Authenticates a user and returns a JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "userId": 1,
  "username": "john_doe"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

---

## Task Endpoints

### Get All Tasks

Retrieves all tasks for the authenticated user with optional filters.

**Endpoint:** `GET /tasks`

**Query Parameters:**
- `category_id` (optional, integer) - Filter by category
- `status` (optional, string) - Filter by status: `pending`, `in_progress`, `completed`
- `search` (optional, string) - Search in title and description

**Example:**
```
GET /tasks?status=pending&search=urgent
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "category_id": 2,
    "title": "Complete project",
    "description": "Finish the React component",
    "status": "in_progress",
    "priority": "high",
    "due_date": "2024-12-31T17:00:00",
    "created_at": "2024-05-01T10:00:00",
    "updated_at": "2024-05-01T10:00:00"
  }
]
```

---

### Get Single Task

Retrieves details of a single task including tags and assignments.

**Endpoint:** `GET /tasks/:id`

**Success Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "category_id": 2,
  "title": "Complete project",
  "description": "Finish the React component",
  "status": "in_progress",
  "priority": "high",
  "due_date": "2024-12-31T17:00:00",
  "created_at": "2024-05-01T10:00:00",
  "updated_at": "2024-05-01T10:00:00",
  "tags": ["urgent", "work"],
  "assignments": [
    {
      "id": 1,
      "username": "john_doe"
    }
  ]
}
```

**Error Response (404):**
```json
{
  "error": "Task not found"
}
```

---

### Create Task

Creates a new task for the authenticated user.

**Endpoint:** `POST /tasks`

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "category_id": "integer (optional)",
  "status": "string (optional, default: pending)",
  "priority": "string (optional, default: medium) - low|medium|high",
  "due_date": "datetime (optional) - ISO 8601 format",
  "tags": ["array of strings (optional)"]
}
```

**Example:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "category_id": 1,
  "priority": "medium",
  "due_date": "2024-12-31T17:00:00",
  "tags": ["shopping", "personal"]
}
```

**Success Response (201):**
```json
{
  "id": 5,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "category_id": 1,
  "status": "pending",
  "priority": "medium",
  "due_date": "2024-12-31T17:00:00",
  "tags": ["shopping", "personal"]
}
```

---

### Update Task

Updates an existing task.

**Endpoint:** `PUT /tasks/:id`

**Request Body:** (all fields optional)
```json
{
  "title": "string",
  "description": "string",
  "category_id": "integer",
  "status": "string - pending|in_progress|completed",
  "priority": "string - low|medium|high",
  "due_date": "datetime",
  "tags": ["array of strings"]
}
```

**Example:**
```json
{
  "status": "completed",
  "priority": "high"
}
```

**Success Response (200):**
```json
{
  "message": "Task updated successfully"
}
```

---

### Delete Task

Deletes a task and all associated tags and assignments.

**Endpoint:** `DELETE /tasks/:id`

**Success Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

**Error Response (500):**
```json
{
  "error": "Error deleting task"
}
```

---

## Category Endpoints

### Get All Categories

Retrieves all categories for the authenticated user.

**Endpoint:** `GET /categories`

**Success Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Work",
    "color": "#3B82F6",
    "created_at": "2024-05-01T10:00:00"
  },
  {
    "id": 2,
    "user_id": 1,
    "name": "Personal",
    "color": "#10B981",
    "created_at": "2024-05-01T10:00:00"
  }
]
```

---

### Create Category

Creates a new category for the authenticated user.

**Endpoint:** `POST /categories`

**Request Body:**
```json
{
  "name": "string (required)",
  "color": "string (optional, hex color code)"
}
```

**Example:**
```json
{
  "name": "Shopping",
  "color": "#F59E0B"
}
```

**Success Response (201):**
```json
{
  "id": 3,
  "name": "Shopping",
  "color": "#F59E0B"
}
```

---

### Delete Category

Deletes a category. Tasks in this category should be reassigned first.

**Endpoint:** `DELETE /categories/:id`

**Success Response (200):**
```json
{
  "message": "Category deleted successfully"
}
```

---

## Analytics Endpoints

### Get Dashboard Analytics

Retrieves task statistics and summaries for the dashboard.

**Endpoint:** `GET /dashboard/analytics`

**Success Response (200):**
```json
{
  "total": 10,
  "pending": 4,
  "inProgress": 3,
  "completed": 2,
  "overdue": 1,
  "byPriority": {
    "high": 2,
    "medium": 5,
    "low": 3
  }
}
```

**Fields:**
- `total` - Total number of tasks
- `pending` - Tasks with status "pending"
- `inProgress` - Tasks with status "in_progress"
- `completed` - Tasks with status "completed"
- `overdue` - Tasks past their due date (excluding completed)
- `byPriority` - Breakdown of tasks by priority level

---

## Task Assignment Endpoints

### Assign User to Task

Assigns another user to a task.

**Endpoint:** `POST /tasks/:id/assign`

**Request Body:**
```json
{
  "assigned_user_id": "integer (required)"
}
```

**Success Response (201):**
```json
{
  "message": "User assigned to task successfully"
}
```

---

### Remove Assignment

Removes a user's assignment from a task.

**Endpoint:** `DELETE /tasks/:id/assign/:userId`

**Success Response (200):**
```json
{
  "message": "Assignment removed successfully"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Invalid token |
| 404 | Not Found - Resource not found |
| 500 | Server Error - Internal server error |

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Token Expiration

JWT tokens expire after 7 days. The user will need to log in again to get a new token.

---

## Rate Limiting

Currently, there is no rate limiting. In production, consider implementing rate limiting to prevent abuse.

---

## Example Usage

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

**Create Task (with token):**
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Buy groceries",
    "priority": "high",
    "tags": ["shopping"]
  }'
```

### Using JavaScript (Axios)

See `frontend/src/api.js` for complete implementation examples.
