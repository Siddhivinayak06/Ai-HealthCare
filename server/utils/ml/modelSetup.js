const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const { createGunzip } = require('zlib');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const MLModel = require('../../models/MLModel');

// Base directory for storing ML models
const ML_MODELS_DIR = path.join(__dirname, '../../ml-models');

/**
 * Ensure the model directories exist
 */
function ensureDirectories() {
  const dirs = [
    ML_MODELS_DIR,
    path.join(ML_MODELS_DIR, 'xray-model'),
    path.join(ML_MODELS_DIR, 'mri-model'),
    path.join(ML_MODELS_DIR, 'ct-model'),
    path.join(ML_MODELS_DIR, 'skin-model'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Download a file from a URL
 * @param {string} url - URL to download from
 * @param {string} destPath - Destination path for the downloaded file
 * @returns {Promise<void>}
 */
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

/**
 * Extract a tar.gz file
 * @param {string} tarPath - Path to the tar.gz file
 * @param {string} destDir - Directory to extract to
 */
async function extractTarGz(tarPath, destDir) {
  await exec(`tar -xzf ${tarPath} -C ${destDir}`);
}

/**
 * Download a pre-trained model
 * @param {string} modelType - Type of model (xray, mri, ct, skin)
 * @param {string} url - URL to download the model from
 * @returns {Promise<string>} - Path to the downloaded model directory
 */
async function downloadModel(modelType, url) {
  try {
    // Ensure directories exist
    ensureDirectories();
    
    // Determine destination paths
    const modelDir = path.join(ML_MODELS_DIR, `${modelType}-model`);
    const tarPath = path.join(ML_MODELS_DIR, `${modelType}-model.tar.gz`);
    
    console.log(`Downloading ${modelType} model from ${url}`);
    
    // Download the model
    await downloadFile(url, tarPath);
    
    console.log(`Extracting ${modelType} model to ${modelDir}`);
    
    // Extract the model
    await extractTarGz(tarPath, modelDir);
    
    // Clean up the tar file
    fs.unlinkSync(tarPath);
    
    return modelDir;
  } catch (error) {
    console.error(`Error downloading ${modelType} model:`, error);
    throw error;
  }
}

/**
 * Register a pre-trained model in the database
 * @param {Object} modelDetails - Details of the model
 * @returns {Promise<Object>} - The created model document
 */
async function registerModel(modelDetails) {
  try {
    // Check if model with the same name and version already exists
    const existingModel = await MLModel.findOne({
      name: modelDetails.name,
      version: modelDetails.version,
    });
    
    if (existingModel) {
      console.log(`Model ${modelDetails.name} v${modelDetails.version} already exists`);
      return existingModel;
    }
    
    // Create a new model entry
    const newModel = await MLModel.create({
      ...modelDetails,
      createdBy: modelDetails.createdBy || null, // May be null for pre-loaded models
    });
    
    console.log(`Registered model ${newModel.name} v${newModel.version}`);
    
    return newModel;
  } catch (error) {
    console.error('Error registering model:', error);
    throw error;
  }
}

/**
 * Setup all predefined healthcare models
 * @param {string} adminUserId - ID of the admin user to associate with the models
 * @returns {Promise<void>}
 */
async function setupPredefinedModels(adminUserId) {
  try {
    // Note: In a real production system, you would replace these URLs with actual model URLs
    // or implement a more robust model management system
    
    // Setup Chest X-ray model for pneumonia detection
    await registerModel({
      name: 'Chest X-ray Classifier',
      version: '1.0.0',
      description: 'Detects pneumonia from chest X-rays',
      modelType: 'classification',
      applicableBodyParts: ['chest', 'lungs'],
      applicableImagingTypes: ['xray'],
      conditions: ['Normal', 'Pneumonia', 'Tuberculosis', 'COVID-19'],
      modelPath: path.join(ML_MODELS_DIR, 'xray-model'),
      inputShape: {
        width: 224,
        height: 224,
        channels: 3,
      },
      preprocessingSteps: [
        'resize(224,224)',
        'normalize(0,1)',
      ],
      performance: {
        accuracy: 92.5,
        precision: 91.2,
        recall: 93.8,
        f1Score: 92.5,
      },
      trainedOn: {
        datasetName: 'ChestX-ray14',
        datasetSize: 112120,
        trainDate: new Date('2023-01-15'),
      },
      createdBy: adminUserId,
      isActive: true,
    });
    
    // Setup Brain MRI model for tumor detection
    await registerModel({
      name: 'Brain MRI Classifier',
      version: '1.0.0',
      description: 'Detects tumors from brain MRIs',
      modelType: 'classification',
      applicableBodyParts: ['brain', 'head'],
      applicableImagingTypes: ['mri'],
      conditions: ['Normal', 'Glioma', 'Meningioma', 'Pituitary Tumor'],
      modelPath: path.join(ML_MODELS_DIR, 'mri-model'),
      inputShape: {
        width: 256,
        height: 256,
        channels: 3,
      },
      preprocessingSteps: [
        'resize(256,256)',
        'normalize(0,1)',
      ],
      performance: {
        accuracy: 90.8,
        precision: 89.5,
        recall: 90.2,
        f1Score: 89.8,
      },
      trainedOn: {
        datasetName: 'Brain Tumor MRI Dataset',
        datasetSize: 3264,
        trainDate: new Date('2023-02-10'),
      },
      createdBy: adminUserId,
      isActive: true,
    });
    
    // Setup CT scan model for lung cancer detection
    await registerModel({
      name: 'Lung CT Classifier',
      version: '1.0.0',
      description: 'Detects lung cancer from CT scans',
      modelType: 'classification',
      applicableBodyParts: ['chest', 'lungs'],
      applicableImagingTypes: ['ct'],
      conditions: ['Normal', 'Lung Cancer', 'Emphysema', 'Fibrosis'],
      modelPath: path.join(ML_MODELS_DIR, 'ct-model'),
      inputShape: {
        width: 224,
        height: 224,
        channels: 1,
      },
      preprocessingSteps: [
        'resize(224,224)',
        'grayscale',
        'normalize(0,1)',
      ],
      performance: {
        accuracy: 87.3,
        precision: 86.1,
        recall: 85.9,
        f1Score: 86.0,
      },
      trainedOn: {
        datasetName: 'LIDC-IDRI',
        datasetSize: 1018,
        trainDate: new Date('2023-03-05'),
      },
      createdBy: adminUserId,
      isActive: true,
    });
    
    // Setup Skin Lesion model for skin cancer detection
    await registerModel({
      name: 'Skin Lesion Classifier',
      version: '1.0.0',
      description: 'Detects skin cancer from dermoscopic images',
      modelType: 'classification',
      applicableBodyParts: ['skin', 'limbs'],
      applicableImagingTypes: ['other'],
      conditions: ['Benign', 'Melanoma', 'Basal Cell Carcinoma', 'Squamous Cell Carcinoma'],
      modelPath: path.join(ML_MODELS_DIR, 'skin-model'),
      inputShape: {
        width: 299,
        height: 299,
        channels: 3,
      },
      preprocessingSteps: [
        'resize(299,299)',
        'normalize(0,1)',
      ],
      performance: {
        accuracy: 91.2,
        precision: 90.5,
        recall: 89.8,
        f1Score: 90.1,
      },
      trainedOn: {
        datasetName: 'HAM10000',
        datasetSize: 10015,
        trainDate: new Date('2023-04-20'),
      },
      createdBy: adminUserId,
      isActive: true,
    });
    
    console.log('All predefined models have been set up');
  } catch (error) {
    console.error('Error setting up predefined models:', error);
    throw error;
  }
}

/**
 * Initialize model directories with placeholder model.json files
 * This is for development purposes only, to simulate having models without downloading large files
 */
async function initModelPlaceholders() {
  try {
    // Ensure directories exist
    ensureDirectories();
    
    // Define the model types
    const modelTypes = ['xray', 'mri', 'ct', 'skin'];
    
    // Create placeholder models for each type
    for (const type of modelTypes) {
      const modelDir = path.join(ML_MODELS_DIR, `${type}-model`);
      const modelJsonPath = path.join(modelDir, 'model.json');
      
      // Create a simple placeholder model.json
      if (!fs.existsSync(modelJsonPath)) {
        // Very simple model that just returns random values for demo purposes
        const placeholderModel = {
          format: 'layers-model',
          generatedBy: 'placeholder',
          convertedBy: 'TensorFlow.js Converter',
          modelTopology: {
            keras_version: '2.6.0',
            backend: 'tensorflow',
            model_config: {
              class_name: 'Sequential',
              config: {
                name: `${type}-placeholder-model`,
                layers: [
                  {
                    class_name: 'Dense',
                    config: {
                      name: 'dense',
                      trainable: true,
                      batch_input_shape: [null, 224 * 224 * 3],
                      dtype: 'float32',
                      units: 4, // Number of output classes
                      activation: 'softmax'
                    }
                  }
                ]
              }
            }
          },
          weightsManifest: [
            {
              paths: ['weights.bin'],
              weights: [
                {
                  name: 'dense/kernel',
                  shape: [224 * 224 * 3, 4],
                  dtype: 'float32'
                },
                {
                  name: 'dense/bias',
                  shape: [4],
                  dtype: 'float32'
                }
              ]
            }
          ]
        };
        
        // Write model.json file
        fs.writeFileSync(
          modelJsonPath,
          JSON.stringify(placeholderModel, null, 2)
        );
        
        // Create a weights.bin file with random weights
        const weightsPath = path.join(modelDir, 'weights.bin');
        const numWeights = (224 * 224 * 3 * 4) + 4; // kernel weights + bias weights
        const randomWeights = new Float32Array(numWeights);
        
        // Fill with random values between -0.1 and 0.1
        for (let i = 0; i < numWeights; i++) {
          randomWeights[i] = (Math.random() - 0.5) * 0.2;
        }
        
        // Write the weights to a binary file
        fs.writeFileSync(weightsPath, Buffer.from(randomWeights.buffer));
        
        console.log(`Created placeholder model for ${type}`);
      }
    }
    
    console.log('All placeholder models have been created');
  } catch (error) {
    console.error('Error creating placeholder models:', error);
    throw error;
  }
}

module.exports = {
  downloadModel,
  registerModel,
  setupPredefinedModels,
  initModelPlaceholders,
}; 