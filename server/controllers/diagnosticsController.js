const path = require('path');
const fs = require('fs');
const tf = require('@tensorflow/tfjs');
const MedicalRecord = require('../models/MedicalRecord');
const MLModel = require('../models/MLModel');
const { runBatchInference, getImagePathsFromRecord } = require('../utils/ml/modelManager');

/**
 * Upload medical images and create a new medical record
 * @route POST /api/diagnostics/upload
 * @access Private
 */
exports.uploadMedicalImages = async (req, res) => {
  try {
    const { recordType, bodyPart, patientHistory } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload at least one image',
      });
    }

    if (!recordType || !bodyPart) {
      return res.status(400).json({
        status: 'error',
        message: 'Record type and body part are required',
      });
    }

    // Process uploaded files
    const processedImages = files.map((file) => ({
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date(),
    }));

    // Parse patient history if provided as a string
    let parsedHistory = patientHistory;
    if (typeof patientHistory === 'string') {
      try {
        parsedHistory = JSON.parse(patientHistory);
      } catch (e) {
        console.error('Error parsing patient history:', e);
        parsedHistory = {};
      }
    }

    // Create a new medical record
    const newRecord = await MedicalRecord.create({
      patient: req.user._id,
      recordType,
      bodyPart,
      images: processedImages,
      patientHistory: parsedHistory || {},
      status: 'pending',
    });

    res.status(201).json({
      status: 'success',
      data: {
        record: newRecord,
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
 * Analyze medical images with AI
 * @route POST /api/diagnostics/analyze/:recordId
 * @access Private
 */
exports.analyzeMedicalImages = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { modelId } = req.body;

    // Get the medical record
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found',
      });
    }

    // Verify ownership (unless admin)
    if (req.user.role !== 'admin' && record.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to analyze this record',
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

    // Check if model is applicable for this type of record
    if (!model.applicableImagingTypes.includes(record.recordType)) {
      return res.status(400).json({
        status: 'error',
        message: `Model is not applicable for ${record.recordType} images`,
      });
    }

    // Update record status to processing
    record.status = 'processing';
    await record.save();

    try {
      // Get all image paths from the record
      const imagePaths = getImagePathsFromRecord(record);

      // Run batch inference on all images
      const aiDiagnosis = await runBatchInference(modelId, imagePaths);

      // Update the record with the AI diagnosis
      if (aiDiagnosis && aiDiagnosis.primaryDiagnosis) {
        record.diagnosisResults.aiDiagnosis = {
          condition: aiDiagnosis.primaryDiagnosis.condition,
          confidence: aiDiagnosis.primaryDiagnosis.confidence,
          explanation: aiDiagnosis.primaryDiagnosis.explanation,
          perImageResults: aiDiagnosis.predictions || [],
          timestamp: aiDiagnosis.timestamp || new Date()
        };
      }
      
      record.status = 'diagnosed';
      record.modelUsed = {
        name: model.name,
        version: model.version,
        accuracy: model.performance.accuracy,
      };

      // Increment model usage count
      model.usageCount += 1;
      model.lastUsed = Date.now();
      await model.save();

      // Save the updated record
      await record.save();

      res.status(200).json({
        status: 'success',
        data: {
          record,
        },
      });
    } catch (error) {
      // If there's an error during inference, revert to pending status
      record.status = 'pending';
      await record.save();
      throw error; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Diagnosis error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred during analysis',
    });
  }
};

/**
 * Get all medical records for the current user or all users for admin
 * @route GET /api/diagnostics/records
 * @access Private
 */
exports.getMedicalRecords = async (req, res) => {
  try {
    const { status, recordType, page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Add record type filter if provided
    if (recordType) {
      filter.recordType = recordType;
    }

    // If not admin, only show user's own records
    if (req.user.role !== 'admin') {
      filter.patient = req.user._id;
    }

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { bodyPart: { $regex: search, $options: 'i' } },
        { 'diagnosisResults.aiDiagnosis.condition': { $regex: search, $options: 'i' } },
        { 'diagnosisResults.doctorDiagnosis.condition': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { 'patientHistory.symptoms': { $regex: search, $options: 'i' } },
        { 'patientHistory.allergies': { $regex: search, $options: 'i' } },
        { 'patientHistory.medications': { $regex: search, $options: 'i' } },
        { 'patientHistory.familyHistory': { $regex: search, $options: 'i' } }
      ];
    }

    // Count total records matching the filter
    const total = await MedicalRecord.countDocuments(filter);

    // Get records with pagination
    const records = await MedicalRecord.find(filter)
      .populate('patient', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      results: records.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
      data: {
        records,
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
 * Get a single medical record by ID
 * @route GET /api/diagnostics/records/:id
 * @access Private
 */
exports.getMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('diagnosisResults.doctorDiagnosis.diagnosedBy', 'name email specialization');

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found',
      });
    }

    // Check if user is authorized to view this record
    if (
      req.user.role !== 'admin' &&
      record.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this record',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        record,
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
 * Update a medical record with doctor's diagnosis
 * @route PATCH /api/diagnostics/records/:id/diagnosis
 * @access Private
 */
exports.updateDoctorDiagnosis = async (req, res) => {
  try {
    const { condition, notes } = req.body;

    if (!condition) {
      return res.status(400).json({
        status: 'error',
        message: 'Diagnosis condition is required',
      });
    }

    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found',
      });
    }

    // Update the doctor's diagnosis
    record.diagnosisResults.doctorDiagnosis = {
      condition,
      notes: notes || '',
      diagnosedBy: req.user._id,
      diagnosedAt: Date.now(),
    };

    // Update status to reviewed
    record.status = 'reviewed';

    // Save the updated record
    await record.save();

    res.status(200).json({
      status: 'success',
      data: {
        record,
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
 * Delete a medical record
 * @route DELETE /api/diagnostics/records/:id
 * @access Private
 */
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found',
      });
    }

    // Check if user is authorized to delete this record
    if (
      req.user.role !== 'admin' &&
      record.patient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this record',
      });
    }

    // Delete image files
    record.images.forEach((image) => {
      const imagePath = path.join(__dirname, '..', image.url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    // Delete the record from the database
    await MedicalRecord.findByIdAndDelete(req.params.id);

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
 * Get available ML models for a specific record type
 * @route GET /api/diagnostics/models
 * @access Private
 */
exports.getAvailableModels = async (req, res) => {
  try {
    const { recordType, bodyPart } = req.query;

    // Build filter object
    const filter = {
      isActive: true,
    };

    // Add record type filter if provided
    if (recordType) {
      filter.applicableImagingTypes = recordType;
    }

    // Add body part filter if provided
    if (bodyPart) {
      filter.applicableBodyParts = bodyPart;
    }

    // Get models
    const models = await MLModel.find(filter)
      .select('name version description modelType applicableBodyParts applicableImagingTypes conditions performance')
      .sort({ usageCount: -1 });

    res.status(200).json({
      status: 'success',
      results: models.length,
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
 * Analyze a single image with AI (for client-side integration)
 * @route POST /api/diagnostics/analyze-image
 * @access Private
 */
exports.analyzeSingleImage = async (req, res) => {
  try {
    const { modelId } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload an image file',
      });
    }

    // Validate model ID
    if (!modelId) {
      return res.status(400).json({
        status: 'error',
        message: 'Model ID is required',
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

    // Run inference on the uploaded image
    const imagePath = req.file.path;
    const result = await runInference(modelId, imagePath);

    // Return the analysis result
    res.status(200).json({
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
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred during image analysis',
    });
  }
}; 