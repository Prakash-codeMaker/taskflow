/**
 * useTodos Hook
 * Zustand store for all todo state and actions
 */

import { create } from 'zustand';
import { todoService } from '@/services';
import toast from 'react-hot-toast';

const useTodoStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  todos: [],
  pagination: { current: 1, total: 1, totalItems: 0 },
  loading: false,
  creating: false,
  filters: {
    status: '',
    priority: '',
    search: '',
    sortBy: 'order',
    sortOrder: 'asc',
  },

  // ─── Actions ─────────────────────────────────────────────────────────────────
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () =>
    set({ filters: { status: '', priority: '', search: '', sortBy: 'order', sortOrder: 'asc' } }),

  fetchTodos: async (params = {}) => {
    set({ loading: true });
    try {
      const { filters } = get();
      const query = {
        ...filters,
        ...params,
        limit: 50,
      };
      // Remove empty strings
      Object.keys(query).forEach((k) => {
        if (query[k] === '' || query[k] == null) delete query[k];
      });

      const { data } = await todoService.getAll(query);
      set({ todos: data.todos, pagination: data.pagination, loading: false });
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || 'Failed to fetch todos');
    }
  },

  createTodo: async (todoData) => {
    set({ creating: true });
    try {
      const { data } = await todoService.create(todoData);
      set((state) => ({ todos: [data.todo, ...state.todos], creating: false }));
      toast.success('Task created!');
      return data.todo;
    } catch (err) {
      set({ creating: false });
      toast.error(err.message || 'Failed to create task');
      throw err;
    }
  },

  updateTodo: async (id, updates) => {
    // Optimistic update
    const prev = get().todos;
    set((state) => ({
      todos: state.todos.map((t) => (t._id === id ? { ...t, ...updates } : t)),
    }));

    try {
      const { data } = await todoService.update(id, updates);
      set((state) => ({
        todos: state.todos.map((t) => (t._id === id ? data.todo : t)),
      }));
      return data.todo;
    } catch (err) {
      set({ todos: prev }); // Rollback
      toast.error(err.message || 'Failed to update task');
      throw err;
    }
  },

  deleteTodo: async (id) => {
    if (!id || id === 'undefined') {
      console.warn('deleteTodo called with invalid id:', id);
      return;
    }
    const prev = get().todos;
    set((state) => ({ todos: state.todos.filter((t) => t._id !== id) }));

    try {
      await todoService.delete(id);
      toast.success('Task deleted');
    } catch (err) {
      set({ todos: prev }); // Rollback
      toast.error(err.message || 'Failed to delete task');
    }
  },

  toggleTodo: async (id) => {
    const todo = get().todos.find((t) => t._id === id);
    if (!todo) return;
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    await get().updateTodo(id, { status: newStatus });
  },

  reorderTodos: async (orderedIds) => {
    // Optimistic reorder
    const prev = get().todos;
    const reordered = orderedIds
      .map((id) => get().todos.find((t) => t._id === id))
      .filter(Boolean);
    set({ todos: reordered });

    try {
      await todoService.reorder(orderedIds);
    } catch (err) {
      set({ todos: prev });
      toast.error('Failed to save order');
    }
  },

  bulkDelete: async (ids) => {
    const prev = get().todos;
    set((state) => ({ todos: state.todos.filter((t) => !ids.includes(t._id)) }));

    try {
      await todoService.bulkDelete(ids);
      toast.success(`${ids.length} tasks deleted`);
    } catch (err) {
      set({ todos: prev });
      toast.error('Failed to delete tasks');
    }
  },

  bulkComplete: async (ids) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        ids.includes(t._id) ? { ...t, status: 'completed' } : t
      ),
    }));

    try {
      await todoService.bulkUpdate(ids, { status: 'completed' });
      toast.success(`${ids.length} tasks completed!`);
    } catch (err) {
      await get().fetchTodos();
      toast.error('Failed to update tasks');
    }
  },

  // Real-time socket event handlers
  socketCreate: (todo) =>
    set((state) => ({ todos: [todo, ...state.todos] })),

  socketUpdate: (todo) =>
    set((state) => ({
      todos: state.todos.map((t) => (t._id === todo._id ? todo : t)),
    })),

  socketDelete: (todoId) =>
    set((state) => ({ todos: state.todos.filter((t) => t._id !== todoId) })),
}));

export const useTodos = () => useTodoStore();
export default useTodoStore;
