// This script manually syncs models without requiring the API endpoint
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { syncModels } = require('../utils/modelUtils');
const User = require('../models/User');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Show the current directory structure to debug
console.log('Current directory:', __dirname);
console.log('ML models directory:', path.resolve(__dirname, '../../ml-models'));

// List model directories
const modelsDir = path.resolve(__dirname, '../../ml-models');
const modelFolders = fs.readdirSync(modelsDir).filter(item => 
  fs.statSync(path.join(modelsDir, item)).isDirectory()
);
console.log('Found model folders:', modelFolders);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-healthcare')
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Find admin user for model creation
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        console.log('No admin user found. Creating a temporary admin user...');
        
        // Create a temporary admin user if none exists
        const tempAdmin = new User({
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'adminpassword123',
          role: 'admin',
          active: true
        });
        
        await tempAdmin.save();
        console.log('Temporary admin user created');
        
        // Use the new admin user for model syncing
        const syncCount = await syncModels(tempAdmin._id);
        console.log(`${syncCount} models synced successfully!`);
      } else {
        console.log(`Found admin user: ${adminUser.email}`);
        
        // Use the existing admin user for model syncing
        const syncCount = await syncModels(adminUser._id);
        console.log(`${syncCount} models synced successfully!`);
      }
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