import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import CategoryForm from '../components/CategoryForm';

export default function Tasks() {
  const tasks = useStore((state) => state.tasks);
  const categories = useStore((state) => state.categories);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const fetchCategories = useStore((state) => state.fetchCategories);
  const fetchUsers = useStore((state) => state.fetchUsers);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const [highlightedTaskId, setHighlightedTaskId] = useState(location.state?.highlightTaskId ?? null);

  useEffect(() => {
    fetchTasks(filters);
    fetchCategories();
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!highlightedTaskId || tasks.length === 0) return;
    const el = document.getElementById(`task-${highlightedTaskId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timer = setTimeout(() => setHighlightedTaskId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedTaskId, tasks]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value });
  };

  const handleFilterByStatus = (status) => {
    setFilters({ ...filters, status: status || undefined });
  };

  const handleFilterByCategory = (categoryId) => {
    setFilters({ ...filters, category_id: categoryId || undefined });
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Tasks</h1>
        <div className="btn-group">
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTask(null);
              setShowTaskForm((current) => !current);
            }}
          >
            {showTaskForm ? 'Cancel' : '+ Add Task'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowCategoryForm((current) => !current)}>
            {showCategoryForm ? 'Cancel' : '+ Add Category'}
          </button>
        </div>
      </div>

      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
      {editingTask && (
        <TaskForm
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={() => setEditingTask(null)}
        />
      )}
      {showCategoryForm && <CategoryForm onClose={() => setShowCategoryForm(false)} />}

      <div className="search-filter">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select onChange={(e) => handleFilterByStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select onChange={(e) => handleFilterByCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <TaskList tasks={tasks} onEdit={setEditingTask} highlightedTaskId={highlightedTaskId} />
    </div>
  );
}
