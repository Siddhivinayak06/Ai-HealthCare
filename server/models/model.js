const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ModelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['classification', 'detection', 'segmentation'],
    },
    modelArchitecture: {
      type: String,
      required: true,
      enum: ['default', 'mobilenet', 'simple'],
    },
    trainedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trainingJob: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingJob',
      required: true,
    },
    dataset: {
      type: Schema.Types.ObjectId,
      ref: 'Dataset',
      required: true,
    },
    metrics: {
      trainAccuracy: {
        type: Number,
      },
      validationAccuracy: {
        type: Number,
      },
      trainLoss: {
        type: Number,
      },
      validationLoss: {
        type: Number,
      },
      evaluationAccuracy: {
        type: Number,
      },
      evaluationLoss: {
        type: Number,
      },
    },
    trainingTime: {
      type: Number, // in seconds
    },
    trainingSamples: {
      type: Number,
    },
    validationSamples: {
      type: Number,
    },
    path: {
      type: String,
      required: true,
    },
    applicableBodyParts: {
      type: [String],
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'archived', 'deprecated', 'testing'],
      default: 'testing',
    },
    inputShape: {
      width: {
        type: Number,
        required: true,
      },
      height: {
        type: Number,
        required: true,
      },
      channels: {
        type: Number,
        required: true,
      },
    },
    classNames: {
      type: [String],
      required: true,
    },
    totalPredictions: {
      type: Number,
      default: 0,
    },
    averageConfidence: {
      type: Number,
      default: 0,
    },
    public: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ModelSchema.index({ trainedBy: 1, status: 1 });
ModelSchema.index({ type: 1, status: 1 });
ModelSchema.index({ dataset: 1 });
ModelSchema.index({ public: 1, status: 1 });
ModelSchema.index({ name: 1, version: 1 }, { unique: true });
ModelSchema.index({ createdAt: -1 });

// Define a compound virtual identifier
ModelSchema.virtual('fullName').get(function() {
  return `${this.name} v${this.version}`;
});

const Model = mongoose.model('Model', ModelSchema);

module.exports = { Model }; 