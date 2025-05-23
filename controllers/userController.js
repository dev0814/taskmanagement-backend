const User = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all users with pagination and filtering
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // Build query
  const query = {};
  
  // Apply email filter if provided
  if (req.query.email) {
    query.email = { $regex: req.query.email, $options: 'i' };
  }
  
  // Apply role filter if provided
  if (req.query.role) {
    query.role = req.query.role;
  }
  
  // Get total count for pagination
  const total = await User.countDocuments(query);
  
  // Execute query with pagination
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  res.json({
    success: true,
    count: users.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: users
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin or Owner
const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    // Check if user is authorized to view this user
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this user');
    }
    
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(404);
      throw new Error('Invalid user ID');
    }
    throw error;
  }
});

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  
  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });
  
  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin or Owner
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Only admins can update roles
  if (req.body.role && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to change role');
  }
  
  // Update fields
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  
  // Only update password if provided
  if (req.body.password) {
    user.password = req.body.password;
  }
  
  // Only update role if provided and requester is admin
  if (req.body.role && req.user.role === 'admin') {
    user.role = req.body.role;
  }
  
  const updatedUser = await user.save();
  
  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  await User.deleteOne({ _id: user._id });
  
  res.json({
    success: true,
    message: 'User removed'
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
}; 