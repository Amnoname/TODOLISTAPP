import { useState, useEffect } from 'react';
import { useStore } from '../store';

export default function TaskForm({ task, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [categoryId, setCategoryId] = useState(task?.category_id || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [assignedUserId, setAssignedUserId] = useState(task?.assignments?.[0]?.id || '');

  const categories = useStore((state) => state.categories);
  const users = useStore((state) => state.users);
  const currentUser = useStore((state) => state.user);
  const createTask = useStore((state) => state.createTask);
  const updateTask = useStore((state) => state.updateTask);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const successMessage = useStore((state) => state.successMessage);
  const clearMessages = useStore((state) => state.clearMessages);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setCategoryId(task.category_id || '');
      setPriority(task.priority || 'medium');
      setDueDate(task.due_date || '');
      setAssignedUserId(task.assignments?.[0]?.id || '');
    } else {
      setTitle('');
      setDescription('');
      setCategoryId('');
      setPriority('medium');
      setDueDate('');
      setAssignedUserId('');
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const taskData = {
      title,
      description,
      category_id: categoryId || null,
      priority,
      due_date: dueDate || null,
    };

    const success = task
      ? await updateTask(task.id, taskData)
      : await createTask({ ...taskData, assigned_user_id: assignedUserId || null });

    if (!success) return;

    if (task) {
      onSave?.();
      onClose?.();
    } else {
      setTitle('');
      setDescription('');
      setCategoryId('');
      setPriority('medium');
      setDueDate('');
      setAssignedUserId('');
      onClose?.();
    }

    setTimeout(() => clearMessages(), 2000);
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Task Title *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
          ></textarea>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="datetime-local"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>


        <div className="form-group">
          <label htmlFor="assignedUser">Assign To</label>
          <select
            id="assignedUser"
            value={assignedUserId}
            onChange={(e) => setAssignedUserId(e.target.value)}
          >
            <option value="">No assignment</option>
            {users
              .filter((user) => user.id !== currentUser?.id)
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
          </select>
        </div>

        <div className="btn-group">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Task'}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
