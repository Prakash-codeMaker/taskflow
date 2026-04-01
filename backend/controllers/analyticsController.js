/**
 * Analytics Controller
 * Productivity insights and task statistics
 */

const Todo = require('../models/Todo');
const { asyncHandler } = require('../utils/errorUtils');

// ─── Overview Stats ───────────────────────────────────────────────────────────
const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [stats] = await Todo.aggregate([
    { $match: { userId, isArchived: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ['$dueDate', new Date()] },
                  { $ne: ['$status', 'completed'] },
                  { $ne: ['$dueDate', null] },
                ],
              },
              1,
              0,
            ],
          },
        },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        urgentPriority: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
      },
    },
    {
      $addFields: {
        completionRate: {
          $cond: [
            { $gt: ['$total', 0] },
            { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
            0,
          ],
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: stats || {
        total: 0, completed: 0, pending: 0, inProgress: 0,
        overdue: 0, highPriority: 0, urgentPriority: 0, completionRate: 0,
      },
    },
  });
});

// ─── Completion Trend (Last N Days) ──────────────────────────────────────────
const getCompletionTrend = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const userId = req.user._id;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));
  startDate.setHours(0, 0, 0, 0);

  const [createdData, completedData] = await Promise.all([
    // Tasks created per day
    Todo.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Tasks completed per day
    Todo.aggregate([
      {
        $match: {
          userId,
          status: 'completed',
          completedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Build date-indexed maps
  const createdMap = Object.fromEntries(createdData.map((d) => [d._id, d.count]));
  const completedMap = Object.fromEntries(completedData.map((d) => [d._id, d.count]));

  // Fill all days in range
  const trend = [];
  const current = new Date(startDate);
  const end = new Date();

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    trend.push({
      date: dateStr,
      created: createdMap[dateStr] || 0,
      completed: completedMap[dateStr] || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  res.status(200).json({ success: true, data: { trend } });
});

// ─── Priority Distribution ────────────────────────────────────────────────────
const getPriorityDistribution = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const distribution = await Todo.aggregate([
    { $match: { userId, isArchived: false } },
    {
      $group: {
        _id: '$priority',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    {
      $project: {
        priority: '$_id',
        total: 1,
        completed: 1,
        completionRate: {
          $cond: [
            { $gt: ['$total', 0] },
            { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
            0,
          ],
        },
      },
    },
  ]);

  res.status(200).json({ success: true, data: { distribution } });
});

// ─── Category Breakdown ───────────────────────────────────────────────────────
const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const breakdown = await Todo.aggregate([
    { $match: { userId, isArchived: false } },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({ success: true, data: { breakdown } });
});

// ─── Productivity Score ───────────────────────────────────────────────────────
const getProductivityScore = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeek, lastWeek] = await Promise.all([
    Todo.countDocuments({ userId, status: 'completed', completedAt: { $gte: weekAgo } }),
    Todo.countDocuments({
      userId, status: 'completed',
      completedAt: { $gte: twoWeeksAgo, $lt: weekAgo },
    }),
  ]);

  const trend = lastWeek === 0
    ? (thisWeek > 0 ? 100 : 0)
    : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

  // Score based on completion this week (capped at 100)
  const score = Math.min(Math.round((thisWeek / 10) * 100), 100);

  res.status(200).json({
    success: true,
    data: {
      score,
      thisWeek,
      lastWeek,
      trend, // percentage change
    },
  });
});

module.exports = {
  getOverview,
  getCompletionTrend,
  getPriorityDistribution,
  getCategoryBreakdown,
  getProductivityScore,
};
