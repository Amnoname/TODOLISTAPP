import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

function getMonthMatrix(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastOfMonth.getDate();
  const startWeekday = firstOfMonth.getDay();

  const weeks = [];
  let currentDay = 1 - startWeekday;
  while (currentDay <= daysInMonth) {
    const week = Array.from({ length: 7 }, (_, index) => {
      const dayDate = new Date(year, month, currentDay + index);
      const isCurrentMonth = dayDate.getMonth() === month;
      return {
        date: dayDate,
        key: dayDate.toISOString().slice(0, 10),
        isCurrentMonth,
      };
    });
    weeks.push(week);
    currentDay += 7;
  }

  return {
    monthLabel: firstOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    weeks,
  };
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const analytics = useStore((state) => state.analytics);
  const tasks = useStore((state) => state.tasks);
  const fetchAnalytics = useStore((state) => state.fetchAnalytics);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const loading = useStore((state) => state.loading);
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState(null);

  const monthInfo = useMemo(() => getMonthMatrix(), []);

  useEffect(() => {
    fetchAnalytics();
    fetchTasks({ scope: 'mine' });
  }, []);

  const tasksByDate = useMemo(() => {
    const grouped = {};
    if (!tasks) return grouped;

    tasks.forEach((task) => {
      if (!task.due_date) return;
      const due = new Date(task.due_date);
      const key = due.toISOString().slice(0, 10);
      grouped[key] = grouped[key] || [];
      grouped[key].push(task);
    });

    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    });

    return grouped;
  }, [tasks]);

  const handleTaskMouseEnter = (e, task) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    const x = spaceRight >= 300 ? rect.right + 8 : rect.left - 292;
    const y = Math.min(rect.top, window.innerHeight - 180);
    setTooltip({ task, x, y });
  };

  const handleTaskClick = (taskId) => {
    navigate('/tasks', { state: { highlightTaskId: taskId } });
  };

  if (loading && !analytics) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Monthly To-Do List</p>
          <h1>Task Analytics & Monthly Calendar</h1>
          <p className="dashboard-intro">
            Review your task progress and see scheduled work across the month.
          </p>
        </div>
        <div className="dashboard-hero-cards">
          <div className="hero-card">
            <span>Total Tasks</span>
            <strong>{analytics?.total ?? 0}</strong>
          </div>
          <div className="hero-card">
            <span>Overdue</span>
            <strong>{analytics?.overdue ?? 0}</strong>
          </div>
          <div className="hero-card">
            <span>Completed</span>
            <strong>{analytics?.completed ?? 0}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card analytics-card">
          <h2>Task status breakdown</h2>
          <div className="status-list">
            <div className="status-item">
              <span className="status-dot in-progress"></span>
              <div>
                <strong>{analytics?.inProgress ?? 0}</strong>
                <p>In progress</p>
              </div>
            </div>
            <div className="status-item">
              <span className="status-dot completed"></span>
              <div>
                <strong>{analytics?.completed ?? 0}</strong>
                <p>Completed</p>
              </div>
            </div>
          </div>

          <h3>Priority summary</h3>
          <div className="priority-bars">
            <div>
              <span>High</span>
              <div className="priority-row">
                <div className="priority-fill high" style={{ width: `${((analytics?.byPriority.high || 0) / Math.max(analytics?.total || 1, 1)) * 100}%` }} />
                <strong>{analytics?.byPriority.high ?? 0}</strong>
              </div>
            </div>
            <div>
              <span>Medium</span>
              <div className="priority-row">
                <div className="priority-fill medium" style={{ width: `${((analytics?.byPriority.medium || 0) / Math.max(analytics?.total || 1, 1)) * 100}%` }} />
                <strong>{analytics?.byPriority.medium ?? 0}</strong>
              </div>
            </div>
            <div>
              <span>Low</span>
              <div className="priority-row">
                <div className="priority-fill low" style={{ width: `${((analytics?.byPriority.low || 0) / Math.max(analytics?.total || 1, 1)) * 100}%` }} />
                <strong>{analytics?.byPriority.low ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card schedule-card">
          <div className="schedule-header">
            <div>
              <h2>{monthInfo.monthLabel} Calendar</h2>
              <p>Tasks are shown on the date they are due.</p>
            </div>
          </div>

          <div className="calendar-container">
            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                <div key={label} className="calendar-weekday">
                  {label}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {monthInfo.weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="calendar-row">
                  {week.map((day) => {
                    const dayTasks = tasksByDate[day.key] || [];
                    return (
                      <div
                        key={day.key}
                        className={`calendar-cell ${day.isCurrentMonth ? '' : 'calendar-cell--muted'}`}
                      >
                        <div className="calendar-day-number">{day.date.getDate()}</div>
                        <div className="calendar-tasks">
                          {dayTasks.slice(0, 2).map((task) => (
                            <div
                              key={task.id}
                              className="calendar-task"
                              onMouseEnter={(e) => handleTaskMouseEnter(e, task)}
                              onMouseLeave={() => setTooltip(null)}
                              onClick={() => handleTaskClick(task.id)}
                            >
                              <span className="calendar-task-time">{formatTime(task.due_date)}</span>
                              <span className="calendar-task-title">{task.title}</span>
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="calendar-task-more">+{dayTasks.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="calendar-task-tooltip"
          style={{ top: tooltip.y, left: tooltip.x }}
        >
          <div className="tooltip-title">{tooltip.task.title}</div>
          {tooltip.task.description && (
            <div className="tooltip-desc">{tooltip.task.description}</div>
          )}
          <div className="tooltip-meta">
            <span className={`task-badge badge-${tooltip.task.priority}`}>{tooltip.task.priority}</span>
            <span className={`task-badge badge-${tooltip.task.status}`}>{tooltip.task.status.replace('_', ' ')}</span>
          </div>
          <div className="tooltip-time">{formatTime(tooltip.task.due_date)}</div>
          <div className="tooltip-hint">Click to go to task</div>
        </div>
      )}
    </div>
  );
}
