import { useState } from 'react';
import { useStore } from '../store';

export default function TaskList({ tasks, onEdit, highlightedTaskId }) {
  const updateTask = useStore((state) => state.updateTask);
  const deleteTask = useStore((state) => state.deleteTask);
  const assignTask = useStore((state) => state.assignTask);
  const removeAssignment = useStore((state) => state.removeAssignment);
  const users = useStore((state) => state.users);
  const currentUser = useStore((state) => state.user);
  const [assignmentSelections, setAssignmentSelections] = useState({});

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleDelete = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const handleAssign = async (taskId) => {
    const userId = assignmentSelections[taskId];
    if (!userId) return;
    await assignTask(taskId, userId);
    setAssignmentSelections((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleRemoveAssignment = async (taskId, userId) => {
    if (confirm('Remove this assignment?')) {
      await removeAssignment(taskId, userId);
    }
  };

  const handleAssignmentChange = (taskId, userId) => {
    setAssignmentSelections((prev) => ({ ...prev, [taskId]: userId }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  if (tasks.length === 0) {
    return <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
      <p>No tasks found. Create one to get started!</p>
    </div>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div
          key={task.id}
          id={`task-${task.id}`}
          className={`task-item ${task.status === 'completed' ? 'task-completed' : ''} ${task.id === highlightedTaskId ? 'task-item--highlighted' : ''}`}
        >
          {task.can_edit ? (
            <input
              type="checkbox"
              className="task-checkbox"
              checked={task.status === 'completed'}
              onChange={(e) =>
                handleStatusChange(task.id, e.target.checked ? 'completed' : 'in_progress')
              }
            />
          ) : (
            <input type="checkbox" className="task-checkbox" checked={task.status === 'completed'} disabled style={{ opacity: 0.35 }} />
          )}

          <div className="task-content">
            <div className="task-title">
              {task.title}
              {!task.can_edit && (
                <span className="task-badge" style={{ marginLeft: '0.5rem', background: 'rgba(148,163,184,0.15)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>View only</span>
              )}
            </div>
            {task.description && (
              <div className="task-description">{task.description}</div>
            )}

            <div className="task-meta">
              {task.status && (
                <span className={`task-badge badge-${task.status}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              )}
              {task.priority && (
                <span className={`task-badge badge-${task.priority}`}>
                  {task.priority.toUpperCase()}
                </span>
              )}
              {isOverdue(task.due_date, task.status) && (
                <span style={{ color: '#EF4444' }}>Overdue</span>
              )}
              <span>{formatDate(task.due_date)}</span>
            </div>

            {task.assignments && task.assignments.length > 0 && (
              <div className="task-assignments">
                <strong>Assigned to:</strong>
                {task.assignments.map((assignment) => (
                  <span key={assignment.id} className="tag">
                    {assignment.username || `User ${assignment.id}`}
                    {task.can_edit && (
                      <button
                        type="button"
                        className="btn btn-link"
                        onClick={() => handleRemoveAssignment(task.id, assignment.id)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {task.can_edit ? (
            <>
              <div className="task-actions">
                <select
                  className="btn btn-small btn-outline"
                  value={task.status || 'in_progress'}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                >
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => onEdit?.(task)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => handleDelete(task.id)}
                >
                  Delete
                </button>
              </div>

              <div className="task-actions" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  className="btn btn-small btn-outline"
                  value={assignmentSelections[task.id] || ''}
                  onChange={(e) => handleAssignmentChange(task.id, e.target.value)}
                >
                  <option value="">Assign user</option>
                  {users
                    .filter((user) => user.id !== currentUser?.id)
                    .map((user) => (
                      <option
                        key={user.id}
                        value={user.id}
                        disabled={task.assignments?.some((a) => a.id === user.id)}
                      >
                        {user.username}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="btn btn-small btn-primary"
                  onClick={() => handleAssign(task.id)}
                  disabled={!assignmentSelections[task.id]}
                >
                  Assign
                </button>
              </div>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
