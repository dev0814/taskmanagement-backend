const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  mimetype: String,
  path: String,
  size: Number,
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to a user']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task creator is required']
  },
  note: {
    type: String,
    trim: true
  },
  documents: {
    type: [documentSchema],
    validate: {
      validator: function(v) {
        return v.length <= 3;
      },
      message: 'A task cannot have more than 3 attached documents'
    }
  }
}, {
  timestamps: true
});

// Add index for efficient filtering and sorting
taskSchema.index({ status: 1, priority: 1, dueDate: 1, assignedTo: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 