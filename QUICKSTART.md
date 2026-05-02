# Quick Start Guide

Get the To-Do List Application running in minutes!

## 📦 Prerequisites

Make sure you have the following installed:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (usually comes with Node.js)

Verify installation:
```bash
node --version
npm --version
```

## 🚀 Quick Start

### 1. Backend Setup (Terminal 1)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

You should see: `Server running on http://localhost:5000`

### 2. Frontend Setup (Terminal 2)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

You should see: `VITE v4.x.x  ready in xxx ms`

### 3. Access the Application

Open your browser and go to: **http://localhost:3000**

## 📝 First Steps

1. **Register** a new account
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`

2. **Login** with your credentials

3. **Create a Task**
   - Click "+ Add Task"
   - Enter a title like "Complete project"
   - Set priority, due date, and category
   - Click "Create Task"

4. **View Dashboard**
   - Click "Dashboard" in the sidebar
   - See your task statistics

5. **Manage Tasks**
   - Change task status using the dropdown
   - Delete tasks with the delete button
   - Search and filter using the search bar

## 🛠️ Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

**Frontend (change port 3000):**
```bash
npm run dev -- --port 3001
```

**Backend (change port 5000):**
Edit `server.js` and change `PORT` or use:
```bash
PORT=5001 npm start
```

### Database Issues

If you have database errors:

1. Delete `backend/todolist.db` file
2. Restart the backend server
3. It will create a new database automatically

### Dependencies Not Installing

Try clearing npm cache:
```bash
npm cache clean --force
npm install
```

## 📚 Additional Commands

**Backend:**
```bash
npm start          # Start server (production mode)
npm run dev        # Start with auto-reload (requires nodemon)
```

**Frontend:**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## 🎨 Customization

### Change Port Numbers

**Frontend:** Edit `frontend/vite.config.js`
```javascript
server: {
  port: 3001,  // Change this
}
```

**Backend:** Edit `backend/server.js`
```javascript
const PORT = process.env.PORT || 5001;  // Change this
```

### Change JWT Secret

**Backend:** Create `backend/.env` file
```
JWT_SECRET=your_custom_secret_key
```

## 📱 Features to Explore

- ✅ Create and manage tasks
- 📂 Organize with categories
- 🏷️ Add tags to tasks
- 📊 View analytics dashboard
- 🔍 Search and filter tasks
- ⏰ Set due dates and priorities
- 👤 User authentication

## 🐛 Need Help?

Check the main [README.md](../README.md) for:
- Full feature documentation
- API endpoint details
- Database schema
- Tech stack information

## ✨ That's It!

You now have a fully functional To-Do List application. Happy task managing! 🎉
