require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      category_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'in_progress',
      priority TEXT DEFAULT 'medium',
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_assignments (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL,
      assigned_user_id INTEGER NOT NULL,
      assigned_by_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (assigned_user_id) REFERENCES users(id),
      FOREIGN KEY (assigned_by_id) REFERENCES users(id)
    )
  `);

  console.log('Database tables initialized');
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

app.post('/api/auth/register', async (req, res) => {
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

  try {
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );
    const userId = result.rows[0].id;
    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'User registered successfully', token, userId, username, email });
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = bcryptjs.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, userId: user.id, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Error during login' });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// ==== CATEGORY ROUTES ====

app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING id',
      [req.user.id, name]
    );
    res.status(201).json({ id: result.rows[0].id, name });
  } catch (err) {
    res.status(500).json({ error: 'Error creating category' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting category' });
  }
});

// ==== TASK ROUTES ====

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
  const { category_id, status, search, scope } = req.query;
  const params = [req.user.id, req.user.id];
  let idx = 3;

  let query;
  if (scope === 'mine') {
    query = 'SELECT * FROM tasks WHERE (user_id = $1 OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = $2))';
  } else {
    query = 'SELECT *, CASE WHEN user_id = $1 OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = $2) THEN 1 ELSE 0 END as can_edit FROM tasks WHERE 1=1';
  }

  if (category_id) {
    query += ` AND category_id = $${idx++}`;
    params.push(category_id);
  }
  if (status) {
    query += ` AND status = $${idx++}`;
    params.push(status);
  }
  if (search) {
    query += ` AND (title ILIKE $${idx} OR description ILIKE $${idx + 1})`;
    idx += 2;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY due_date ASC, created_at DESC';

  console.log('[fetchTasks] user id:', req.user.id, '| query:', query, '| params:', params);

  try {
    const result = await pool.query(query, params);
    const tasks = result.rows;
    console.log('[fetchTasks] returned', tasks.length, 'tasks for user', req.user.id);

    if (tasks.length === 0) {
      return res.json([]);
    }

    const tasksWithAssignments = await Promise.all(
      tasks.map(async (task) => {
        const assignResult = await pool.query(
          'SELECT u.id, u.username FROM task_assignments ta JOIN users u ON ta.assigned_user_id = u.id WHERE ta.task_id = $1',
          [task.id]
        );
        return { ...task, assignments: assignResult.rows };
      })
    );

    res.json(tasksWithAssignments);
  } catch (err) {
    console.error('[fetchTasks] SQL error:', err.message);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND (user_id = $2 OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = $3))',
      [req.params.id, req.user.id, req.user.id]
    );
    const task = result.rows[0];
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const assignResult = await pool.query(
      'SELECT u.id, u.username FROM task_assignments ta JOIN users u ON ta.assigned_user_id = u.id WHERE ta.task_id = $1',
      [req.params.id]
    );

    res.json({ ...task, assignments: assignResult.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching task' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description, category_id, status, priority, due_date, assigned_user_id } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tasks (user_id, category_id, title, description, status, priority, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [req.user.id, category_id || null, title, description || '', status || 'in_progress', priority || 'medium', due_date || null]
    );
    const taskId = result.rows[0].id;

    if (assigned_user_id) {
      try {
        await pool.query(
          'INSERT INTO task_assignments (task_id, assigned_user_id, assigned_by_id) VALUES ($1, $2, $3)',
          [taskId, assigned_user_id, req.user.id]
        );
      } catch (assignErr) {
        return res.status(500).json({ error: 'Task created but failed to assign user' });
      }
    }

    res.status(201).json({
      id: taskId,
      title,
      description,
      category_id,
      status: status || 'in_progress',
      priority,
      due_date,
      assignments: assigned_user_id ? [{ id: assigned_user_id }] : []
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creating task' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { title, description, category_id, status, priority, due_date } = req.body;

  const updates = [];
  const params = [];
  let idx = 1;

  if (title !== undefined) { updates.push(`title = $${idx++}`); params.push(title); }
  if (description !== undefined) { updates.push(`description = $${idx++}`); params.push(description); }
  if (category_id !== undefined) { updates.push(`category_id = $${idx++}`); params.push(category_id); }
  if (status !== undefined) { updates.push(`status = $${idx++}`); params.push(status); }
  if (priority !== undefined) { updates.push(`priority = $${idx++}`); params.push(priority); }
  if (due_date !== undefined) { updates.push(`due_date = $${idx++}`); params.push(due_date); }

  updates.push('updated_at = NOW()');
  params.push(req.params.id, req.user.id, req.user.id);

  const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx++} AND (user_id = $${idx++} OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = $${idx++}))`;

  try {
    await pool.query(query, params);
    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating task' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM task_assignments WHERE task_id = $1', [req.params.id]);
    await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting task' });
  }
});

// ==== DASHBOARD/ANALYTICS ROUTES ====

app.get('/api/dashboard/analytics', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE (user_id = $1 OR id IN (SELECT task_id FROM task_assignments WHERE assigned_user_id = $2))',
      [req.user.id, req.user.id]
    );
    const tasks = result.rows;

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
  } catch (err) {
    res.status(500).json({ error: 'Error fetching analytics' });
  }
});

// ==== ASSIGNMENT ROUTES ====

app.post('/api/tasks/:id/assign', authenticateToken, async (req, res) => {
  const { assigned_user_id } = req.body;

  if (!assigned_user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    await pool.query(
      'INSERT INTO task_assignments (task_id, assigned_user_id, assigned_by_id) VALUES ($1, $2, $3)',
      [req.params.id, assigned_user_id, req.user.id]
    );
    res.status(201).json({ message: 'User assigned to task successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error assigning user to task' });
  }
});

app.delete('/api/tasks/:id/assign/:userId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM task_assignments WHERE task_id = $1 AND assigned_user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Assignment removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error removing assignment' });
  }
});

// ==== DEBUG (remove after fixing) ====

app.get('/api/debug/assignments', authenticateToken, async (req, res) => {
  const assignments = await pool.query('SELECT * FROM task_assignments');
  const users = await pool.query('SELECT * FROM users');
  res.json({ currentUserId: req.user.id, assignments: assignments.rows, users: users.rows });
});

// ==== SERVER START ====

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL database');
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
}

startServer();

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});
