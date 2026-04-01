/**
 * Todo Model
 * Full-featured todo schema with advanced fields
 */

const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in-progress', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 30,
    }],
    order: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 50,
      default: 'General',
    },
    subtasks: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
todoSchema.index({ userId: 1, createdAt: -1 });
todoSchema.index({ userId: 1, status: 1 });
todoSchema.index({ userId: 1, priority: 1 });
todoSchema.index({ userId: 1, dueDate: 1 });
todoSchema.index({ userId: 1, order: 1 });
// Text search index
todoSchema.index({ title: 'text', description: 'text', tags: 'text' });

// ─── Virtual: Overdue ────────────────────────────────────────────────────────
todoSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > new Date(this.dueDate);
});

// ─── Virtual: Subtask progress ───────────────────────────────────────────────
todoSchema.virtual('subtaskProgress').get(function () {
  if (!this.subtasks || this.subtasks.length === 0) return null;
  const completed = this.subtasks.filter((s) => s.completed).length;
  return {
    completed,
    total: this.subtasks.length,
    percentage: Math.round((completed / this.subtasks.length) * 100),
  };
});

// ─── Pre-save: Set completedAt ───────────────────────────────────────────────
todoSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = null;
    }
  }
  next();
});

module.exports = mongoose.model('Todo', todoSchema);
