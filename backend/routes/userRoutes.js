const express = require('express');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errorUtils');
const User = require('../models/User');
const Todo = require('../models/Todo');

const router = express.Router();
router.use(protect);

// Get dashboard summary
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [user, todoStats, recentTodos] = await Promise.all([
    User.findById(userId),
    Todo.aggregate([
      { $match: { userId, isArchived: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Todo.find({ userId, isArchived: false, status: { $ne: 'completed' } })
      .sort({ priority: -1, dueDate: 1, createdAt: -1 })
      .limit(5)
      .lean({ virtuals: true }),
  ]);

  const stats = { total: 0, completed: 0, pending: 0, inProgress: 0 };
  todoStats.forEach(({ _id, count }) => {
    stats.total += count;
    if (_id === 'completed') stats.completed = count;
    if (_id === 'pending') stats.pending = count;
    if (_id === 'in-progress') stats.inProgress = count;
  });

  res.status(200).json({
    success: true,
    data: { user: user.toSafeObject(), stats, recentTodos },
  });
}));

module.exports = router;
