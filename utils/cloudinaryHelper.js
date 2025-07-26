/**
 * Format Cloudinary file information to match our document schema
 * @param {Object} file - The file object from multer
 * @returns {Object} - Formatted file object for our document schema
 */
const formatCloudinaryFile = (file) => {
  return {
    filename: file.filename || file.key || file.public_id,
    originalName: file.originalname,
    mimetype: file.mimetype,
    path: file.path, // Cloudinary URL
    url: file.path, // Duplicate for clarity
    cloudinaryId: file.public_id || file.filename, // Store Cloudinary public_id
    size: file.size
  };
};

module.exports = {
  formatCloudinaryFile
};