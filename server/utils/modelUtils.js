const fs = require('fs');
const path = require('path');
const MLModel = require('../models/MLModel');

/**
 * Validates that a model path exists on the filesystem
 * @param {string} modelPath - Path to check
 * @returns {boolean} - Whether the model exists
 */
const validateModelPath = (modelPath) => {
  // Remove leading slash if present
  const cleanPath = modelPath.startsWith('/') ? modelPath.substring(1) : modelPath;
  
  // Check if path is within ml-models directory
  const fullPath = path.resolve(
    __dirname, 
    '../../',  // Go up to project root
    cleanPath.includes('ml-models') ? cleanPath : `ml-models/${cleanPath}`
  );
  
  // Check if model.json exists
  const modelJsonPath = path.join(fullPath, 'model.json');
  return fs.existsSync(modelJsonPath);
};

/**
 * Gets the full filesystem path for a model
 * @param {string} modelPath - The stored model path
 * @returns {string} - Full system path to the model directory
 */
const getFullModelPath = (modelPath) => {
  const cleanPath = modelPath.startsWith('/') ? modelPath.substring(1) : modelPath;
  
  return path.resolve(
    __dirname, 
    '../../', 
    cleanPath.includes('ml-models') ? cleanPath : `ml-models/${cleanPath}`
  );
};

/**
 * Syncs database models with filesystem models
 * @returns {Promise<number>} - Number of synced models
 */
const syncModels = async (adminUserId) => {
  try {
    // Check if admin user ID is provided
    if (!adminUserId) {
      throw new Error('Admin user ID is required for model sync');
    }
    
    // Base path for ML models
    const modelsBasePath = path.join(__dirname, '../../ml-models');
    let syncCount = 0;
    
    // Get all model directories
    const modelDirs = fs.readdirSync(modelsBasePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // Process each model directory
    for (const modelDir of modelDirs) {
      const modelPath = path.join(modelsBasePath, modelDir);
      const modelJsonPath = path.join(modelPath, 'model.json');
      
      // Skip if no model.json exists
      if (!fs.existsSync(modelJsonPath)) continue;
      
      try {
        // Read and parse model.json
        const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
        const metadata = modelJson.metadata || {};
        
        // Map model type from directory name
        let imagingType = 'other';
        if (modelDir.includes('xray')) imagingType = 'xray';
        else if (modelDir.includes('mri')) imagingType = 'mri';
        else if (modelDir.includes('ct')) imagingType = 'ct';
        else if (modelDir.includes('ultrasound')) imagingType = 'ultrasound';
        
        // Get model name
        const modelName = metadata.description ? 
          metadata.description.split(' for ')[0] : 
          modelDir.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        // Check if model already exists in DB
        const existingModel = await MLModel.findOne({
          name: modelName,
          applicableImagingTypes: imagingType
        });
        
        if (existingModel) {
          // Update existing model
          existingModel.description = metadata.description || existingModel.description;
          existingModel.modelType = metadata.modelType || existingModel.modelType;
          existingModel.conditions = metadata.labels || existingModel.conditions;
          existingModel.inputShape = metadata.inputShape || existingModel.inputShape;
          existingModel.performance.accuracy = metadata.accuracy || existingModel.performance.accuracy;
          existingModel.modelPath = `/${modelDir}`;
          
          await existingModel.save();
          syncCount++;
        } else {
          // Create model body parts based on imaging type
          let bodyParts = ['general'];
          if (imagingType === 'xray' || imagingType === 'ct') bodyParts = ['chest', 'lungs'];
          else if (modelDir.includes('brain')) bodyParts = ['brain', 'head'];
          
          // Create new model
          const newModel = new MLModel({
            name: modelName,
            version: '1.0',
            description: metadata.description || `AI model for ${modelDir}`,
            modelType: metadata.modelType || 'classification',
            applicableBodyParts: bodyParts,
            applicableImagingTypes: [imagingType],
            conditions: metadata.labels || [],
            modelPath: `/${modelDir}`,
            inputShape: metadata.inputShape || {
              width: 224,
              height: 224,
              channels: 3,
            },
            preprocessingSteps: ['resize', 'normalize'],
            performance: {
              accuracy: metadata.accuracy || 85,
            },
            trainedOn: {
              datasetName: `${imagingType.toUpperCase()} Dataset`,
              datasetSize: 1000,
              trainDate: new Date(),
            },
            createdBy: adminUserId,
            isActive: true,
          });
          
          await newModel.save();
          syncCount++;
        }
      } catch (err) {
        console.error(`Error processing model ${modelDir}:`, err);
      }
    }
    
    return syncCount;
  } catch (error) {
    console.error('Error syncing models:', error);
    throw error;
  }
};

module.exports = {
  validateModelPath,
  getFullModelPath,
  syncModels
}; 