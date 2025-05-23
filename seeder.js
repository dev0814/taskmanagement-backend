require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Task = require('./models/taskModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Sample users
const users = [
  {
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  },
  {
    email: 'user@example.com',
    password: 'password123',
    role: 'user'
  }
];

// Function to import data
const importData = async () => {
  try {
    // Clean existing data
    await Task.deleteMany();
    await User.deleteMany();

    // Add users
    const createdUsers = await User.create(users);
    const adminUser = createdUsers[0];
    const regularUser = createdUsers[1];

    // Create sample tasks
    const tasks = [
      {
        title: 'Build REST API',
        description: 'Create a RESTful API using Node.js and Express',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        assignedTo: regularUser._id,
        createdBy: adminUser._id
      },
      {
        title: 'Design UI Components',
        description: 'Design reusable UI components for the frontend',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        assignedTo: regularUser._id,
        createdBy: adminUser._id
      },
      {
        title: 'Set up Authentication',
        description: 'Implement JWT authentication on both frontend and backend',
        status: 'completed',
        priority: 'high',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        assignedTo: regularUser._id,
        createdBy: adminUser._id
      }
    ];

    await Task.create(tasks);

    console.log('Data imported successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Function to destroy data
const destroyData = async () => {
  try {
    await Task.deleteMany();
    await User.deleteMany();

    console.log('Data destroyed successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Execute based on command
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
} 