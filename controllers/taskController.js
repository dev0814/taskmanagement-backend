const Task = require('../models/taskModel');
const User = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');
const path = require('path');
const fs = require('fs');

// @desc    Get all tasks with filtering, sorting, and pagination
// @route   GET /api/tasks
// @access  Private/Admin
const getTasks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // Build query
  const query = {};
  
  // Apply status filter if provided
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // Apply priority filter if provided
  if (req.query.priority) {
    query.priority = req.query.priority;
  }
  
  // Apply assignedTo filter if provided
  if (req.query.assignedTo) {
    query.assignedTo = req.query.assignedTo;
  }

  // Apply date filters if provided
  if (req.query.startDate || req.query.endDate) {
    query.dueDate = {};
    if (req.query.startDate) {
      query.dueDate.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.dueDate.$lte = new Date(req.query.endDate);
    }
  }
  
  // Search by title or description
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex }
    ];
  }
  
  // Determine sort order
  let sortOption = {};
  if (req.query.sortBy) {
    const sortDir = req.query.sortDir === 'desc' ? -1 : 1;
    sortOption[req.query.sortBy] = sortDir;
  } else {
    sortOption = { dueDate: 1 }; // Default sort by due date asc
  }
  
  // Get total count for pagination
  const total = await Task.countDocuments(query);
  
  // Execute query with pagination
  const tasks = await Task.find(query)
    .populate('assignedTo', 'email name')
    .populate('createdBy', 'email name')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);
  
  res.json({
    success: true,
    count: tasks.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: tasks
  });
});

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private (Admin, Creator, or Assigned User)
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'email name')
    .populate('createdBy', 'email name');
  
  // Check if task exists
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  
  // Check if user is authorized to view this task
  if (
    req.user.role !== 'admin' && 
    task.assignedTo._id.toString() !== req.user._id.toString() &&
    task.createdBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access this task');
  }
  
  res.json({
    success: true,
    data: task
  });
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo } = req.body;
  
  // Check if assignedTo user exists
  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser) {
    res.status(400);
    throw new Error('Assigned user not found');
  }
  
  // Create task
  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    assignedTo,
    createdBy: req.user._id,
    documents: req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
      size: file.size
    })) : []
  });
  
  const populatedTask = await task.populate([
    { path: 'assignedTo', select: 'email name' },
    { path: 'createdBy', select: 'email name' }
  ]);
  
  res.status(201).json({
    success: true,
    data: populatedTask
  });
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private/Admin
const updateTask = asyncHandler(async (req, res) => {
  console.log('Update Task - Task ID:', req.params.id);
  console.log('Update Task - Request Body:', req.body);
  console.log('Update Task - Request Files:', req.files && req.files.length ? `${req.files.length} files received` : 'No files');
  console.log('Update Task - User Role:', req.user.role);
  
  let task = await Task.findById(req.params.id);
  
  // Check if task exists
  if (!task) {
    console.log('Update Task - Task not found');
    res.status(404);
    throw new Error('Task not found');
  }
  
  // Check if assigned user exists if being updated
  if (req.body.assignedTo) {
    console.log('Update Task - Checking assignedTo user:', req.body.assignedTo);
    const assignedUser = await User.findById(req.body.assignedTo);
    if (!assignedUser) {
      console.log('Update Task - Assigned user not found');
      res.status(400);
      throw new Error('Assigned user not found');
    }
    console.log('Update Task - Assigned user found:', assignedUser.email);
  }
  
  // Process removed files if any
  let documents = task.documents || [];
  if (req.body.removedFiles) {
    try {
      const removedFileIds = JSON.parse(req.body.removedFiles);
      console.log('Update Task - Removing files:', removedFileIds);
      
      // Remove files from storage and documents array
      documents = documents.filter(doc => {
        if (removedFileIds.includes(doc._id.toString())) {
          try {
            fs.unlinkSync(doc.path);
            console.log('Update Task - Removed file from storage:', doc.path);
          } catch (err) {
            console.error('Error removing file:', err);
          }
          return false;
        }
        return true;
      });
    } catch (err) {
      console.error('Error processing removed files:', err);
    }
  }
  
  // Process uploaded files if any
  if (req.files && req.files.length > 0) {
    console.log('Update Task - Processing uploaded files, count:', req.files.length);
    const newDocuments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
      size: file.size
    }));
    
    // Combine existing and new documents
    documents = [...documents, ...newDocuments];
    
    // Ensure max 3 documents
    if (documents.length > 3) {
      // Remove excess files from storage
      for (let i = 3; i < documents.length; i++) {
        try {
          fs.unlinkSync(documents[i].path);
        } catch (err) {
          console.error('Error removing file:', err);
        }
      }
      documents = documents.slice(0, 3);
    }
  }
  
  // Create update object with received fields
  const updateData = {
    documents,
  };

  // Task fields we want to update  
  const fieldNames = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo'];
  
  // Process each field if it was provided in the request
  fieldNames.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
      console.log(`Update Task - Setting ${field}:`, req.body[field]);
    }
  });
  
  console.log('Update Task - Final update data:', JSON.stringify(updateData));
  
  try {
    // Update task
    task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'email name').populate('createdBy', 'email name');
    
    console.log('Update Task - Updated task:', task ? 'success' : 'failed');
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Update Task - Error:', error.message);
    res.status(500);
    throw new Error(`Failed to update task: ${error.message}`);
  }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  
  // Check if task exists
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  
  // Delete documents from storage
  if (task.documents && task.documents.length > 0) {
    task.documents.forEach(doc => {
      try {
        fs.unlinkSync(doc.path);
      } catch (err) {
        console.error('Error removing file:', err);
      }
    });
  }
  
  await Task.deleteOne({ _id: task._id });
  
  res.json({
    success: true,
    message: 'Task removed'
  });
});

// @desc    Download a document
// @route   GET /api/tasks/:id/documents/:docId
// @access  Private (Admin, Creator, or Assigned User)
const downloadDocument = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'email name')
    .populate('createdBy', 'email name');
  
  // Check if task exists
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  
  // Check if user is authorized to view this task
  if (
    req.user.role !== 'admin' && 
    task.assignedTo._id.toString() !== req.user._id.toString() &&
    task.createdBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access this task');
  }
  
  // Find the document in the task
  const document = task.documents.find(doc => doc._id.toString() === req.params.docId);
  
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  
  // Send file
  res.download(document.path, document.originalName);
});

// @desc    Update task status with note
// @route   PATCH /api/tasks/:id/status
// @access  Private (Admin, Creator, or Assigned User)
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  
  if (!status || !note) {
    res.status(400);
    throw new Error('Status and note are required');
  }
  
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'email name')
    .populate('createdBy', 'email name');
  
  // Check if task exists
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  
  // Check if user is authorized to update this task
  if (
    req.user.role !== 'admin' && 
    task.assignedTo._id.toString() !== req.user._id.toString() &&
    task.createdBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }
  
  // Update task status and note
  task.status = status;
  task.note = note;
  
  const updatedTask = await task.save();
  
  // Create notification for task creator if they are not the one updating
  if (task.createdBy._id.toString() !== req.user._id.toString()) {
    // Here you would typically create a notification in your notification system
    // For now, we'll just return the updated task
  }
  
  res.json({
    success: true,
    data: updatedTask
  });
});

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  downloadDocument,
  updateTaskStatus
}; 