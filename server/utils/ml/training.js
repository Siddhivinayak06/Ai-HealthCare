const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');
const TrainingJob = require('../../models/JobModel');
const Dataset = require('../../models/Dataset');
const MLModel = require('../../models/MLModel');

// Map of active training jobs
const activeJobs = new Map();

/**
 * Initialize training service
 */
async function initializeTrainingService() {
  console.log('Initializing ML training service...');
  
  try {
    // Check if TrainingJob model is properly loaded
    if (!TrainingJob || typeof TrainingJob.updateMany !== 'function') {
      console.warn('TrainingJob model is not properly loaded. Skipping job status updates.');
      return;
    }
    
    // Find all pending/preparing/training jobs and mark them as failed
    // This handles cases where server was restarted during training
    await TrainingJob.updateMany(
      { status: { $in: ['pending', 'preparing', 'training'] } },
      { 
        status: 'failed',
        failureReason: 'Server restarted during processing',
        updatedAt: new Date()
      }
    );
    
    console.log('ML training service initialized successfully');
  } catch (error) {
    console.error('Error initializing ML training service:', error);
  }
}

/**
 * Start a training job
 * @param {string} jobId - Training job ID
 * @returns {Promise<void>}
 */
async function startTrainingJob(jobId) {
  try {
    // Check if TrainingJob model is properly loaded
    if (!TrainingJob || typeof TrainingJob.findById !== 'function') {
      throw new Error('TrainingJob model is not properly loaded. Cannot start training job.');
    }
    
    // Get job details
    const job = await TrainingJob.findById(jobId);
    if (!job) {
      throw new Error(`Training job ${jobId} not found`);
    }
    
    if (job.status !== 'pending') {
      throw new Error(`Training job ${jobId} is not in pending status`);
    }
    
    // Update job status to preparing
    job.status = 'preparing';
    job.startedAt = new Date();
    job.updatedAt = new Date();
    await job.save();
    
    // Get dataset details
    const dataset = await Dataset.findById(job.datasetId);
    if (!dataset) {
      throw new Error(`Dataset ${job.datasetId} not found`);
    }
    
    // Start training process asynchronously
    trainModel(job, dataset).catch(error => {
      console.error(`Error in training job ${jobId}:`, error);
    });
    
    return job;
  } catch (error) {
    console.error(`Error starting training job ${jobId}:`, error);
    
    // Update job status to failed
    await TrainingJob.findByIdAndUpdate(jobId, {
      status: 'failed',
      failureReason: error.message,
      updatedAt: new Date()
    });
    
    throw error;
  }
}

/**
 * Train a model
 * @param {object} job - Training job document
 * @param {object} dataset - Dataset document
 * @returns {Promise<void>}
 */
async function trainModel(job, dataset) {
  try {
    const jobId = job._id.toString();
    
    // Create job tracker
    const jobTracker = {
      jobId,
      model: null,
      dataset: null,
      shouldCancel: false,
      progress: {
        current: 0,
        total: job.epochs,
      },
    };
    
    // Add to active jobs
    activeJobs.set(jobId, jobTracker);
    
    // Load and preprocess dataset
    await prepareDataset(job, dataset, jobTracker);
    
    // Build model
    await buildModel(job, jobTracker);
    
    // Train model
    await trainAndSaveModel(job, jobTracker);
    
    // Cleanup
    activeJobs.delete(jobId);
    
    console.log(`Training job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Error in training job ${job._id}:`, error);
    
    // Update job status to failed
    await TrainingJob.findByIdAndUpdate(job._id, {
      status: 'failed',
      failureReason: error.message,
      updatedAt: new Date()
    });
    
    // Cleanup
    activeJobs.delete(job._id.toString());
  }
}

/**
 * Prepare dataset for training
 * @param {object} job - Training job document
 * @param {object} dataset - Dataset document
 * @param {object} jobTracker - Job tracker object
 * @returns {Promise<void>}
 */
async function prepareDataset(job, dataset, jobTracker) {
  try {
    await updateJobStatus(job._id, 'preparing', 'Preparing dataset');
    
    // Create dataset directory if it doesn't exist
    const datasetDir = path.join(__dirname, '../../../data/datasets', dataset._id.toString());
    if (!fs.existsSync(datasetDir)) {
      throw new Error(`Dataset directory ${datasetDir} does not exist`);
    }
    
    // Get class directories (each subdirectory is a class)
    const classDirs = fs.readdirSync(datasetDir)
      .filter(item => {
        const itemPath = path.join(datasetDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
    
    if (classDirs.length === 0) {
      throw new Error('No class directories found in dataset');
    }
    
    console.log(`Found ${classDirs.length} classes in dataset`);
    
    // Prepare dataset
    const { xs, ys, imageSize } = await loadImagesAndLabels(datasetDir, classDirs, job.inputShape);
    
    // Create training and validation sets
    const splitIdx = Math.floor(xs.shape[0] * (1 - job.validationSplit));
    
    const trainX = xs.slice([0, 0, 0, 0], [splitIdx, -1, -1, -1]);
    const trainY = ys.slice([0, 0], [splitIdx, -1]);
    
    const valX = xs.slice([splitIdx, 0, 0, 0], [-1, -1, -1, -1]);
    const valY = ys.slice([splitIdx, 0], [-1, -1]);
    
    // Store in job tracker
    jobTracker.dataset = {
      trainX,
      trainY,
      valX,
      valY,
      classNames: classDirs,
      imageSize
    };
    
    console.log(`Dataset prepared: Training samples: ${trainX.shape[0]}, Validation samples: ${valX.shape[0]}`);
  } catch (error) {
    console.error('Error preparing dataset:', error);
    throw new Error(`Failed to prepare dataset: ${error.message}`);
  }
}

/**
 * Load images and labels from dataset directory
 * @param {string} datasetDir - Dataset directory path
 * @param {string[]} classes - Array of class names
 * @param {object} inputShape - Input shape object
 * @returns {Promise<object>} - Object containing xs, ys, and imageSize
 */
async function loadImagesAndLabels(datasetDir, classes, inputShape) {
  try {
    const { width, height, channels } = inputShape;
    const imageSize = [height, width, channels];
    
    // Load image paths and labels
    let imagePaths = [];
    let labels = [];
    
    classes.forEach((className, classIndex) => {
      const classDir = path.join(datasetDir, className);
      
      if (!fs.existsSync(classDir)) {
        console.warn(`Class directory ${classDir} does not exist`);
        return;
      }
      
      const files = fs.readdirSync(classDir)
        .filter(file => file.match(/\.(jpg|jpeg|png)$/i))
        .map(file => path.join(classDir, file));
      
      imagePaths = imagePaths.concat(files);
      labels = labels.concat(Array(files.length).fill(classIndex));
    });
    
    if (imagePaths.length === 0) {
      throw new Error('No images found in dataset');
    }
    
    console.log(`Loading ${imagePaths.length} images...`);
    
    // Shuffle data
    const indices = Array.from(Array(imagePaths.length).keys());
    tf.util.shuffle(indices);
    
    imagePaths = indices.map(i => imagePaths[i]);
    labels = indices.map(i => labels[i]);
    
    // Load images
    const images = await Promise.all(
      imagePaths.map(async imagePath => {
        const imageBuffer = fs.readFileSync(imagePath);
        let imageTensor = tf.node.decodeImage(imageBuffer, channels);
        
        // Resize if needed
        if (imageTensor.shape[0] !== height || imageTensor.shape[1] !== width) {
          imageTensor = tf.image.resizeBilinear(imageTensor, [height, width]);
        }
        
        // Normalize to [0, 1]
        return imageTensor.div(255.0);
      })
    );
    
    // Stack images into a single tensor
    const xs = tf.stack(images);
    
    // Convert labels to one-hot encoding
    const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), classes.length);
    
    // Dispose temporary tensors
    images.forEach(img => img.dispose());
    
    return { xs, ys, imageSize };
  } catch (error) {
    console.error('Error loading images and labels:', error);
    throw new Error(`Failed to load images and labels: ${error.message}`);
  }
}

/**
 * Build model architecture based on job configuration
 * @param {object} job - Training job document
 * @param {object} jobTracker - Job tracker object
 * @returns {Promise<void>}
 */
async function buildModel(job, jobTracker) {
  try {
    await updateJobStatus(job._id, 'preparing', 'Building model architecture');
    
    const { width, height, channels } = job.inputShape;
    const numClasses = jobTracker.dataset.classNames.length;
    
    let model;
    
    switch (job.modelArchitecture) {
      case 'mobilenet':
        // MobileNet-like architecture
        model = tf.sequential();
        
        // Input layer
        model.add(tf.layers.conv2d({
          inputShape: [height, width, channels],
          filters: 32,
          kernelSize: 3,
          strides: 2,
          padding: 'same',
          activation: 'relu'
        }));
        
        // Depthwise separable convolutions
        function addDepthwiseSeparableConv(model, filters, strides) {
          model.add(tf.layers.depthwiseConv2d({
            kernelSize: 3,
            strides: strides,
            padding: 'same',
            activation: 'relu'
          }));
          model.add(tf.layers.conv2d({
            filters: filters,
            kernelSize: 1,
            strides: 1,
            padding: 'same',
            activation: 'relu'
          }));
        }
        
        addDepthwiseSeparableConv(model, 64, 1);
        addDepthwiseSeparableConv(model, 128, 2);
        addDepthwiseSeparableConv(model, 128, 1);
        addDepthwiseSeparableConv(model, 256, 2);
        addDepthwiseSeparableConv(model, 256, 1);
        addDepthwiseSeparableConv(model, 512, 2);
        
        // Add global average pooling
        model.add(tf.layers.globalAveragePooling2d());
        model.add(tf.layers.dropout({ rate: 0.2 }));
        
        // Output layer
        model.add(tf.layers.dense({
          units: numClasses,
          activation: 'softmax'
        }));
        break;
        
      case 'simple':
        // Simple MLP for testing
        model = tf.sequential();
        model.add(tf.layers.flatten({
          inputShape: [height, width, channels]
        }));
        model.add(tf.layers.dense({
          units: 128,
          activation: 'relu'
        }));
        model.add(tf.layers.dropout({ rate: 0.2 }));
        model.add(tf.layers.dense({
          units: numClasses,
          activation: 'softmax'
        }));
        break;
        
      case 'default':
      default:
        // VGG-style CNN
        model = tf.sequential();
        
        // Input layer
        model.add(tf.layers.conv2d({
          inputShape: [height, width, channels],
          filters: 32,
          kernelSize: 3,
          padding: 'same',
          activation: 'relu'
        }));
        model.add(tf.layers.conv2d({
          filters: 32,
          kernelSize: 3,
          padding: 'same',
          activation: 'relu'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
        
        // Second conv block
        model.add(tf.layers.conv2d({
          filters: 64,
          kernelSize: 3,
          padding: 'same',
          activation: 'relu'
        }));
        model.add(tf.layers.conv2d({
          filters: 64,
          kernelSize: 3,
          padding: 'same',
          activation: 'relu'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
        
        // Third conv block
        model.add(tf.layers.conv2d({
          filters: 128,
          kernelSize: 3,
          padding: 'same',
          activation: 'relu'
        }));
        model.add(tf.layers.conv2d({
          filters: 128,
          kernelSize: 3,
          padding: 'same',
          activation: 'relu'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
        
        // Dense layers
        model.add(tf.layers.flatten());
        model.add(tf.layers.dense({
          units: 512,
          activation: 'relu'
        }));
        model.add(tf.layers.dropout({ rate: 0.5 }));
        model.add(tf.layers.dense({
          units: numClasses,
          activation: 'softmax'
        }));
        break;
    }
    
    // Compile model
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    // Print model summary
    model.summary();
    
    // Store in job tracker
    jobTracker.model = model;
    
    console.log('Model built successfully');
  } catch (error) {
    console.error('Error building model:', error);
    throw new Error(`Failed to build model: ${error.message}`);
  }
}

/**
 * Train and save model
 * @param {object} job - Training job document
 * @param {object} jobTracker - Job tracker object
 * @returns {Promise<void>}
 */
async function trainAndSaveModel(job, jobTracker) {
  try {
    await updateJobStatus(job._id, 'training', 'Training model');
    
    const { model, dataset, shouldCancel } = jobTracker;
    const { trainX, trainY, valX, valY } = dataset;
    
    // Define callback to track progress
    const callbacks = {
      onEpochEnd: async (epoch, logs) => {
        // Check if job should be cancelled
        if (jobTracker.shouldCancel) {
          throw new Error('Training job cancelled by user');
        }
        
        // Update progress
        jobTracker.progress.current = epoch + 1;
        
        // Update job in database
        const metrics = {
          currentEpoch: epoch + 1,
          totalEpochs: job.epochs,
          trainAccuracy: logs.acc,
          validationAccuracy: logs.val_acc,
          trainLoss: logs.loss,
          validationLoss: logs.val_loss
        };
        
        await updateJobProgress(job._id, epoch + 1, job.epochs, metrics);
        
        console.log(`Epoch ${epoch + 1}/${job.epochs} - Loss: ${logs.loss.toFixed(4)} - Acc: ${logs.acc.toFixed(4)} - Val Loss: ${logs.val_loss.toFixed(4)} - Val Acc: ${logs.val_acc.toFixed(4)}`);
      }
    };
    
    // Train model
    const startTime = Date.now();
    const history = await model.fit(trainX, trainY, {
      epochs: job.epochs,
      batchSize: job.batchSize,
      validationData: [valX, valY],
      callbacks: callbacks,
      shuffle: true
    });
    const trainingTime = (Date.now() - startTime) / 1000; // in seconds
    
    // Evaluate model
    const evalResult = model.evaluate(valX, valY);
    const evalLoss = evalResult[0].dataSync()[0];
    const evalAcc = evalResult[1].dataSync()[0];
    
    console.log(`Evaluation - Loss: ${evalLoss.toFixed(4)} - Accuracy: ${evalAcc.toFixed(4)}`);
    
    // Save model
    const modelDir = path.join(__dirname, '../../../data/models', job._id.toString());
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    const modelPath = path.join(modelDir, 'model.json');
    await model.save(`file://${modelPath}`);
    
    // Create model document
    const modelDoc = new MLModel({
      name: job.modelName,
      version: job.modelVersion,
      description: job.modelDescription,
      type: job.modelType,
      modelArchitecture: job.modelArchitecture,
      trainedBy: job.userId,
      trainingJob: job._id,
      dataset: job.datasetId,
      metrics: {
        trainAccuracy: history.history.acc[history.history.acc.length - 1],
        validationAccuracy: history.history.val_acc[history.history.val_acc.length - 1],
        trainLoss: history.history.loss[history.history.loss.length - 1],
        validationLoss: history.history.val_loss[history.history.val_loss.length - 1],
        evaluationAccuracy: evalAcc,
        evaluationLoss: evalLoss
      },
      trainingTime: trainingTime,
      trainingSamples: trainX.shape[0],
      validationSamples: valX.shape[0],
      path: modelPath,
      applicableBodyParts: job.applicableBodyParts ? job.applicableBodyParts.split(',').map(p => p.trim()) : [],
      status: 'active',
      inputShape: job.inputShape,
      classNames: dataset.classNames
    });
    
    await modelDoc.save();
    
    // Update job status to completed
    await TrainingJob.findByIdAndUpdate(job._id, {
      status: 'completed',
      completedAt: new Date(),
      modelId: modelDoc._id,
      trainingMetrics: {
        trainingTime,
        finalTrainLoss: history.history.loss[history.history.loss.length - 1],
        finalTrainAccuracy: history.history.acc[history.history.acc.length - 1],
        finalValidationLoss: history.history.val_loss[history.history.val_loss.length - 1],
        finalValidationAccuracy: history.history.val_acc[history.history.val_acc.length - 1],
        evaluationLoss: evalLoss,
        evaluationAccuracy: evalAcc
      },
      updatedAt: new Date()
    });
    
    console.log(`Model saved at ${modelPath}`);
    console.log(`Model document created with ID ${modelDoc._id}`);
  } catch (error) {
    console.error('Error training and saving model:', error);
    throw new Error(`Failed to train and save model: ${error.message}`);
  } finally {
    // Dispose tensors
    if (jobTracker.dataset) {
      tf.dispose([
        jobTracker.dataset.trainX,
        jobTracker.dataset.trainY,
        jobTracker.dataset.valX,
        jobTracker.dataset.valY
      ]);
    }
  }
}

/**
 * Update job status
 * @param {string} jobId - Training job ID
 * @param {string} status - Job status
 * @param {string} message - Status message
 * @returns {Promise<void>}
 */
async function updateJobStatus(jobId, status, message) {
  try {
    // Check if TrainingJob model is properly loaded
    if (!TrainingJob || typeof TrainingJob.findByIdAndUpdate !== 'function') {
      console.warn('TrainingJob model is not properly loaded. Cannot update job status.');
      return;
    }
    
    await TrainingJob.findByIdAndUpdate(jobId, {
      status,
      statusMessage: message,
      updatedAt: new Date()
    });
    
    console.log(`Job ${jobId} status updated to ${status}: ${message}`);
  } catch (error) {
    console.error(`Error updating job ${jobId} status:`, error);
  }
}

/**
 * Update job progress
 * @param {string} jobId - Training job ID
 * @param {number} current - Current progress value
 * @param {number} total - Total progress value
 * @param {object} metrics - Training metrics
 * @returns {Promise<void>}
 */
async function updateJobProgress(jobId, current, total, metrics) {
  try {
    await TrainingJob.findByIdAndUpdate(jobId, {
      progress: { current, total },
      trainingMetrics: metrics,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error(`Error updating job ${jobId} progress:`, error);
  }
}

/**
 * Cancel a training job
 * @param {string} jobId - Training job ID
 * @returns {Promise<boolean>} - Whether the job was cancelled successfully
 */
async function cancelTrainingJob(jobId) {
  try {
    const jobTracker = activeJobs.get(jobId);
    
    if (jobTracker) {
      // Mark job for cancellation
      jobTracker.shouldCancel = true;
      console.log(`Job ${jobId} marked for cancellation`);
      return true;
    } else {
      // Job not active, update status directly
      const job = await TrainingJob.findById(jobId);
      
      if (!job) {
        throw new Error(`Training job ${jobId} not found`);
      }
      
      if (['pending', 'preparing', 'training'].includes(job.status)) {
        job.status = 'failed';
        job.failureReason = 'Cancelled by user';
        job.updatedAt = new Date();
        await job.save();
        
        console.log(`Job ${jobId} cancelled`);
        return true;
      } else {
        console.log(`Job ${jobId} cannot be cancelled (status: ${job.status})`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error cancelling job ${jobId}:`, error);
    return false;
  }
}

module.exports = {
  initializeTrainingService,
  startTrainingJob,
  cancelTrainingJob,
  activeJobs
}; 