// Not found error handler
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// General error handler
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    res.status(400);
    return res.json({
      success: false,
      message: 'Duplicate key error',
      error: `${Object.keys(err.keyValue)} already exists.`
    });
  }
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400);
    return res.json({
      success: false,
      message: 'Validation error',
      error: Object.values(err.errors).map(val => val.message)
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401);
    return res.json({
      success: false,
      message: 'Invalid token',
      error: 'Please login again'
    });
  }

  // General error response
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { notFound, errorHandler }; 