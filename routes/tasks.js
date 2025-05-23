const express = require('express');
const router = express.Router();
const { 
  getTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask,
  downloadDocument,
  updateTaskStatus
} = require('../controllers/taskController');
const { protect, admin, isOwnerOrAdmin } = require('../middleware/authMiddleware');
const { uploadDocuments } = require('../middleware/uploadMiddleware');

// @route   GET /api/tasks
// @access  Private/Admin
router.get('/', protect, admin, getTasks);

// @route   POST /api/tasks
// @access  Private/Admin
router.post('/', protect, admin, uploadDocuments, createTask);

// @route   GET /api/tasks/:id
// @access  Private (Admin, Creator, or Assigned User)
router.get('/:id', protect, getTaskById);

// @route   PUT /api/tasks/:id
// @access  Private/Admin
router.put('/:id', protect, admin, uploadDocuments, updateTask);

// @route   DELETE /api/tasks/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteTask);

// @route   GET /api/tasks/:id/documents/:docId
// @access  Private (Admin, Creator, or Assigned User)
router.get('/:id/documents/:docId', protect, downloadDocument);

// @route   PATCH /api/tasks/:id/status
// @access  Private (Admin, Creator, or Assigned User)
router.patch('/:id/status', protect, updateTaskStatus);

module.exports = router; 