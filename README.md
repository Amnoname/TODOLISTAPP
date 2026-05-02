# To-Do List Application

A full-stack to-do list application with user authentication, task management, categorization, and analytics. Built with React, Node.js/Express, and SQLite.

## Features

✨ **User Management**
- User registration and authentication
- Secure login with JWT tokens
- Personal task lists for each user

📋 **Task Management**
- Create, read, update, and delete tasks
- Set task status (Pending, In Progress, Completed)
- Assign priority levels (Low, Medium, High)
- Set due dates and time schedules
- Add descriptions to tasks

🏷️ **Organization**
- Organize tasks into custom categories
- Tag tasks for better organization
- Assign and tag related users to tasks
- Color-coded categories

🔍 **Search & Filter**
- Search tasks by title or description
- Filter by status
- Filter by category
- Filter by priority

📊 **Dashboard & Analytics**
- View task statistics and summaries
- Track tasks by status (Pending, In Progress, Completed)
- Monitor overdue tasks
- View tasks by priority levels
- Visual dashboard with key metrics

## Project Structure

```
TODOLISTAPP/
├── backend/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── api.js
│       ├── store.js
│       ├── components/
│       │   ├── TaskForm.jsx
│       │   ├── TaskList.jsx
│       │   └── CategoryForm.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx
│           └── Tasks.jsx
└── .gitignore
```

## Tech Stack

**Backend:**
- Node.js with Express.js
- SQLite3 for database
- JWT for authentication
- bcryptjs for password hashing

**Frontend:**
- React 18
- Vite for build tooling
- React Router for navigation
- Zustand for state management
- Axios for API calls

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

**For development with auto-reload:**
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

### Creating a New User

1. Open the application at `http://localhost:3000`
2. Click on "Register here" to create a new account
3. Enter your username, email, and password
4. Click "Register"

### Logging In

1. Enter your email and password on the login page
2. Click "Login"
3. You'll be redirected to the dashboard

### Managing Tasks

**Create a Task:**
1. Click "+ Add Task"
2. Enter task title (required)
3. Add description (optional)
4. Select a category
5. Set priority level
6. Set due date and time
7. Add tags (comma-separated)
8. Click "Create Task"

**Update Task Status:**
1. Click the status dropdown on a task
2. Select new status (Pending, In Progress, Completed)
3. Or check the checkbox to mark as completed

**Delete a Task:**
1. Click "Delete" button on the task
2. Confirm deletion

**Search and Filter:**
1. Use the search box to search by title or description
2. Use status dropdown to filter by status
3. Use category dropdown to filter by category

### Managing Categories

**Create a Category:**
1. Click "+ Add Category"
2. Enter category name
3. Choose a color (optional)
4. Click "Create Category"

**Delete a Category:**
1. Go to Tasks page
2. Delete tasks in the category or change their category
3. The category will be deleted once no tasks use it

### Dashboard

View your task analytics:
- **Total Tasks:** Count of all your tasks
- **Pending:** Tasks waiting to be started
- **In Progress:** Tasks you're currently working on
- **Completed:** Finished tasks
- **Overdue:** Tasks past their due date
- **Tasks by Priority:** Breakdown of high, medium, and low priority tasks

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Tasks
- `GET /api/tasks` - Get all tasks (supports filters)
- `GET /api/tasks/:id` - Get single task details
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a category
- `DELETE /api/categories/:id` - Delete a category

### Analytics
- `GET /api/dashboard/analytics` - Get dashboard statistics

### Task Assignments
- `POST /api/tasks/:id/assign` - Assign user to task
- `DELETE /api/tasks/:id/assign/:userId` - Remove assignment

## Database Schema

The application uses SQLite with the following tables:
- **users** - User account information
- **tasks** - Task details
- **categories** - Task categories
- **tags** - Task tags
- **task_assignments** - User-to-task assignments

## Features Explained

### Task Status
- **Pending** - Task not yet started
- **In Progress** - Task currently being worked on
- **Completed** - Task finished

### Priority Levels
- **Low** - Can be done when time permits
- **Medium** - Should be done soon
- **High** - Urgent, needs immediate attention

### Due Dates
Set task deadlines with specific dates and times. Overdue tasks are highlighted on the dashboard and task list.

### Tags
Use tags to organize tasks by type (e.g., "urgent", "work", "personal"). Multiple tags per task are supported.

### Categories
Organize tasks into categories like "Work", "Personal", "Shopping", etc. Each category can have a custom color.

## Future Enhancements

- [ ] Task collaboration and sharing
- [ ] Recurring tasks
- [ ] Task reminders and notifications
- [ ] Export tasks to CSV/PDF
- [ ] Dark mode
- [ ] Mobile app
- [ ] File attachments for tasks
- [ ] Comments and activity logs
- [ ] Team workspaces

## License

MIT License

## Support

For issues or questions, please create an issue in the project repository.

---

**Happy Task Managing! 📝✨**
