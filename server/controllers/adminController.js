const User = require('../models/User');
const MLModel = require('../models/MLModel');
const MedicalRecord = require('../models/MedicalRecord');
const { runInference } = require('../utils/ml/modelManager');
const fs = require('fs');

/**
 * Get all users
 * @route GET /api/admin/users
 * @access Private/Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Add role filter if provided
    if (role) {
      filter.role = role;
    }

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Count total users matching the filter
    const total = await User.countDocuments(filter);

    // Get users with pagination
    const users = await User.find(filter)
      .select('-passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      results: users.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
      data: {
        users,
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
 * Get user by ID
 * @route GET /api/admin/users/:id
 * @access Private/Admin
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-passwordResetToken -passwordResetExpires'
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
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
 * Update user
 * @route PATCH /api/admin/users/:id
 * @access Private/Admin
 */
exports.updateUser = async (req, res) => {
  try {
    // Disallow password updates through this route
    if (req.body.password) {
      return res.status(400).json({
        status: 'error',
        message: 'This route is not for password updates.',
      });
    }

    // Fields allowed to be updated
    const filteredBody = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      active: req.body.active,
      specialization: req.body.specialization,
      medicalLicenseNumber: req.body.medicalLicenseNumber,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
    };

    // Filter out undefined values
    Object.keys(filteredBody).forEach((key) => {
      if (filteredBody[key] === undefined) {
        delete filteredBody[key];
      }
    });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true,
    }).select('-passwordResetToken -passwordResetExpires');

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
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
 * Delete user
 * @route DELETE /api/admin/users/:id
 * @access Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

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

/**
 * Create new ML model
 * @route POST /api/admin/models
 * @access Private/Admin
 */
exports.createModel = async (req, res) => {
  try {
    const newModel = await MLModel.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      status: 'success',
      data: {
        model: newModel,
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
 * Get all ML models
 * @route GET /api/admin/models
 * @access Private/Admin
 */
exports.getAllModels = async (req, res) => {
  try {
    const { page = 1, limit = 10, modelType, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Add model type filter if provided
    if (modelType) {
      filter.modelType = modelType;
    }

    // Add active status filter if provided
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Count total models matching the filter
    const total = await MLModel.countDocuments(filter);

    // Get models with pagination
    const models = await MLModel.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      results: models.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
      data: {
        models,
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
 * Get ML model by ID
 * @route GET /api/admin/models/:id
 * @access Private/Admin
 */
exports.getModel = async (req, res) => {
  try {
    const model = await MLModel.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!model) {
      return res.status(404).json({
        status: 'error',
        message: 'Model not found',
      });
    }

    // Correct the model path for frontend access
    const modelData = model.toObject();
    if (modelData.modelPath && modelData.modelPath.startsWith('/')) {
      // Path is already correct if it starts with /ml-models
      if (!modelData.modelPath.includes('ml-models')) {
        modelData.modelPath = `/ml-models${modelData.modelPath}`;
      }
    }

    return res.status(200).json({
      status: 'success',
      data: {
        model: modelData,
      },
    });
  } catch (error) {
    console.error('Error fetching model:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

/**
 * Update ML model
 * @route PATCH /api/admin/models/:id
 * @access Private/Admin
 */
exports.updateModel = async (req, res) => {
  try {
    const updatedModel = await MLModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedModel) {
      return res.status(404).json({
        status: 'error',
        message: 'ML model not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        model: updatedModel,
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
 * Delete ML model
 * @route DELETE /api/admin/models/:id
 * @access Private/Admin
 */
exports.deleteModel = async (req, res) => {
  try {
    const model = await MLModel.findByIdAndDelete(req.params.id);

    if (!model) {
      return res.status(404).json({
        status: 'error',
        message: 'ML model not found',
      });
    }

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

/**
 * Get dashboard statistics
 * @route GET /api/admin/stats
 * @access Private/Admin
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Get user stats
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalPatients = await User.countDocuments({ role: 'user' });
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    // Get records stats
    const totalRecords = await MedicalRecord.countDocuments();
    const pendingRecords = await MedicalRecord.countDocuments({ status: 'pending' });
    const diagnosedRecords = await MedicalRecord.countDocuments({ status: 'diagnosed' });
    const reviewedRecords = await MedicalRecord.countDocuments({ status: 'reviewed' });
    
    // Get record type distribution
    const recordTypes = await MedicalRecord.aggregate([
      {
        $group: {
          _id: '$recordType',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get models stats
    const totalModels = await MLModel.countDocuments();
    const activeModels = await MLModel.countDocuments({ isActive: true });

    // Get top models by usage
    const topModels = await MLModel.find()
      .sort({ usageCount: -1 })
      .limit(5)
      .select('name version usageCount performance.accuracy');

    // Get diagnosis condition distribution
    const diagnosisConditions = await MedicalRecord.aggregate([
      {
        $match: {
          'diagnosisResults.aiDiagnosis.condition': { $ne: '' },
        },
      },
      {
        $group: {
          _id: '$diagnosisResults.aiDiagnosis.condition',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          totalAdmins,
          totalPatients,
          recentUsers,
        },
        records: {
          total: totalRecords,
          pending: pendingRecords,
          diagnosed: diagnosedRecords,
          reviewed: reviewedRecords,
          recordTypes,
        },
        models: {
          total: totalModels,
          active: activeModels,
          topModels,
        },
        conditions: diagnosisConditions,
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
 * Update user status
 * @route PATCH /api/admin/users/:id/status
 * @access Private/Admin
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (typeof status !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be a boolean value',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: status },
      {
        new: true,
        runValidators: true,
      }
    ).select('-passwordResetToken -passwordResetExpires');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
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
 * Test AI model analysis on a single image
 * @route POST /api/admin/models/test-analysis
 * @access Admin
 */
exports.testModelAnalysis = async (req, res) => {
  try {
    const modelId = req.body.modelId;
    
    // Validate model ID
    if (!modelId) {
      return res.status(400).json({
        status: 'error',
        message: 'Model ID is required',
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload an image file',
      });
    }
    
    // Get the ML model
    const model = await MLModel.findById(modelId);
    if (!model) {
      return res.status(404).json({
        status: 'error',
        message: 'ML model not found',
      });
    }
    
    // Make sure the file exists
    const imagePath = req.file.path;
    if (!fs.existsSync(imagePath)) {
      return res.status(400).json({
        status: 'error',
        message: 'Uploaded file could not be processed',
      });
    }
    
    try {
      // Run inference on the uploaded image
      const result = await runInference(modelId, imagePath);
      
      // Return the analysis result
      return res.status(200).json({
        status: 'success',
        data: {
          result,
          model: {
            name: model.name,
            version: model.version,
            accuracy: model.performance.accuracy,
            modelType: model.modelType,
          },
        },
      });
    } catch (inferenceError) {
      console.error('Model inference error:', inferenceError);
      
      // Check if we're running in MOCK_MODE to provide fallback
      const { runInMockMode } = require('../utils/ml/modelManager');
      if (runInMockMode) {
        // Generate a mock result
        const { generateMockResponse } = require('../utils/ml/modelManager');
        const mockResult = await generateMockResponse(model);
        
        return res.status(200).json({
          status: 'success',
          data: {
            result: mockResult,
            model: {
              name: model.name,
              version: model.version,
              accuracy: model.performance.accuracy,
              modelType: model.modelType,
            },
            isMock: true
          },
        });
      }
      
      // Return a meaningful error if not in mock mode
      return res.status(500).json({
        status: 'error',
        message: 'Failed to analyze image: ' + inferenceError.message
      });
    }
  } catch (error) {
    console.error('Test analysis error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to analyze test image: ' + error.message
    });
  }
};

/**
 * Sync ML models from the filesystem to the database
 * @route POST /api/admin/models/sync
 * @access Private/Admin
 */
exports.syncModels = async (req, res) => {
  try {
    const { syncModels } = require('../utils/modelUtils');
    
    // Use the current admin user's ID
    const adminId = req.user.id;
    
    // Trigger the sync process
    const syncCount = await syncModels(adminId);
    
    return res.status(200).json({
      status: 'success',
      message: `Successfully synced ${syncCount} models`,
      data: {
        syncCount
      }
    });
  } catch (error) {
    console.error('Error syncing models:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to sync models: ' + error.message
    });
  }
}; 