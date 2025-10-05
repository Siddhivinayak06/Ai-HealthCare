const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrainingJobSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    datasetId: {
      type: Schema.Types.ObjectId,
      ref: 'Dataset',
      required: true,
    },
    datasetName: {
      type: String,
      trim: true,
    },
    modelType: {
      type: String,
      required: true,
      enum: ['classification', 'detection', 'segmentation'],
    },
    modelId: {
      type: Schema.Types.ObjectId,
      ref: 'MLModel',
    },
    modelName: {
      type: String,
      required: true,
      trim: true,
    },
    modelVersion: {
      type: String,
      required: true,
      trim: true,
    },
    modelDescription: {
      type: String,
      trim: true,
    },
    modelArchitecture: {
      type: String,
      default: 'default',
      enum: ['default', 'mobilenet', 'simple'],
    },
    inputShape: {
      width: {
        type: Number,
        required: true,
        default: 224,
      },
      height: {
        type: Number,
        required: true,
        default: 224,
      },
      channels: {
        type: Number,
        required: true,
        default: 3,
      },
    },
    applicableBodyParts: {
      type: String,
      trim: true,
    },
    epochs: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
      max: 100,
    },
    batchSize: {
      type: Number,
      required: true,
      default: 32,
      min: 1,
      max: 256,
    },
    validationSplit: {
      type: Number,
      required: true,
      default: 0.2,
      min: 0.1,
      max: 0.5,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'preparing', 'training', 'completed', 'failed'],
      default: 'pending',
    },
    statusMessage: {
      type: String,
      trim: true,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    progress: {
      current: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
    trainingMetrics: {
      currentEpoch: Number,
      totalEpochs: Number,
      trainAccuracy: Number,
      validationAccuracy: Number,
      trainLoss: Number,
      validationLoss: Number,
      finalTrainAccuracy: Number,
      finalValidationAccuracy: Number,
      finalTrainLoss: Number,
      finalValidationLoss: Number,
      evaluationAccuracy: Number,
      evaluationLoss: Number,
      trainingTime: Number, // in seconds
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
TrainingJobSchema.index({ userId: 1, status: 1 });
TrainingJobSchema.index({ datasetId: 1 });
TrainingJobSchema.index({ modelId: 1 });
TrainingJobSchema.index({ createdAt: -1 });

// Export as both JobModel (new) and TrainingJob (for backward compatibility)
const JobModel = mongoose.model('TrainingJob', TrainingJobSchema);

module.exports = JobModel; 