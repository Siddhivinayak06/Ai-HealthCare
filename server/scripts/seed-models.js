require('dotenv').config({ path: '../config/.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const MLModel = require('../models/MLModel');

console.log('Starting seed script...');
console.log('Environment variables loaded from:', '../config/.env');

// Get MongoDB URI from environment or use a default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-healthcare';

console.log('Using MongoDB URI:', MONGODB_URI);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function seedModels() {
  try {
    console.log('Checking for existing models...');
    // First, check if we already have models in the database
    const existingModels = await MLModel.countDocuments();
    
    if (existingModels > 0) {
      console.log(`Database already has ${existingModels} models. Skipping seed operation.`);
      return;
    }

    console.log('Looking for an admin user...');
    // Find an admin user to set as creator
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.error('No admin user found in the database. Please create an admin user first.');
      process.exit(1);
    }
    
    console.log(`Found admin user: ${adminUser.email}`);

    // Sample ML models
    const sampleModels = [
      // X-ray Models
      {
        name: 'Chest X-ray Classifier',
        version: '1.0',
        description: 'AI model for detecting pneumonia, tuberculosis, and other common chest conditions from X-ray images.',
        modelType: 'classification',
        applicableBodyParts: ['chest', 'lungs'],
        applicableImagingTypes: ['xray'],
        conditions: ['Normal', 'Pneumonia', 'Tuberculosis', 'COVID-19'],
        modelPath: '/ml-models/xray-model',
        inputShape: {
          width: 224,
          height: 224,
          channels: 3,
        },
        preprocessingSteps: ['resize', 'normalize'],
        performance: {
          accuracy: 92.5,
          precision: 91.3,
          recall: 89.7,
          f1Score: 90.5,
        },
        trainedOn: {
          datasetName: 'ChestX-ray14',
          datasetSize: 112120,
          trainDate: new Date('2023-01-15'),
        },
        createdBy: adminUser._id,
        isActive: true,
      },
      
      // MRI Models
      {
        name: 'Brain MRI Classifier',
        version: '1.2',
        description: 'Advanced neural network for detecting brain tumors and other abnormalities from MRI scans.',
        modelType: 'classification',
        applicableBodyParts: ['brain', 'head'],
        applicableImagingTypes: ['mri'],
        conditions: ['Normal', 'Glioma', 'Meningioma', 'Pituitary Tumor'],
        modelPath: '/ml-models/mri-model',
        inputShape: {
          width: 256,
          height: 256,
          channels: 3,
        },
        preprocessingSteps: ['resize', 'normalize', 'augment'],
        performance: {
          accuracy: 94.7,
          precision: 93.5,
          recall: 92.8,
          f1Score: 93.1,
        },
        trainedOn: {
          datasetName: 'Brain Tumor MRI Dataset',
          datasetSize: 7023,
          trainDate: new Date('2023-03-22'),
        },
        createdBy: adminUser._id,
        isActive: true,
      },
      
      // CT Scan Models
      {
        name: 'Lung CT Classifier',
        version: '1.1',
        description: 'Model for detecting lung cancer and other pulmonary conditions from CT scans.',
        modelType: 'classification',
        applicableBodyParts: ['chest', 'lungs'],
        applicableImagingTypes: ['ct'],
        conditions: ['Normal', 'Lung Cancer', 'Emphysema', 'Fibrosis'],
        modelPath: '/ml-models/ct-model',
        inputShape: {
          width: 256,
          height: 256,
          channels: 3,
        },
        preprocessingSteps: ['resize', 'normalize', 'denoise'],
        performance: {
          accuracy: 89.3,
          precision: 87.6,
          recall: 86.9,
          f1Score: 87.2,
        },
        trainedOn: {
          datasetName: 'LIDC-IDRI',
          datasetSize: 1018,
          trainDate: new Date('2023-04-10'),
        },
        createdBy: adminUser._id,
        isActive: true,
      },
    ];

    console.log('Preparing to insert models...');
    // Insert models into the database
    await MLModel.insertMany(sampleModels);
    
    console.log(`Successfully added ${sampleModels.length} ML models to the database.`);
  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the seed function
seedModels(); 