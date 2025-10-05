const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const MLModel = require('../../models/MLModel');
const TrainingJob = require('../../models/JobModel');

// Directory for training data
const TRAINING_DATA_DIR = path.join(__dirname, '../../training-data');

/**
 * Ensure training directories exist
 * @param {string} datasetName - Name of the dataset
 */
function ensureTrainingDirectories(datasetName) {
  const dirs = [
    TRAINING_DATA_DIR,
    path.join(TRAINING_DATA_DIR, datasetName),
    path.join(TRAINING_DATA_DIR, datasetName, 'train'),
    path.join(TRAINING_DATA_DIR, datasetName, 'validation'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Create a classification model architecture
 * @param {Object} config - Model configuration
 * @returns {tf.LayersModel} - The TensorFlow.js model
 */
function createClassificationModel(config) {
  const { inputShape, numClasses, modelArchitecture } = config;
  
  // Create a sequential model
  const model = tf.sequential();
  
  // Input layer
  if (modelArchitecture === 'simple') {
    // Simple MLP model (for testing or very basic classification)
    model.add(tf.layers.flatten({ inputShape }));
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  } 
  else if (modelArchitecture === 'mobilenet') {
    // MobileNet-inspired architecture (lightweight CNN)
    // First convolutional block
    model.add(tf.layers.conv2d({
      inputShape,
      filters: 32,
      kernelSize: 3,
      strides: 2,
      padding: 'same',
      activation: 'relu'
    }));
    model.add(tf.layers.batchNormalization());
    
    // Depthwise separable convolution blocks (MobileNet style)
    const addDepthwiseSeparableConv = (filters, strides) => {
      // Depthwise convolution
      model.add(tf.layers.depthwiseConv2d({
        kernelSize: 3,
        strides,
        padding: 'same',
        activation: 'relu'
      }));
      model.add(tf.layers.batchNormalization());
      
      // Pointwise convolution
      model.add(tf.layers.conv2d({
        filters,
        kernelSize: 1,
        strides: 1,
        padding: 'same',
        activation: 'relu'
      }));
      model.add(tf.layers.batchNormalization());
    };
    
    // Add several depthwise separable convolution blocks
    addDepthwiseSeparableConv(64, 1);
    addDepthwiseSeparableConv(128, 2);
    addDepthwiseSeparableConv(128, 1);
    addDepthwiseSeparableConv(256, 2);
    addDepthwiseSeparableConv(256, 1);
    addDepthwiseSeparableConv(512, 2);
    
    // Add global average pooling and dense layers
    model.add(tf.layers.globalAveragePooling2d());
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  }
  else {
    // Default: A VGG-style CNN
    model.add(tf.layers.conv2d({
      inputShape,
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
    
    model.add(tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
    
    model.add(tf.layers.conv2d({
      filters: 128,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
    
    model.add(tf.layers.conv2d({
      filters: 256,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
    
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 512, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  }
  
  // Compile the model
  model.compile({
    optimizer: tf.train.adam(0.0001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  
  return model;
}

/**
 * Load and preprocess an image for training
 * @param {string} imagePath - Path to the image
 * @param {Object} options - Preprocessing options
 * @returns {tf.Tensor3D} - Preprocessed image tensor
 */
async function loadAndPreprocessImage(imagePath, options) {
  try {
    const { width, height, channels } = options;
    
    // Read and resize the image using sharp
    let imageProcessor = sharp(imagePath)
      .resize(width, height, { fit: 'fill' });
      
    // Convert to grayscale if channels is 1
    if (channels === 1) {
      imageProcessor = imageProcessor.grayscale();
    }
    
    // Get the pixel data as Buffer
    const imageBuffer = await imageProcessor.raw().toBuffer();
    
    // Create a tensor from the raw pixel data
    let imageTensor;
    if (channels === 1) {
      // For grayscale images
      imageTensor = tf.tensor3d(
        new Float32Array(imageBuffer),
        [height, width, 1]
      );
    } else {
      // For RGB images
      imageTensor = tf.tensor3d(
        new Float32Array(imageBuffer),
        [height, width, channels]
      );
    }
    
    // Normalize the pixel values to [0, 1]
    return imageTensor.div(tf.scalar(255));
  } catch (error) {
    console.error('Error loading and preprocessing image:', error);
    throw error;
  }
}

/**
 * Generate image data generator for training
 * @param {string} dataDir - Directory containing training images
 * @param {Array<string>} classes - Array of class folder names
 * @param {Object} options - Preprocessing options
 * @param {number} batchSize - Batch size
 * @returns {AsyncGenerator} - Generator that yields batches of images and labels
 */
async function* imageDataGenerator(dataDir, classes, options, batchSize) {
  const { width, height, channels } = options;
  
  while (true) {
    // Arrays to hold the current batch
    const batchImages = [];
    const batchLabels = [];
    
    // Fill the batch
    for (let i = 0; i < batchSize; i++) {
      // Pick a random class
      const classIndex = Math.floor(Math.random() * classes.length);
      const className = classes[classIndex];
      
      // Get list of image files for this class
      const classDir = path.join(dataDir, className);
      const imageFiles = fs.readdirSync(classDir)
        .filter(file => file.match(/\.(jpg|jpeg|png)$/i));
      
      if (imageFiles.length === 0) {
        continue; // Skip if no images found
      }
      
      // Pick a random image from this class
      const randomImageIndex = Math.floor(Math.random() * imageFiles.length);
      const imagePath = path.join(classDir, imageFiles[randomImageIndex]);
      
      // Load and preprocess the image
      try {
        const imageTensor = await loadAndPreprocessImage(imagePath, options);
        
        // Create one-hot encoded label
        const labelTensor = tf.oneHot(tf.scalar(classIndex, 'int32'), classes.length);
        
        // Add to batch
        batchImages.push(imageTensor);
        batchLabels.push(labelTensor);
      } catch (err) {
        console.warn(`Skipping image ${imagePath}: ${err.message}`);
      }
    }
    
    if (batchImages.length === 0) {
      throw new Error('No valid images found for training');
    }
    
    // Stack tensors into batches
    const xs = tf.stack(batchImages);
    const ys = tf.stack(batchLabels);
    
    // Yield the batch
    yield { xs, ys };
    
    // Clean up to avoid memory leaks
    xs.dispose();
    ys.dispose();
    batchImages.forEach(tensor => tensor.dispose());
    batchLabels.forEach(tensor => tensor.dispose());
  }
}

/**
 * Count the number of training examples in each class
 * @param {string} dataDir - Directory containing training images
 * @param {Array<string>} classes - Array of class folder names
 * @returns {Object} - Object mapping class names to counts
 */
function countTrainingExamples(dataDir, classes) {
  const counts = {};
  
  for (const className of classes) {
    const classDir = path.join(dataDir, className);
    if (fs.existsSync(classDir)) {
      const imageFiles = fs.readdirSync(classDir)
        .filter(file => file.match(/\.(jpg|jpeg|png)$/i));
      counts[className] = imageFiles.length;
    } else {
      counts[className] = 0;
    }
  }
  
  return counts;
}

/**
 * Train a model on a dataset
 * @param {Object} trainingConfig - Training configuration
 * @param {string} jobId - Training job ID for tracking
 * @returns {Promise<Object>} - Training results
 */
async function trainModel(trainingConfig, jobId) {
  try {
    const {
      datasetName,
      modelName,
      modelVersion,
      modelDescription,
      modelType,
      epochs,
      batchSize,
      validationSplit,
      inputShape,
      classNames,
      userId
    } = trainingConfig;
    
    // Ensure directories exist
    ensureTrainingDirectories(datasetName);
    
    // Determine paths
    const datasetDir = path.join(TRAINING_DATA_DIR, datasetName);
    const trainDir = path.join(datasetDir, 'train');
    const validationDir = path.join(datasetDir, 'validation');
    
    // Update job status to "training"
    await TrainingJob.findByIdAndUpdate(jobId, { status: 'training' });
    
    // Create the model architecture
    const model = createClassificationModel({
      inputShape,
      numClasses: classNames.length,
      modelArchitecture: trainingConfig.modelArchitecture || 'default'
    });
    
    // Count examples for reporting
    const trainCounts = countTrainingExamples(trainDir, classNames);
    const validationCounts = countTrainingExamples(validationDir, classNames);
    
    const totalTrainExamples = Object.values(trainCounts).reduce((sum, count) => sum + count, 0);
    const totalValidationExamples = Object.values(validationCounts).reduce((sum, count) => sum + count, 0);
    
    if (totalTrainExamples === 0) {
      throw new Error(`No training examples found in ${trainDir}`);
    }
    
    // Set up training data generator
    const trainGenerator = imageDataGenerator(
      trainDir,
      classNames,
      { width: inputShape[0], height: inputShape[1], channels: inputShape[2] },
      batchSize
    );
    
    // Set up validation data generator if validation data exists
    let validationGenerator = null;
    if (totalValidationExamples > 0) {
      validationGenerator = imageDataGenerator(
        validationDir,
        classNames,
        { width: inputShape[0], height: inputShape[1], channels: inputShape[2] },
        batchSize
      );
    }
    
    // Calculate steps per epoch
    const stepsPerEpoch = Math.ceil(totalTrainExamples / batchSize);
    const validationSteps = totalValidationExamples > 0 
      ? Math.ceil(totalValidationExamples / batchSize)
      : 0;
    
    // Initialize metrics
    let trainLoss = 0;
    let trainAcc = 0;
    let valLoss = 0;
    let valAcc = 0;
    
    // Training loop
    for (let epoch = 0; epoch < epochs; epoch++) {
      console.log(`Epoch ${epoch + 1}/${epochs}`);
      
      // Update job status with epoch progress
      await TrainingJob.findByIdAndUpdate(jobId, { 
        progress: { 
          current: epoch, 
          total: epochs,
          metrics: {
            trainLoss,
            trainAcc,
            valLoss,
            valAcc,
          }
        } 
      });
      
      // Training steps
      let epochLoss = 0;
      let epochAcc = 0;
      
      for (let step = 0; step < stepsPerEpoch; step++) {
        const { xs, ys } = await trainGenerator.next().value;
        
        // Train on batch
        const history = await model.trainOnBatch(xs, ys);
        
        epochLoss += history[0];
        epochAcc += history[1];
        
        // Clean up tensors
        xs.dispose();
        ys.dispose();
        
        // Log progress
        console.log(`Step ${step + 1}/${stepsPerEpoch} - loss: ${history[0].toFixed(4)} - acc: ${history[1].toFixed(4)}`);
      }
      
      // Calculate average metrics for the epoch
      trainLoss = epochLoss / stepsPerEpoch;
      trainAcc = epochAcc / stepsPerEpoch;
      
      // Validation steps
      if (validationGenerator && validationSteps > 0) {
        let valEpochLoss = 0;
        let valEpochAcc = 0;
        
        for (let step = 0; step < validationSteps; step++) {
          const { xs, ys } = await validationGenerator.next().value;
          
          // Evaluate on batch
          const valHistory = await model.evaluateOnBatch(xs, ys);
          
          valEpochLoss += valHistory[0];
          valEpochAcc += valHistory[1];
          
          // Clean up tensors
          xs.dispose();
          ys.dispose();
        }
        
        // Calculate average validation metrics
        valLoss = valEpochLoss / validationSteps;
        valAcc = valEpochAcc / validationSteps;
        
        console.log(`Validation - val_loss: ${valLoss.toFixed(4)} - val_acc: ${valAcc.toFixed(4)}`);
      }
    }
    
    // Save the model
    const modelDir = path.join(__dirname, '../../ml-models', `${modelType}-model`);
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    await model.save(`file://${modelDir}`);
    
    // Register the model in the database
    const modelData = {
      name: modelName,
      version: modelVersion,
      description: modelDescription,
      modelType: 'classification',
      applicableBodyParts: trainingConfig.applicableBodyParts,
      applicableImagingTypes: [modelType],
      conditions: classNames,
      modelPath: modelDir,
      inputShape: {
        width: inputShape[0],
        height: inputShape[1],
        channels: inputShape[2],
      },
      preprocessingSteps: [
        `resize(${inputShape[0]},${inputShape[1]})`,
        inputShape[2] === 1 ? 'grayscale' : '',
        'normalize(0,1)',
      ].filter(Boolean),
      performance: {
        accuracy: valAcc * 100 || trainAcc * 100,
        precision: 0, // Would need to calculate these separately
        recall: 0,    // Would need to calculate these separately
        f1Score: 0,   // Would need to calculate these separately
      },
      trainedOn: {
        datasetName,
        datasetSize: totalTrainExamples + totalValidationExamples,
        trainDate: new Date(),
      },
      createdBy: userId,
      isActive: true,
    };
    
    const newModel = await MLModel.create(modelData);
    
    // Update job status to "completed"
    await TrainingJob.findByIdAndUpdate(jobId, { 
      status: 'completed',
      modelId: newModel._id,
      completedAt: new Date(),
      performance: {
        trainLoss,
        trainAcc,
        valLoss,
        valAcc,
      }
    });
    
    return {
      model: newModel,
      metrics: {
        trainLoss,
        trainAcc,
        valLoss,
        valAcc,
      },
    };
  } catch (error) {
    console.error('Model training error:', error);
    
    // Update job status to "failed"
    await TrainingJob.findByIdAndUpdate(jobId, { 
      status: 'failed',
      error: error.message,
      completedAt: new Date()
    });
    
    throw error;
  }
}

module.exports = {
  trainModel,
  ensureTrainingDirectories,
  countTrainingExamples,
}; 