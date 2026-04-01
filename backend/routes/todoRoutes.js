const express = require('express');
const {
  getTodos, getTodo, createTodo, updateTodo, deleteTodo,
  bulkUpdate, bulkDelete, reorderTodos, toggleSubtask,
} = require('../controllers/todoController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createTodoSchema, updateTodoSchema, bulkUpdateSchema, reorderSchema } = require('../validators/schemas');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getTodos)
  .post(validate(createTodoSchema), createTodo);

router.patch('/bulk', validate(bulkUpdateSchema), bulkUpdate);
router.delete('/bulk', bulkDelete);
router.patch('/reorder', validate(reorderSchema), reorderTodos);

router.route('/:id')
  .get(getTodo)
  .patch(validate(updateTodoSchema), updateTodo)
  .delete(deleteTodo);

router.patch('/:id/subtasks/:subtaskId/toggle', toggleSubtask);

module.exports = router;
