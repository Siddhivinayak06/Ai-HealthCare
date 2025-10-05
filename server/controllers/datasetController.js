const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Dataset = require('../models/Dataset');
const { 
  createDataset, 
  addImagesToDataset, 
  getDatasetStats, 
  deleteDataset 
} = require('../utils/ml/datasetManager');

// Set up multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../temp-uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
}).array('images', 50); // Allow up to 50 images at once

/**
 * Upload middleware
 */
exports.uploadImages = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: 'error',
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message,
      });
    }
    next();
  });
};

/**
 * Get all datasets
 * @route GET /api/datasets
 * @access Private
 */
exports.getAllDatasets = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Add type filter if provided
    if (type) {
      filter.type = type;
    }
    
    // If not admin, only show user's own datasets or public datasets
    if (req.user.role !== 'admin') {
      filter.$or = [
        { createdBy: req.user._id },
        { public: true },
      ];
    }

    // Get datasets
    const datasets = await Dataset.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Count total datasets
    const total = await Dataset.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: datasets.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
      data: {
        datasets,
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
 * Get a single dataset
 * @route GET /api/datasets/:id
 * @access Private
 */
exports.getDataset = async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!dataset) {
      return res.status(404).json({
        status: 'error',
        message: 'Dataset not found',
      });
    }

    // Check if user has access to this dataset
    if (
      req.user.role !== 'admin' &&
      dataset.createdBy._id.toString() !== req.user._id.toString() &&
      !dataset.public
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this dataset',
      });
    }

    // Get detailed stats about the dataset
    const stats = await getDatasetStats(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        dataset,
        stats,
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
 * Create a new dataset
 * @route POST /api/datasets
 * @access Private
 */
exports.createDataset = async (req, res) => {
  try {
    const { name, description, type, classes } = req.body;

    // Validate input
    if (!name || !type || !classes || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, type, and at least one class are required',
      });
    }

    // Create dataset
    const dataset = await createDataset(
      {
        name,
        description,
        type,
        classes,
      },
      req.user._id
    );

    res.status(201).json({
      status: 'success',
      data: {
        dataset,
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
 * Add images to a dataset
 * @route POST /api/datasets/:id/images
 * @access Private
 */
exports.addImages = async (req, res) => {
  try {
    const { className, split = 'train' } = req.body;
    const datasetId = req.params.id;
    const files = req.files;

    // Validate input
    if (!className || !files || files.length === 0 || !['train', 'validation'].includes(split)) {
      return res.status(400).json({
        status: 'error',
        message: 'Class name, valid split (train/validation), and at least one image are required',
      });
    }

    // Check if dataset exists and user has access
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({
        status: 'error',
        message: 'Dataset not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      dataset.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to add images to this dataset',
      });
    }

    // Add images to the dataset
    const updatedDataset = await addImagesToDataset(
      datasetId,
      className,
      files,
      split,
      req.user._id
    );

    // Get updated stats
    const stats = await getDatasetStats(datasetId);

    res.status(200).json({
      status: 'success',
      data: {
        dataset: updatedDataset,
        stats,
      },
    });
  } catch (error) {
    // Clean up any uploaded files that may be lingering
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update dataset information
 * @route PATCH /api/datasets/:id
 * @access Private
 */
exports.updateDataset = async (req, res) => {
  try {
    const { description, public } = req.body;
    
    // Check if dataset exists and user has access
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({
        status: 'error',
        message: 'Dataset not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      dataset.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this dataset',
      });
    }

    // Update the dataset
    const updatedDataset = await Dataset.findByIdAndUpdate(
      req.params.id,
      {
        description: description !== undefined ? description : dataset.description,
        public: public !== undefined ? public : dataset.public,
        lastUpdatedBy: req.user._id,
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        dataset: updatedDataset,
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
 * Delete a dataset
 * @route DELETE /api/datasets/:id
 * @access Private
 */
exports.deleteDataset = async (req, res) => {
  try {
    // Check if dataset exists and user has access
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({
        status: 'error',
        message: 'Dataset not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      dataset.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this dataset',
      });
    }

    // Delete the dataset
    await deleteDataset(req.params.id);

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