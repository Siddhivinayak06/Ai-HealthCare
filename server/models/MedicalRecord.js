const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordType: {
      type: String,
      enum: ['xray', 'mri', 'ct', 'ultrasound', 'labTest', 'other'],
      required: true,
    },
    bodyPart: {
      type: String,
      required: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    diagnosisResults: {
      aiDiagnosis: {
        condition: {
          type: String,
          default: '',
        },
        confidence: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        detectedAreas: [
          {
            x: Number,
            y: Number,
            width: Number,
            height: Number,
            label: String,
            confidence: Number,
          },
        ],
        explanation: {
          summary: String,
          confidenceLevel: {
            type: String,
            enum: ['very high', 'high', 'moderate', 'low'],
          },
          details: [String],
          recommendations: [String],
        },
        perImageResults: [{
          imagePath: String,
          condition: String,
          confidence: Number,
          explanation: {
            summary: String,
            confidenceLevel: String,
            details: [String],
            recommendations: [String],
          }
        }],
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
      doctorDiagnosis: {
        condition: {
          type: String,
          default: '',
        },
        notes: {
          type: String,
          default: '',
        },
        diagnosedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        diagnosedAt: {
          type: Date,
        },
      },
    },
    patientHistory: {
      age: Number,
      weight: Number,
      height: Number,
      symptoms: [String],
      allergies: [String],
      medications: [String],
      familyHistory: [String],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'diagnosed', 'reviewed'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    modelUsed: {
      name: String,
      version: String,
      accuracy: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
MedicalRecordSchema.index({ patient: 1, status: 1 });
MedicalRecordSchema.index({ 'diagnosisResults.aiDiagnosis.condition': 1 });

// Virtual for record age
MedicalRecordSchema.virtual('recordAge').get(function () {
  return (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
});

// Create Medical Record model
const MedicalRecord = mongoose.model('MedicalRecord', MedicalRecordSchema);

module.exports = MedicalRecord; 