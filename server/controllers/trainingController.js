const TrainingJob = require('../models/JobModel');
const Dataset = require('../models/Dataset');
const MLModel = require('../models/MLModel');
const { trainModel } = require('../utils/ml/modelTraining');
const { getDatasetStats } = require('../utils/ml/datasetManager');

/**
 * Get all training jobs
 * @route GET /api/training/jobs
 * @access Private
 */
exports.getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // If not admin, only show user's own jobs
    if (req.user.role !== 'admin') {
      filter.userId = req.user._id;
    }

    // Get training jobs
    const jobs = await TrainingJob.find(filter)
      .populate('userId', 'name email')
      .populate('modelId', 'name version')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Count total jobs
    const total = await TrainingJob.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: jobs.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
      data: {
        jobs,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Get a single training job
 * @route GET /api/training/jobs/:id
 * @access Private
 */
exports.getJob = async (req, res) => {
  try {
    const job = await TrainingJob.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('modelId');

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Training job not found',
      });
    }

    // Check if user has access to this job
    if (
      req.user.role !== 'admin' &&
      job.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this training job',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        job,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Create a new training job
 * @route POST /api/training/jobs
 * @access Private
 */
exports.createJob = async (req, res) => {
  try {
    const {
      name,
      description,
      datasetId,
      modelType,
      modelName,
      modelVersion,
      modelDescription,
      modelArchitecture,
      inputShape,
      applicableBodyParts,
      epochs,
      batchSize,
      validationSplit,
    } = req.body;

    // Validate input
    if (!name || !datasetId || !modelType || !modelName || !modelVersion || !epochs || !batchSize || !inputShape) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields',
      });
    }

    // Check if dataset exists
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({
        status: 'error',
        message: 'Dataset not found',
      });
    }

    // Check if user has access to this dataset
    if (
      req.user.role !== 'admin' &&
      dataset.createdBy.toString() !== req.user._id.toString() &&
      !dataset.public
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to use this dataset',
      });
    }

    // Get dataset stats to get class names
    const stats = await getDatasetStats(datasetId);
    const classNames = stats.classes.map(c => c.name);

    if (classNames.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Dataset has no classes',
      });
    }

    // Parse input shape
    let parsedInputShape;
    try {
      if (typeof inputShape === 'string') {
        parsedInputShape = JSON.parse(inputShape);
      } else {
        parsedInputShape = inputShape;
      }
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input shape format',
      });
    }

    // Create training job
    const job = await TrainingJob.create({
      name,
      description: description || '',
      userId: req.user._id,
      datasetName: dataset.name,
      modelType,
      modelArchitecture: modelArchitecture || 'default',
      inputShape: {
        width: parsedInputShape.width || 224,
        height: parsedInputShape.height || 224,
        channels: parsedInputShape.channels || 3,
      },
      classNames,
      trainConfig: {
        epochs: parseInt(epochs) || 10,
        batchSize: parseInt(batchSize) || 32,
        validationSplit: parseFloat(validationSplit) || 0.2,
      },
      status: 'pending',
      startedAt: new Date(),
    });

    // Start training job asynchronously
    process.nextTick(async () => {
      try {
        await trainModel(
          {
            datasetName: dataset.name,
            modelName,
            modelVersion,
            modelDescription: modelDescription || '',
            modelType,
            modelArchitecture: modelArchitecture || 'default',
            epochs: parseInt(epochs) || 10,
            batchSize: parseInt(batchSize) || 32,
            validationSplit: parseFloat(validationSplit) || 0.2,
            inputShape: [
              parsedInputShape.width || 224,
              parsedInputShape.height || 224,
              parsedInputShape.channels || 3,
            ],
            classNames,
            userId: req.user._id,
            applicableBodyParts: applicableBodyParts || [],
          },
          job._id
        );
      } catch (error) {
        console.error('Error in training job:', error);
        // Job status will be updated to 'failed' by the training function
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        job,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Cancel a training job
 * @route PATCH /api/training/jobs/:id/cancel
 * @access Private
 */
exports.cancelJob = async (req, res) => {
  try {
    const job = await TrainingJob.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Training job not found',
      });
    }

    // Check if user has access to this job
    if (
      req.user.role !== 'admin' &&
      job.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to cancel this training job',
      });
    }

    // Check if job can be cancelled
    if (!['pending', 'preparing', 'training'].includes(job.status)) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot cancel job with status "${job.status}"`,
      });
    }

    // Update job status
    job.status = 'failed';
    job.error = 'Cancelled by user';
    job.completedAt = new Date();
    await job.save();

    res.status(200).json({
      status: 'success',
      data: {
        job,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Delete a training job
 * @route DELETE /api/training/jobs/:id
 * @access Private
 */
exports.deleteJob = async (req, res) => {
  try {
    const job = await TrainingJob.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Training job not found',
      });
    }

    // Check if user has access to this job
    if (
      req.user.role !== 'admin' &&
      job.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this training job',
      });
    }

    // Delete job
    await TrainingJob.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}; 