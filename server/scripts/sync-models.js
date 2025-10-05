const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
const { syncModels } = require('../utils/modelUtils');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-healthcare')
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Find admin user for model creation
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        console.log('No admin user found. Please create an admin user first.');
        mongoose.connection.close();
        return;
      }
      
      console.log(`Found admin user: ${adminUser.email}`);
      
      // Use the utility to sync models
      const syncCount = await syncModels(adminUser._id);
      
      console.log(`${syncCount} models synced successfully!`);
    } catch (error) {
      console.error('Error syncing models:', error);
    } finally {
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 