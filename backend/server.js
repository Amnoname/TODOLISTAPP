const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database initialization
const dbPath = path.join(__dirname, 'todolist.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tasks table
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'in_progress',
        priority TEXT DEFAULT 'medium',
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);


    // Task assignments table (for assigning users to tasks)
    db.run(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        assigned_user_id INTEGER NOT NULL,
        assigned_by_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (assigned_user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_by_id) REFERENCES users(id)
      )
    `);

    console.log('Database tables initialized');
  });
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ==== AUTH ROUTES ====

// Register User
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
  }
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
  }
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one number' });
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one special character' });
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'User already exists' });
      }
      const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ message: 'User registered successfully', token, userId: this.lastID, username, email });
    }
  );
});

// Login User
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = bcryptjs.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, userId: user.id, username: user.username, email: user.email });
  });
});

// User profile route
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// ==== CATEGORY ROUTES ====

// Get all categories for a user
app.get('/api/categories', authenticateToken, (req, res) => {
  db.all('SELECT * FROM categories WHERE user_id = ?', [req.user.id], (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching categories' });
    }
    res.json(categories);
  });
});

// Create a category
app.post('/api/categories', authenticateToken, (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  db.run(
    'INSERT INTO categories (user_id, name) VALUES (?, ?)',
    [req.user.id, name],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating category' });
      }
      res.status(201).json({ id: this.lastID, name });
    }
  );
});

// Delete a category
app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM categories WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting category' });
      }
      res.json({ message: 'Category deleted successfully' });
    }
  );
});

// ==== TASK ROUTES ====

// Get all users (required for assignments)
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username FROM users', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching users' });
    }
    res.json(users);
  });
});

// Get tasks — all tasks with can_edit flag, or owned/assigned only when scope=mine
app.get('/api/tasks', authenticateToken, (req, res) => {
  const { category_id, status, search, scope } = req.query;
  const params = [req.user.id, req.user.id];

  let query;
  if (scope === 'mine') {
    query = 'SELECT * FROM tasks WHERE (user_id = ? OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = ?))';
  } else {
    query = 'SELECT *, CASE WHEN user_id = ? OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = ?) THEN 1 ELSE 0 END as can_edit FROM tasks WHERE 1=1';
  }

  if (category_id) {
    query += ' AND category_id = ?';
    params.push(category_id);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY due_date ASC, created_at DESC';

  console.log('[fetchTasks] user id:', req.user.id, '| query:', query, '| params:', params);
  db.all(query, params, (err, tasks) => {
    if (err) {
      console.error('[fetchTasks] SQL error:', err.message);
      return res.status(500).json({ error: 'Error fetching tasks' });
    }
    console.log('[fetchTasks] returned', tasks.length, 'tasks for user', req.user.id);

    if (tasks.length === 0) {
      return res.json([]);
    }

    let completed = 0;
    tasks.forEach((task) => {
      db.all(
        'SELECT u.id, u.username FROM task_assignments ta JOIN users u ON ta.assigned_user_id = u.id WHERE ta.task_id = ?',
        [task.id],
        (err, assignments) => {
          task.assignments = err ? [] : assignments;
          completed += 1;
          if (completed === tasks.length) {
            res.json(tasks);
          }
        }
      );
    });
  });
});

// Get single task with assignments (owner or assignee)
app.get('/api/tasks/:id', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM tasks WHERE id = ? AND (user_id = ? OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = ?))',
    [req.params.id, req.user.id, req.user.id],
    (err, task) => {
      if (err || !task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      db.all(
        'SELECT u.id, u.username FROM task_assignments ta JOIN users u ON ta.assigned_user_id = u.id WHERE ta.task_id = ?',
        [req.params.id],
        (err, assignments) => {
          if (err) assignments = [];
          res.json({ ...task, assignments });
        }
      );
    }
  );
});

// Create a task
app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, category_id, status, priority, due_date, assigned_user_id } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  db.run(
    'INSERT INTO tasks (user_id, category_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, category_id || null, title, description || '', status || 'in_progress', priority || 'medium', due_date || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating task' });
      }

      const taskId = this.lastID;

      // Assign user if provided
      if (assigned_user_id) {
        db.run(
          'INSERT INTO task_assignments (task_id, assigned_user_id, assigned_by_id) VALUES (?, ?, ?)',
          [taskId, assigned_user_id, req.user.id],
          (assignErr) => {
            if (assignErr) {
              return res.status(500).json({ error: 'Task created but failed to assign user' });
            }
            res.status(201).json({
              id: taskId,
              title,
              description,
              category_id,
              status: status || 'in_progress',
              priority,
              due_date,
              assignments: [{ id: assigned_user_id }]
            });
          }
        );
      } else {
        res.status(201).json({
          id: taskId,
          title,
          description,
          category_id,
          status: status || 'in_progress',
          priority,
          due_date,
          assignments: []
        });
      }
    }
  );
});

// Update a task
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { title, description, category_id, status, priority, due_date } = req.body;

  const updates = [];
  const params = [];

  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (category_id !== undefined) {
    updates.push('category_id = ?');
    params.push(category_id);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (priority !== undefined) {
    updates.push('priority = ?');
    params.push(priority);
  }
  if (due_date !== undefined) {
    updates.push('due_date = ?');
    params.push(due_date);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id, req.user.id, req.user.id);

  const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND (user_id = ? OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = ?))`;

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error updating task' });
    }
    res.json({ message: 'Task updated successfully' });
  });
});

// Delete a task
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM task_assignments WHERE task_id = ?',
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error deleting task assignments' });
      }
      db.run(
        'DELETE FROM tasks WHERE id = ? AND (user_id = ? OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = ?))',
        [req.params.id, req.user.id, req.user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error deleting task' });
          }
          res.json({ message: 'Task deleted successfully' });
        }
      );
    }
  );
});

// ==== DASHBOARD/ANALYTICS ROUTES ====

app.get('/api/dashboard/analytics', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM tasks WHERE (user_id = ? OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = ?))',
    [req.user.id, req.user.id],
    (err, tasks) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching analytics' });
      }

      const analytics = {
        total: tasks.length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
        byPriority: {
          high: tasks.filter(t => t.priority === 'high').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          low: tasks.filter(t => t.priority === 'low').length
        }
      };

      res.json(analytics);
    }
  );
});

// ==== ASSIGNMENT ROUTES ====

// Assign a user to a task
app.post('/api/tasks/:id/assign', authenticateToken, (req, res) => {
  const { assigned_user_id } = req.body;

  if (!assigned_user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  db.run(
    'INSERT INTO task_assignments (task_id, assigned_user_id, assigned_by_id) VALUES (?, ?, ?)',
    [req.params.id, assigned_user_id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error assigning user to task' });
      }
      res.status(201).json({ message: 'User assigned to task successfully' });
    }
  );
});

// Remove assignment
app.delete('/api/tasks/:id/assign/:userId', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM task_assignments WHERE task_id = ? AND assigned_user_id = ?',
    [req.params.id, req.params.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error removing assignment' });
      }
      res.json({ message: 'Assignment removed successfully' });
    }
  );
});

// ==== DEBUG (remove after fixing) ====
app.get('/api/debug/assignments', authenticateToken, (req, res) => {
  db.all('SELECT * FROM task_assignments', [], (err, rows) => {
    db.all('SELECT * FROM users', [], (err2, users) => {
      res.json({ currentUserId: req.user.id, assignments: rows, users });
    });
  });
});

// ==== SERVER START ====

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});
