const mongoose = require('mongoose');

const DatasetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dataset name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['xray', 'mri', 'ct', 'ultrasound', 'other'],
      required: true,
    },
    classes: [
      {
        name: {
          type: String,
          required: true,
        },
        count: {
          type: Number,
          default: 0,
        },
        description: {
          type: String,
          default: '',
        },
      },
    ],
    totalSamples: {
      type: Number,
      default: 0,
    },
    trainSamples: {
      type: Number,
      default: 0,
    },
    validationSamples: {
      type: Number,
      default: 0,
    },
    path: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['creating', 'ready', 'updating', 'error'],
      default: 'creating',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    public: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
DatasetSchema.index({ name: 1 });
DatasetSchema.index({ type: 1 });
DatasetSchema.index({ createdBy: 1 });
DatasetSchema.index({ public: 1 });
DatasetSchema.index({ tags: 1 });

const Dataset = mongoose.model('Dataset', DatasetSchema);

module.exports = Dataset; 