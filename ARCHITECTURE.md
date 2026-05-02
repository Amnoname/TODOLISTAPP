# Architecture & Technical Documentation

## System Architecture

The To-Do List Application follows a modern client-server architecture with separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│                                                               │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │  Pages/Routes  │  │  Components │  │   State Store    │ │
│  │  - Login       │  │  - TaskForm │  │   (Zustand)      │ │
│  │  - Dashboard   │  │  - TaskList │  │                  │ │
│  │  - Tasks       │  │  - Category │  │  - Auth state    │ │
│  │                │  │    Form     │  │  - Tasks state   │ │
│  └────────────────┘  └─────────────┘  └──────────────────┘ │
│                           │                                   │
│                    ┌──────▼──────┐                            │
│                    │  API Layer  │                            │
│                    │  (axios)    │                            │
│                    └──────┬──────┘                            │
└─────────────────────────────┼───────────────────────────────┘
                              │ HTTP/JSON
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                Backend (Express.js)                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes & Handlers                   │  │
│  │  ┌──────────────┐  ┌──────────┐  ┌──────────────┐  │  │
│  │  │ Auth Routes  │  │ Task     │  │ Analytics    │  │  │
│  │  │ - Register   │  │ Routes   │  │ Routes       │  │  │
│  │  │ - Login      │  │ - CRUD   │  │ - Dashboard  │  │  │
│  │  └──────────────┘  └──────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Middleware & Utilities                          │  │
│  │  - Authentication (JWT)                              │  │
│  │  - Password Hashing (bcryptjs)                       │  │
│  │  - CORS                                              │  │
│  │  - Body Parser                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│              Database (SQLite)                               │
│                                                               │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Users   │  │  Tasks     │  │Categories│  │  Tags    │  │
│  │          │  │            │  │          │  │          │  │
│  │ - id     │  │ - id       │  │ - id     │  │ - id     │  │
│  │ - name   │  │ - user_id  │  │ - name   │  │ - task_id│  │
│  │ - email  │  │ - title    │  │ - color  │  │ - name   │  │
│  │ - pass   │  │ - status   │  │          │  │          │  │
│  │          │  │ - priority │  │          │  │          │  │
│  │          │  │ - due_date │  │          │  │          │  │
│  └──────────┘  └────────────┘  └──────────┘  └──────────┘  │
│                                                               │
│  ┌───────────────────┐  ┌─────────────────────────────────┐ │
│  │ Task_Assignments  │  │ Relationships (Foreign Keys)    │ │
│  │                   │  │ - Tasks → Users                 │ │
│  │ - id              │  │ - Tasks → Categories            │ │
│  │ - task_id         │  │ - Tags → Tasks                  │ │
│  │ - assigned_user   │  │ - Assignments → Tasks           │ │
│  │ - assigned_by     │  │ - Assignments → Users           │ │
│  └───────────────────┘  └─────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Registration/Login Flow

```
User Input (Registration Form)
    │
    ▼
React Component (Register.jsx)
    │
    ▼
Zustand Store (register action)
    │
    ▼
API Client (axios POST /auth/register)
    │
    ▼
Express Route Handler
    │
    ├─ Hash Password (bcryptjs)
    │
    ├─ Store in Database
    │
    └─ Generate JWT Token
    │
    ▼
Return token to frontend
    │
    ▼
Store in localStorage
    │
    ▼
Update Zustand state
    │
    ▼
Redirect to Dashboard
```

### 2. Task Creation Flow

```
User Input (Task Form)
    │
    ▼
React Component (TaskForm.jsx)
    │
    ▼
Zustand Store (createTask action)
    │
    ▼
API Client (axios POST /tasks)
    │
    ├─ Include JWT token in header
    │
    ▼
Express Route Handler
    │
    ├─ Authenticate user
    │
    ├─ Insert task in database
    │
    ├─ Insert tags if provided
    │
    └─ Return new task
    │
    ▼
Update Zustand tasks state
    │
    ▼
Refresh Task List UI
```

### 3. Task Filtering Flow

```
User Selects Filter
    │
    ▼
Update filter state (React)
    │
    ▼
Zustand store (fetchTasks with filters)
    │
    ▼
API Client (GET /tasks?filters)
    │
    ▼
Express Route Handler
    │
    ├─ Build SQL query with filters
    │
    ├─ Apply WHERE clauses
    │
    └─ Return filtered tasks
    │
    ▼
Update tasks state
    │
    ▼
UI re-renders with filtered tasks
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  category_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Categories Table
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Tags Table
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL,
  tag_name TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

### Task Assignments Table
```sql
CREATE TABLE task_assignments (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL,
  assigned_user_id INTEGER NOT NULL,
  assigned_by_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (assigned_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_by_id) REFERENCES users(id)
);
```

## State Management

### Zustand Store Structure

```javascript
{
  // Auth State
  user: { id, username } | null
  token: string | null
  isLoggedIn: boolean

  // Tasks State
  tasks: Task[]
  categories: Category[]
  analytics: Analytics | null

  // UI State
  loading: boolean
  error: string | null
  successMessage: string | null

  // Auth Actions
  login()
  register()
  logout()

  // Task Actions
  fetchTasks()
  createTask()
  updateTask()
  deleteTask()

  // Category Actions
  fetchCategories()
  createCategory()
  deleteCategory()

  // Analytics Actions
  fetchAnalytics()

  // UI Actions
  clearMessages()
}
```

## Authentication Flow

1. **Registration**
   - User provides username, email, password
   - Backend hashes password with bcryptjs
   - User stored in database
   - JWT token generated and returned

2. **Login**
   - User provides email and password
   - Backend verifies password
   - JWT token generated if valid
   - Token stored in localStorage

3. **Protected Requests**
   - Token included in Authorization header
   - Express middleware verifies token
   - User ID extracted from token
   - Request processed for that user

4. **Token Storage**
   - Stored in browser localStorage
   - Automatically included in API requests
   - Expires after 7 days

## Security Considerations

1. **Password Security**
   - Passwords hashed with bcryptjs (10 rounds)
   - Never stored in plaintext
   - Never transmitted except during login

2. **JWT Tokens**
   - Signed with secret key
   - Includes expiration (7 days)
   - Verified on each protected request
   - Should use HTTPS in production

3. **Input Validation**
   - Email format validation
   - Required fields checked
   - SQL queries use parameterized queries

4. **CORS**
   - CORS enabled for development
   - Should be restricted in production
   - Only allow trusted origins

## Performance Considerations

1. **Database Queries**
   - Tasks filtered with WHERE clauses
   - Proper indexes on frequently queried columns
   - Eager loading avoided (normalized queries)

2. **Frontend Optimization**
   - Zustand for efficient state updates
   - React memoization where needed
   - Vite for fast development and small bundles

3. **Caching**
   - Current implementation fetches fresh data
   - Consider caching for read-heavy operations

## Scalability Considerations

For production deployment:

1. **Database**
   - Migrate from SQLite to PostgreSQL
   - Add connection pooling
   - Implement database migrations

2. **Backend**
   - Add environment-based configuration
   - Implement rate limiting
   - Add logging and monitoring
   - Use clustering for multiple cores

3. **Frontend**
   - Implement code splitting
   - Add lazy loading for routes
   - Optimize bundle size

4. **Infrastructure**
   - Use CDN for static assets
   - Implement horizontal scaling
   - Add load balancing
   - Use reverse proxy (nginx)

## Development Workflow

```
Local Development
├─ Frontend: npm run dev (port 3000)
├─ Backend: npm run dev (port 5000)
├─ Database: SQLite (local file)
└─ Hot reload enabled

Production Build
├─ Frontend: npm run build → dist/
├─ Backend: npm start
├─ Database: PostgreSQL (external)
└─ Environment variables configured
```

## File Organization

### Frontend
```
src/
├── App.jsx              - Main app component with routing
├── main.jsx             - React entry point
├── index.css            - Global styles
├── api.js               - API client and endpoints
├── store.js             - Zustand state management
├── pages/               - Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   └── Tasks.jsx
└── components/          - Reusable components
    ├── TaskForm.jsx
    ├── TaskList.jsx
    └── CategoryForm.jsx
```

### Backend
```
backend/
├── server.js            - Main Express server
├── package.json         - Dependencies
└── todolist.db          - SQLite database (created at runtime)
```

## Future Improvements

1. **Real-time Updates**
   - WebSocket integration for live updates
   - Real-time collaboration

2. **Advanced Analytics**
   - Charts and graphs
   - Time tracking
   - Productivity insights

3. **Mobile App**
   - React Native implementation
   - Offline support

4. **API Enhancements**
   - GraphQL support
   - Advanced search (Elasticsearch)
   - Webhook support

5. **User Features**
   - Task templates
   - Recurring tasks
   - Notifications/reminders
   - File attachments
   - Comments and activity logs
   - Team collaboration
