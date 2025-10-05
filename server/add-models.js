const mongoose = require('mongoose');
const User = require('./models/User');
const MLModel = require('./models/MLModel');

console.log('Starting direct model creation script...');

// Connect to MongoDB directly
mongoose.connect('mongodb://localhost:27017/ai-healthcare')
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Check for existing models
      const existingModels = await MLModel.countDocuments();
      console.log(`Found ${existingModels} existing models`);
      
      if (existingModels > 0) {
        console.log('Models already exist. Skipping creation.');
        mongoose.connection.close();
        return;
      }
      
      // Find admin user
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        console.log('No admin user found. Please create an admin user first.');
        mongoose.connection.close();
        return;
      }
      
      console.log(`Found admin user: ${adminUser.email}`);
      
      // Create X-ray model
      const xrayModel = new MLModel({
        name: 'Chest X-ray Classifier',
        version: '1.0',
        description: 'AI model for detecting pneumonia, tuberculosis, and other conditions from X-ray images.',
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
      });
      
      console.log('Saving X-ray model...');
      await xrayModel.save();
      console.log('X-ray model saved successfully');
      
      // Create MRI model
      const mriModel = new MLModel({
        name: 'Brain MRI Classifier',
        version: '1.2',
        description: 'Advanced neural network for detecting brain tumors and other abnormalities.',
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
      });
      
      console.log('Saving MRI model...');
      await mriModel.save();
      console.log('MRI model saved successfully');
      
      // Create CT model
      const ctModel = new MLModel({
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
      });
      
      console.log('Saving CT model...');
      await ctModel.save();
      console.log('CT model saved successfully');
      
      console.log('All models created successfully!');
    } catch (error) {
      console.error('Error creating models:', error);
    } finally {
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 