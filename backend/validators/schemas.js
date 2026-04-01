/**
 * Joi Validation Schemas
 * Input validation for all routes
 */

const Joi = require('joi');

// ─── Auth Validators ──────────────────────────────────────────────────────────
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and a number',
      'any.required': 'Password is required',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'New password must contain uppercase, lowercase, and a number',
    }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'system'),
    defaultView: Joi.string().valid('list', 'board', 'calendar'),
  }),
});

// ─── Todo Validators ──────────────────────────────────────────────────────────
const createTodoSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'any.required': 'Title is required',
    'string.max': 'Title cannot exceed 200 characters',
  }),
  description: Joi.string().max(2000).allow('').default(''),
  status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled').default('pending'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  dueDate: Joi.date().iso().allow(null),
  tags: Joi.array().items(Joi.string().max(30)).max(10).default([]),
  category: Joi.string().max(50).default('General'),
  subtasks: Joi.array().items(
    Joi.object({
      title: Joi.string().min(1).max(200).required(),
      completed: Joi.boolean().default(false),
    })
  ).default([]),
});

const updateTodoSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().max(2000).allow(''),
  status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  dueDate: Joi.date().iso().allow(null),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  category: Joi.string().max(50),
  order: Joi.number().integer().min(0),
  subtasks: Joi.array().items(
    Joi.object({
      _id: Joi.string(),
      title: Joi.string().min(1).max(200).required(),
      completed: Joi.boolean(),
      completedAt: Joi.date().allow(null),
    })
  ),
});

const bulkUpdateSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).required(),
  updates: Joi.object({
    status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    category: Joi.string().max(50),
    isArchived: Joi.boolean(),
  }).min(1).required(),
});

const reorderSchema = Joi.object({
  orderedIds: Joi.array().items(Joi.string()).min(1).required(),
});

module.exports = {
  signupSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  createTodoSchema,
  updateTodoSchema,
  bulkUpdateSchema,
  reorderSchema,
};
