import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { Plus, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { useTodos } from '@/hooks/useTodos';
import useTodoStore from '@/hooks/useTodos';
import { useDebounce, useSocket } from '@/hooks/index';
import TodoItem from '@/components/todo/TodoItem';
import TodoForm from '@/components/todo/TodoForm';
import TodoFilters from '@/components/todo/TodoFilters';
import TodoBoardView from '@/components/todo/TodoBoardView';
import EmptyState from '@/components/common/EmptyState';

export default function TodosPage() {
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm]     = useState(searchParams.get('new') === '1');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView]             = useState('list'); // 'list' | 'board'
  const [selected, setSelected]     = useState(new Set());
  const [search, setSearch]         = useState('');
  const debouncedSearch             = useDebounce(search, 400);

  const {
    todos, loading, filters, setFilters,
    fetchTodos, createTodo, updateTodo, deleteTodo,
    toggleTodo, reorderTodos, bulkDelete, bulkComplete,
    socketCreate, socketUpdate, socketDelete,
  } = useTodos();

  // Real-time events
  // Real-time events — destructure the event payload correctly
  // Server emits: { todo } / { todoId } — must unwrap before passing to store
  useSocket('todo:created', useCallback(({ todo }) => {
    // Deduplicate: skip if already in store (e.g. from optimistic add)
    const exists = useTodoStore.getState().todos.some(t => t._id === todo._id);
    if (!exists) socketCreate(todo);
  }, [socketCreate]));
  useSocket('todo:updated', useCallback(({ todo }) => socketUpdate(todo), [socketUpdate]));
  useSocket('todo:deleted', useCallback(({ todoId }) => socketDelete(todoId), [socketDelete]));

  // Sync debounced search into filters
  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch]);

  // Fetch on filter change
  useEffect(() => {
    fetchTodos();
  }, [filters]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t._id === active.id);
    const newIndex = todos.findIndex((t) => t._id === over.id);
    const reordered = arrayMove(todos, oldIndex, newIndex);
    reorderTodos(reordered.map((t) => t._id));
  }, [todos, reorderTodos]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(selected.size === todos.length ? new Set() : new Set(todos.map((t) => t._id)));
  };

  const activeFiltersCount = [filters.status, filters.priority].filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {todos.length} {todos.length === 1 ? 'task' : 'tasks'}
            {activeFiltersCount > 0 && ` · ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active`}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="search"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 pr-4"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.65 10.65z" />
          </svg>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary relative ${showFilters ? 'bg-brand-50 dark:bg-brand-950/30 border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-400' : ''}`}
        >
          <SlidersHorizontal size={16} />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* View toggle */}
        <div className="flex items-center border border-surface-border dark:border-dark-border rounded-lg overflow-hidden">
          {[['list', List], ['board', LayoutGrid]].map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`p-2 transition-colors ${view === v ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <TodoFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => { setFilters({ status: '', priority: '' }); setSearch(''); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
            className="card px-4 py-2.5 mb-4 flex items-center gap-3 bg-brand-50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800"
          >
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
              {selected.size} selected
            </span>
            <div className="flex-1" />
            <button onClick={() => bulkComplete([...selected]).then(() => setSelected(new Set()))} className="btn-ghost text-sm text-emerald-600 dark:text-emerald-400">
              ✓ Complete
            </button>
            <button onClick={() => bulkDelete([...selected]).then(() => setSelected(new Set()))} className="btn-ghost text-sm text-red-500">
              Delete
            </button>
            <button onClick={() => setSelected(new Set())} className="btn-ghost text-sm">
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-14 skeleton" />)}
        </div>
      ) : todos.length === 0 ? (
        <EmptyState onAdd={() => setShowForm(true)} hasFilters={activeFiltersCount > 0 || !!search} />
      ) : view === 'board' ? (
        <TodoBoardView
          todos={todos}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
          onToggle={toggleTodo}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={todos.map((t) => t._id)} strategy={verticalListSortingStrategy}>
            <motion.ul layout className="space-y-2">
              <AnimatePresence mode="popLayout">
                {todos.map((todo) => (
                  <TodoItem
                    key={todo._id}
                    todo={todo}
                    selected={selected.has(todo._id)}
                    onSelect={() => toggleSelect(todo._id)}
                    onToggle={() => toggleTodo(todo._id)}
                    onUpdate={(upd) => updateTodo(todo._id, upd)}
                    onDelete={() => deleteTodo(todo._id)}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Todo Form Modal */}
      <AnimatePresence>
        {showForm && (
          <TodoForm
            onSubmit={async (data) => { await createTodo(data); setShowForm(false); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
