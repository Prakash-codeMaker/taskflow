/**
 * Todo Controller
 * Full CRUD with filtering, search, pagination, and real-time events
 */

const Todo = require('../models/Todo');
const { AppError, asyncHandler } = require('../utils/errorUtils');
const { emitToUser } = require('../config/socket');
const { sanitizeInput } = require('../utils/sanitize');

// ─── Helper: Build Query Filters ─────────────────────────────────────────────
const buildFilters = (userId, query) => {
  const filters = { userId, isArchived: false };

  if (query.status) filters.status = query.status;
  if (query.priority) filters.priority = query.priority;
  if (query.category) filters.category = query.category;

  // Due date range
  if (query.dueDateFrom || query.dueDateTo) {
    filters.dueDate = {};
    if (query.dueDateFrom) filters.dueDate.$gte = new Date(query.dueDateFrom);
    if (query.dueDateTo) filters.dueDate.$lte = new Date(query.dueDateTo);
  }

  // Overdue filter
  if (query.overdue === 'true') {
    filters.dueDate = { $lt: new Date() };
    filters.status = { $ne: 'completed' };
  }

  // Tags
  if (query.tags) {
    const tagList = query.tags.split(',').map((t) => t.trim());
    filters.tags = { $in: tagList };
  }

  // Text search (uses MongoDB text index)
  if (query.search) {
    filters.$text = { $search: sanitizeInput(query.search) };
  }

  return filters;
};

// ─── GET All Todos ────────────────────────────────────────────────────────────
const getTodos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'order',
    sortOrder = 'asc',
    ...queryParams
  } = req.query;

  const filters = buildFilters(req.user._id, queryParams);

  // Sorting
  const sortOptions = {};
  if (queryParams.search) {
    sortOptions.score = { $meta: 'textScore' };
  } else {
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    if (sortBy !== 'createdAt') sortOptions.createdAt = -1; // Secondary sort
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [todos, total] = await Promise.all([
    Todo.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean({ virtuals: true }),
    Todo.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: {
      todos,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: todos.length,
        totalItems: total,
      },
    },
  });
});

// ─── GET Single Todo ──────────────────────────────────────────────────────────
const getTodo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[a-fA-F0-9]{24}$/)) throw new AppError('Invalid todo ID', 400);

  const todo = await Todo.findOne({ _id: id, userId: req.user._id });

  if (!todo) {
    throw new AppError('Todo not found', 404);
  }

  res.status(200).json({ success: true, data: { todo } });
});

// ─── CREATE Todo ──────────────────────────────────────────────────────────────
const createTodo = asyncHandler(async (req, res) => {
  // Get max order for new todo position
  const maxOrder = await Todo.findOne({ userId: req.user._id })
    .sort({ order: -1 })
    .select('order')
    .lean();

  const todo = await Todo.create({
    ...req.body,
    title: sanitizeInput(req.body.title),
    description: sanitizeInput(req.body.description || ''),
    userId: req.user._id,
    order: (maxOrder?.order || 0) + 1,
  });

  // Real-time event
  emitToUser(req.user._id.toString(), 'todo:created', { todo });

  res.status(201).json({
    success: true,
    message: 'Todo created successfully',
    data: { todo },
  });
});

// ─── UPDATE Todo ──────────────────────────────────────────────────────────────
const updateTodo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[a-fA-F0-9]{24}$/)) throw new AppError('Invalid todo ID', 400);

  const allowedUpdates = [
    'title', 'description', 'status', 'priority',
    'dueDate', 'tags', 'category', 'subtasks', 'order',
  ];

  // Filter only allowed fields
  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.title) updates.title = sanitizeInput(updates.title);
  if (updates.description) updates.description = sanitizeInput(updates.description);

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!todo) throw new AppError('Todo not found', 404);

  // Real-time event
  emitToUser(req.user._id.toString(), 'todo:updated', { todo });

  res.status(200).json({
    success: true,
    message: 'Todo updated successfully',
    data: { todo },
  });
});

// ─── DELETE Todo ──────────────────────────────────────────────────────────────
const deleteTodo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format before hitting the DB
  if (!id || !id.match(/^[a-fA-F0-9]{24}$/)) {
    throw new AppError('Invalid todo ID', 400);
  }

  const todo = await Todo.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!todo) throw new AppError('Todo not found', 404);

  // Real-time event
  emitToUser(req.user._id.toString(), 'todo:deleted', { todoId: req.params.id });

  res.status(200).json({
    success: true,
    message: 'Todo deleted successfully',
  });
});

// ─── BULK Operations ──────────────────────────────────────────────────────────
const bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, updates } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError('Please provide an array of todo IDs', 400);
  }

  const allowedUpdates = ['status', 'priority', 'category', 'isArchived'];
  const validUpdates = {};
  allowedUpdates.forEach((field) => {
    if (updates[field] !== undefined) validUpdates[field] = updates[field];
  });

  const result = await Todo.updateMany(
    { _id: { $in: ids }, userId: req.user._id },
    validUpdates
  );

  // Real-time event
  emitToUser(req.user._id.toString(), 'todo:bulkUpdated', { ids, updates: validUpdates });

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} todos updated`,
    data: { modifiedCount: result.modifiedCount },
  });
});

// ─── BULK Delete ──────────────────────────────────────────────────────────────
const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError('Please provide an array of todo IDs', 400);
  }

  const result = await Todo.deleteMany({
    _id: { $in: ids },
    userId: req.user._id,
  });

  // Real-time event
  emitToUser(req.user._id.toString(), 'todo:bulkDeleted', { ids });

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} todos deleted`,
    data: { deletedCount: result.deletedCount },
  });
});

// ─── Reorder Todos (Drag & Drop) ──────────────────────────────────────────────
const reorderTodos = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    throw new AppError('orderedIds must be an array', 400);
  }

  // Bulk update orders efficiently
  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, userId: req.user._id },
      update: { $set: { order: index } },
    },
  }));

  await Todo.bulkWrite(bulkOps);

  emitToUser(req.user._id.toString(), 'todo:reordered', { orderedIds });

  res.status(200).json({
    success: true,
    message: 'Todos reordered successfully',
  });
});

// ─── Toggle Subtask ───────────────────────────────────────────────────────────
const toggleSubtask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;

  const todo = await Todo.findOne({ _id: req.params.id, userId: req.user._id });
  if (!todo) throw new AppError('Todo not found', 404);

  const subtask = todo.subtasks.id(subtaskId);
  if (!subtask) throw new AppError('Subtask not found', 404);

  subtask.completed = !subtask.completed;
  subtask.completedAt = subtask.completed ? new Date() : null;

  await todo.save();

  res.status(200).json({
    success: true,
    data: { todo },
  });
});

module.exports = {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  bulkUpdate,
  bulkDelete,
  reorderTodos,
  toggleSubtask,
};
