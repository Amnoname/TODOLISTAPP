import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

function AppContent() {
  const isLoggedIn = useStore((state) => state.isLoggedIn);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const fetchProfile = useStore((state) => state.fetchProfile);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  if (!isLoggedIn && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }

  if (isLoggedIn && isAuthPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {isLoggedIn && (
        <div className="main-layout">
          <aside className="sidebar">
            <h2>Tasks</h2>
            <nav>
              <ul className="nav-list">
                <li className="nav-item">
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/tasks"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    My Tasks
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/profile"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Profile
                  </NavLink>
                </li>
              </ul>
            </nav>

            <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                {user?.username && `Welcome, ${user.username}`}
              </p>
              <button className="btn btn-outline" onClick={toggleTheme} style={{ width: '100%', marginBottom: '0.75rem' }}>
                {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              </button>
              <button className="btn btn-outline" onClick={handleLogout} style={{ width: '100%' }}>
                Logout
              </button>
            </div>
          </aside>

          <main className="main-content">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      )}

      {!isLoggedIn && (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
