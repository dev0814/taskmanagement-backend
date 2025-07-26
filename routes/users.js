const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');
const { 
  protect, 
  admin, 
  isOwnerOrAdmin 
} = require('../middleware/authMiddleware');

// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, admin, getUsers);

// @route   POST /api/users
// @access  Private/Admin
router.post('/', protect, admin, createUser);

// @route   GET /api/users/:id
// @access  Private/Admin or Owner
router.get('/:id', protect, isOwnerOrAdmin, getUserById);

// @route   PUT /api/users/:id
// @access  Private/Admin or Owner
router.put('/:id', protect, isOwnerOrAdmin, updateUser);

// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteUser);

module.exports = router; 