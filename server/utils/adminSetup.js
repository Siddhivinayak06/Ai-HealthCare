const User = require('../models/User');
const { setupPredefinedModels } = require('./ml/modelSetup');

/**
 * Set up an admin user if one doesn't exist already
 * @returns {Promise<Object|null>} The admin user object or null if already exists
 */
async function setupAdminUser() {
  try {
    // Check if any admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return null;
    }
    
    // Create a new admin user
    const adminUser = await User.create({
      name: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@aihealthcare.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      active: true,
    });
    
    console.log(`Admin user created with email: ${adminUser.email}`);
    
    // Set up predefined ML models with this admin user
    await setupPredefinedModels(adminUser._id);
    
    return adminUser;
  } catch (error) {
    console.error('Error setting up admin user:', error);
    throw error;
  }
}

module.exports = {
  setupAdminUser,
}; 