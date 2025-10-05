const mongoose = require('mongoose');

const MLModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
    },
    version: {
      type: String,
      required: [true, 'Model version is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Model description is required'],
    },
    modelType: {
      type: String,
      enum: ['classification', 'detection', 'segmentation', 'prediction'],
      required: true,
    },
    applicableBodyParts: {
      type: [String],
      required: true,
    },
    applicableImagingTypes: {
      type: [String],
      enum: ['xray', 'mri', 'ct', 'ultrasound', 'other'],
      required: true,
    },
    conditions: {
      type: [String],
      required: true,
    },
    modelPath: {
      type: String,
      required: true,
    },
    inputShape: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      channels: { type: Number, required: true },
    },
    preprocessingSteps: {
      type: [String],
      default: [],
    },
    performance: {
      accuracy: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },
      precision: {
        type: Number,
        min: 0,
        max: 100,
      },
      recall: {
        type: Number,
        min: 0,
        max: 100,
      },
      f1Score: {
        type: Number,
        min: 0,
        max: 100,
      },
      confusionMatrix: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    trainedOn: {
      datasetName: { type: String, required: true },
      datasetSize: { type: Number, required: true },
      trainDate: { type: Date, required: true },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create unique compound index on name and version
MLModelSchema.index({ name: 1, version: 1 }, { unique: true });

// Index for faster queries by model type and active status
MLModelSchema.index({ modelType: 1, isActive: 1 });
MLModelSchema.index({ applicableImagingTypes: 1 });

// Create ML Model model
const MLModel = mongoose.model('MLModel', MLModelSchema);

module.exports = MLModel; 