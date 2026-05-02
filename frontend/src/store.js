import { create } from 'zustand';
import { api } from './api';

export const useStore = create((set) => ({
  // Auth state
  user: null,
  token: localStorage.getItem('token') || null,
  isLoggedIn: !!localStorage.getItem('token'),

  // Tasks state
  tasks: [],
  categories: [],
  users: [],
  analytics: null,

  // UI state
  loading: false,
  error: null,
  successMessage: null,

  // Auth actions
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.login(email, password);
      localStorage.setItem('token', response.data.token);
      set({
        user: { id: response.data.userId, username: response.data.username, email: response.data.email },
        token: response.data.token,
        isLoggedIn: true,
        loading: false,
        successMessage: 'Login successful!',
      });
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      set({ error: message, loading: false });
      return false;
    }
  },

  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.register(username, email, password);
      localStorage.setItem('token', response.data.token);
      set({
        user: { id: response.data.userId, username, email },
        token: response.data.token,
        isLoggedIn: true,
        loading: false,
        successMessage: 'Registration successful!',
      });
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      set({ error: message, loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isLoggedIn: false,
      tasks: [],
      categories: [],
    });
  },

  // Tasks actions
  fetchTasks: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.getTasks(filters);
      set({ tasks: response.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch tasks', loading: false });
    }
  },

  createTask: async (task) => {
    set({ loading: true, error: null });
    try {
      await api.createTask(task);
      const response = await api.getTasks();
      set({ tasks: response.data, loading: false, successMessage: 'Task created successfully!' });
      return true;
    } catch (error) {
      set({ error: 'Failed to create task', loading: false });
      return false;
    }
  },

  updateTask: async (id, task) => {
    set({ loading: true, error: null });
    try {
      await api.updateTask(id, task);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
        loading: false,
        successMessage: 'Task updated successfully!',
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to update task', loading: false });
      return false;
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        loading: false,
        successMessage: 'Task deleted successfully!',
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to delete task', loading: false });
      return false;
    }
  },

  // Categories actions
  fetchCategories: async () => {
    try {
      const response = await api.getCategories();
      set({ categories: response.data });
    } catch (error) {
      set({ error: 'Failed to fetch categories' });
    }
  },

  createCategory: async (category) => {
    try {
      const response = await api.createCategory(category);
      set((state) => ({
        categories: [...state.categories, response.data],
        successMessage: 'Category created successfully!',
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to create category' });
      return false;
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.deleteCategory(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        successMessage: 'Category deleted successfully!',
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to delete category' });
      return false;
    }
  },

  // Users actions
  fetchUsers: async () => {
    try {
      const response = await api.getUsers();
      set({ users: response.data });
      return true;
    } catch (error) {
      set({ error: 'Failed to fetch users' });
      return false;
    }
  },
  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getProfile();
      set({ user: response.data, isLoggedIn: true, loading: false });
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to load profile';
      set({ error: message, loading: false, isLoggedIn: false, user: null, token: null });
      localStorage.removeItem('token');
      return false;
    }
  },

  assignTask: async (taskId, userId) => {
    set({ loading: true, error: null });
    try {
      await api.assignTask(taskId, userId);
      const response = await api.getTasks();
      set({ tasks: response.data, loading: false, successMessage: 'User assigned successfully!' });
      return true;
    } catch (error) {
      set({ error: 'Failed to assign user', loading: false });
      return false;
    }
  },

  removeAssignment: async (taskId, userId) => {
    set({ loading: true, error: null });
    try {
      await api.removeAssignment(taskId, userId);
      const response = await api.getTasks();
      set({ tasks: response.data, loading: false, successMessage: 'Assignment removed successfully!' });
      return true;
    } catch (error) {
      set({ error: 'Failed to remove assignment', loading: false });
      return false;
    }
  },

  // Analytics actions
  fetchAnalytics: async () => {
    try {
      const response = await api.getAnalytics();
      set({ analytics: response.data });
    } catch (error) {
      set({ error: 'Failed to fetch analytics' });
    }
  },

  // UI actions
  clearMessages: () => {
    set({ error: null, successMessage: null });
  },
}));
