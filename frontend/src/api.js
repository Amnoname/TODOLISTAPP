import axios from 'axios';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  register: (username, email, password) =>
    apiClient.post('/auth/register', { username, email, password }),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  // Tasks
  getTasks: (filters = {}) =>
    apiClient.get('/tasks', { params: filters }),
  getTask: (id) =>
    apiClient.get(`/tasks/${id}`),
  createTask: (task) =>
    apiClient.post('/tasks', task),
  updateTask: (id, task) =>
    apiClient.put(`/tasks/${id}`, task),
  deleteTask: (id) =>
    apiClient.delete(`/tasks/${id}`),

  // Categories
  getCategories: () =>
    apiClient.get('/categories'),
  createCategory: (category) =>
    apiClient.post('/categories', category),
  deleteCategory: (id) =>
    apiClient.delete(`/categories/${id}`),

  // Analytics
  getAnalytics: () =>
    apiClient.get('/dashboard/analytics'),

  // Users
  getUsers: () =>
    apiClient.get('/users'),
  getProfile: () =>
    apiClient.get('/auth/profile'),

  // Assignments
  assignTask: (taskId, userId) =>
    apiClient.post(`/tasks/${taskId}/assign`, { assigned_user_id: userId }),
  removeAssignment: (taskId, userId) =>
    apiClient.delete(`/tasks/${taskId}/assign/${userId}`),
};

export default apiClient;
