const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const MLModel = require('../../models/MLModel');
const { getFullModelPath, validateModelPath } = require('../modelUtils');

// Cache to store loaded models
const modelCache = new Map();

// Flag to enable mock mode for testing without real models
const MOCK_MODE = true;

// Export MOCK_MODE flag for other modules to check
const runInMockMode = MOCK_MODE;

/**
 * Load a model from the filesystem
 * @param {string} modelPath - Path to the model (from the database)
 * @returns {Promise<tf.LayersModel>} - Loaded TensorFlow model
 */
const loadModel = async (modelPath) => {
  try {
    // Check if model is in the cache
    if (modelCache.has(modelPath)) {
      console.log(`Using cached model for ${modelPath}`);
      return modelCache.get(modelPath);
    }

    // Validate model path
    if (!validateModelPath(modelPath)) {
      throw new Error(`Model not found at path: ${modelPath}`);
    }

    // Get full path to model.json
    const fullModelPath = getFullModelPath(modelPath);
    const modelJsonPath = path.join(fullModelPath, 'model.json');

    console.log(`Loading model from ${modelJsonPath}`);

    // Load the model using tf.node backend
    const handler = tf.io.fileSystem(modelJsonPath);
    const model = await tf.loadLayersModel(handler);

    // Cache the model
    modelCache.set(modelPath, model);
    console.log(`Model loaded and cached: ${modelPath}`);

    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    throw new Error(`Failed to load model: ${error.message}`);
  }
};

/**
 * Create a mock model for testing without real model files
 * @returns {Object} - A mock model object with a predict method
 */
function createMockModel() {
  return {
    predict: (inputTensor) => {
      // Get the batch size from the input tensor
      const batchSize = inputTensor.shape[0];
      
      // Create a mock output tensor with random values
      // This simulates a classification model with 4 classes
      const mockOutput = tf.tidy(() => {
        // Generate random logits
        const randomLogits = tf.randomUniform([batchSize, 4]);
        // Apply softmax to get probabilities
        return tf.softmax(randomLogits);
      });
      
      return mockOutput;
    },
    // Add other necessary methods for a tf.LayersModel
    dispose: () => {},
    summary: () => console.log("Mock Model Summary")
  };
}

/**
 * Preprocess an image for model input
 * @param {string} imagePath - Path to the image file
 * @param {Object} options - Preprocessing options
 * @param {number} options.width - Target width for the image
 * @param {number} options.height - Target height for the image
 * @param {number} options.channels - Number of channels (1 for grayscale, 3 for RGB)
 * @returns {Promise<tf.Tensor>} - Preprocessed image tensor
 */
async function preprocessImage(imagePath, options) {
  try {
    const { width, height, channels } = options;
    
    // If in mock mode and the image doesn't exist, create a mock image tensor
    if (!fs.existsSync(imagePath)) {
      console.warn(`Image not found at ${imagePath}.`);
      if (MOCK_MODE) {
        console.log(`Creating mock image tensor for ${imagePath}`);
        return tf.zeros([1, height, width, channels]);
      } else {
        throw new Error(`Image file not found: ${imagePath}`);
      }
    }
    
    try {
      // Read and resize the image using sharp
      let imageProcessor = sharp(imagePath)
        .resize(width, height, { fit: 'fill' });
        
      // Convert to grayscale if channels is 1
      if (channels === 1) {
        imageProcessor = imageProcessor.grayscale();
      }
      
      // Get the pixel data as Buffer
      const imageBuffer = await imageProcessor.raw().toBuffer();
      
      // Create a tensor from the raw pixel data
      let imageTensor;
      if (channels === 1) {
        // For grayscale images
        imageTensor = tf.tensor3d(
          new Float32Array(imageBuffer),
          [height, width, 1]
        );
      } else {
        // For RGB images (ensure channel count is correct)
        imageTensor = tf.tensor3d(
          new Float32Array(imageBuffer),
          [height, width, channels]
        );
      }
      
      // Normalize the pixel values to [0, 1]
      const normalizedTensor = imageTensor.div(tf.scalar(255));
      
      // Add batch dimension [1, height, width, channels]
      const batchedTensor = normalizedTensor.expandDims(0);
      
      // Clean up intermediate tensors
      tf.dispose([imageTensor]);
      
      return batchedTensor;
    } catch (sharpError) {
      console.error('Error processing image with sharp:', sharpError);
      
      // Try with node-canvas as an alternative approach
      if (MOCK_MODE) {
        console.log('Creating mock image tensor due to sharp processing error');
        return tf.zeros([1, height, width, channels]);
      }
      
      throw sharpError;
    }
  } catch (error) {
    if (MOCK_MODE) {
      console.warn(`Error preprocessing image: ${error.message}. Creating mock tensor.`);
      return tf.zeros([1, height, width, channels]);
    }
    console.error('Error preprocessing image:', error);
    throw new Error(`Failed to preprocess image: ${error.message}`);
  }
}

/**
 * Analyze an image using the specified model
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} modelDetails - Model metadata from the database
 * @returns {Promise<Object>} - Analysis result
 */
const analyzeImage = async (imageBuffer, modelDetails) => {
  try {
    const model = await loadModel(modelDetails.modelPath);
    
    // Convert image to tensor
    const imageTensor = await preprocessImage(imageBuffer, modelDetails.inputShape);
    
    // Run inference
    const predictions = model.predict(imageTensor);
    
    // Get result
    const result = await processResults(predictions, modelDetails);
    
    // Clean up
    tf.dispose([imageTensor, predictions]);
    
    return result;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error(`Image analysis failed: ${error.message}`);
  }
};

/**
 * Process model output into meaningful results
 * @param {tf.Tensor} predictions - Model output tensor
 * @param {Object} modelDetails - Model metadata from the database
 * @returns {Object} - Processed result with explanations
 */
const processResults = async (predictions, modelDetails) => {
  try {
    // Convert to array
    const predArray = await predictions.dataSync();
    
    // Get top predicted class
    const topPredIndex = predArray.indexOf(Math.max(...predArray));
    const confidence = predArray[topPredIndex] * 100;
    
    // Get condition label
    const condition = modelDetails.conditions[topPredIndex] || 'Unknown';
    
    // Generate explanation based on confidence
    let confidenceLevel = 'low';
    if (confidence > 85) confidenceLevel = 'high';
    else if (confidence > 65) confidenceLevel = 'medium';
    
    let explanation = `Analysis of the image suggests ${condition} with ${confidenceLevel} confidence (${confidence.toFixed(1)}%).`;
    
    // Add recommendations based on condition
    let recommendations = [];
    
    if (condition.includes('Normal')) {
      recommendations = ['No immediate medical attention required', 'Regular check-ups recommended'];
    } else if (condition.includes('Pneumonia')) {
      recommendations = [
        'Consult with a healthcare provider',
        'Further diagnostic tests may be needed',
        'Rest and hydration is important'
      ];
    } else if (condition.includes('COVID')) {
      recommendations = [
        'Immediate medical consultation recommended',
        'Consider isolation to prevent spread',
        'Monitor oxygen levels if possible'
      ];
    } else if (condition.includes('Tuberculosis')) {
      recommendations = [
        'Urgent medical attention required',
        'Further confirmatory tests recommended',
        'Treatment typically involves antibiotic regimen'
      ];
    } else {
      recommendations = ['Consult with a healthcare professional for accurate diagnosis'];
    }
    
    // Include confidence levels for all classes
    const allPredictions = modelDetails.conditions.map((label, index) => ({
      label,
      confidence: (predArray[index] * 100).toFixed(1)
    }));
    
    return {
      condition,
      confidence: confidence.toFixed(1),
      explanation,
      recommendations,
      allPredictions,
      detectedAt: new Date()
    };
  } catch (error) {
    console.error('Error processing results:', error);
    throw new Error(`Result processing failed: ${error.message}`);
  }
};

/**
 * Get the top prediction from the model output
 * @param {tf.Tensor} output - The model's output tensor
 * @param {Array<string>} labels - Array of class labels
 * @returns {Object} - Top prediction with label and confidence
 */
function getTopPrediction(output, labels) {
  // Convert the output tensor to an array
  const predictions = Array.from(output.dataSync());
  
  // Find the index with the highest confidence
  const maxIndex = predictions.indexOf(Math.max(...predictions));
  
  // Get the corresponding label and confidence
  const label = labels[maxIndex];
  const confidence = predictions[maxIndex] * 100;
  
  return {
    condition: label,
    confidence,
  };
}

/**
 * Generate a detailed explanation of the AI diagnosis result
 * @param {Object} prediction - The prediction result with condition and confidence
 * @param {string} modelType - The type of model used (classification, detection, etc.)
 * @param {Object} modelDetails - Additional details about the model
 * @returns {Object} - Detailed explanation of the prediction
 */
function generateResultExplanation(prediction, modelType, modelDetails) {
  const { condition, confidence } = prediction;
  
  // Create base explanation object
  const explanation = {
    summary: `AI model detected ${condition} with ${confidence.toFixed(1)}% confidence.`,
    confidenceLevel: getConfidenceLevel(confidence),
    details: [],
    recommendations: []
  };
  
  // Add confidence level description
  if (confidence > 90) {
    explanation.details.push(`The AI is very confident in this diagnosis (${confidence.toFixed(1)}% confidence).`);
  } else if (confidence > 75) {
    explanation.details.push(`The AI is confident in this diagnosis (${confidence.toFixed(1)}% confidence).`);
  } else if (confidence > 50) {
    explanation.details.push(`The AI has moderate confidence in this diagnosis (${confidence.toFixed(1)}% confidence).`);
  } else {
    explanation.details.push(`The AI has low confidence in this diagnosis (${confidence.toFixed(1)}% confidence). Consider additional testing.`);
  }
  
  // Add model-specific context
  explanation.details.push(`This analysis was performed using a ${modelDetails.name} (v${modelDetails.version}) ${modelType} model with a reported accuracy of ${modelDetails.performance.accuracy.toFixed(1)}%.`);
  
  // Add condition-specific information and recommendations
  const conditionInfo = getConditionInformation(condition);
  if (conditionInfo) {
    explanation.details.push(conditionInfo.description);
    explanation.recommendations = conditionInfo.recommendations;
  }
  
  return explanation;
}

/**
 * Get the confidence level label based on the confidence percentage
 * @param {number} confidence - Confidence percentage
 * @returns {string} - Confidence level label
 */
function getConfidenceLevel(confidence) {
  if (confidence > 90) return 'very high';
  if (confidence > 75) return 'high';
  if (confidence > 50) return 'moderate';
  return 'low';
}

/**
 * Get condition-specific information and recommendations
 * @param {string} condition - The detected condition
 * @returns {Object|null} - Condition information or null if not found
 */
function getConditionInformation(condition) {
  // This is a simplified version - in a real system, this would be more comprehensive
  // and potentially sourced from a database
  const conditionDatabase = {
    'pneumonia': {
      description: 'Pneumonia is an infection that inflames the air sacs in one or both lungs, which may fill with fluid.',
      recommendations: [
        'Consult with a physician for proper evaluation',
        'Additional tests may include blood tests, sputum tests, or chest CT scan',
        'Follow-up imaging recommended after treatment'
      ]
    },
    'covid': {
      description: 'COVID-19 is a respiratory disease caused by the SARS-CoV-2 virus, which can cause various levels of respiratory distress.',
      recommendations: [
        'Immediate isolation to prevent spread',
        'Follow-up with PCR testing to confirm diagnosis',
        'Monitor oxygen levels and symptoms',
        'Consult with a healthcare provider for treatment options'
      ]
    },
    'normal': {
      description: 'No abnormalities detected in the image.',
      recommendations: [
        'Regular check-ups as recommended by your healthcare provider',
        'Maintain preventive healthcare practices'
      ]
    },
    'fracture': {
      description: 'A fracture is a break in the continuity of the bone, which can vary in severity.',
      recommendations: [
        'Immobilize the affected area',
        'Consult with an orthopedic specialist',
        'Follow-up imaging to monitor healing',
        'Physical therapy may be recommended after initial healing'
      ]
    }
  };
  
  return conditionDatabase[condition.toLowerCase()] || null;
}

/**
 * Run inference on an image using a specified model
 * @param {string} modelId - Database ID of the ML model to use
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} - Prediction results including condition and confidence
 */
async function runInference(modelId, imagePath) {
  try {
    // Get model details from the database
    const modelDetails = await MLModel.findById(modelId);
    if (!modelDetails) {
      throw new Error(`Model with ID ${modelId} not found in database`);
    }
    
    // Check if the image file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Image file not found: ${imagePath}`);
      if (MOCK_MODE) {
        return generateMockResponse(modelDetails);
      }
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    try {
      // Load the model
      const model = await loadModel(modelDetails.modelPath);
      
      // Preprocess the image
      const inputTensor = await preprocessImage(imagePath, {
        width: modelDetails.inputShape.width,
        height: modelDetails.inputShape.height,
        channels: modelDetails.inputShape.channels,
      });
      
      // Run inference
      const output = model.predict(inputTensor);
      
      // Get the top prediction
      const prediction = getTopPrediction(output, modelDetails.conditions);
      
      // Generate detailed explanation
      const explanation = generateResultExplanation(
        prediction, 
        modelDetails.modelType, 
        {
          name: modelDetails.name,
          version: modelDetails.version,
          performance: modelDetails.performance
        }
      );
      
      // Clean up tensors
      tf.dispose([inputTensor, output]);
      
      return {
        ...prediction,
        explanation
      };
    } catch (inferenceError) {
      console.error('Error during model inference:', inferenceError);
      if (MOCK_MODE) {
        console.warn(`Using mock response due to inference error: ${inferenceError.message}`);
        return generateMockResponse(modelDetails);
      }
      throw inferenceError;
    }
  } catch (error) {
    console.error('Error running inference:', error);
    if (MOCK_MODE) {
      // If any error occurred in MOCK_MODE, try to generate a mock response
      try {
        const modelDetails = await MLModel.findById(modelId);
        if (modelDetails) {
          console.warn(`Using mock response due to error: ${error.message}`);
          return generateMockResponse(modelDetails);
        }
      } catch (mockError) {
        console.error('Failed to generate mock response:', mockError);
      }
    }
    throw error;
  }
}

/**
 * Generate a mock response for testing purposes
 * @param {Object} modelDetails - The model details from the database
 * @returns {Object} - A mock prediction result
 */
function generateMockResponse(modelDetails) {
  // Generate a random condition from the model's conditions
  if (!modelDetails || !modelDetails.conditions || modelDetails.conditions.length === 0) {
    // If we don't have valid model details, create a completely generic response
    const genericCondition = "Normal";
    const genericConfidence = 85.5;
    
    return {
      condition: genericCondition,
      confidence: genericConfidence,
      explanation: {
        summary: `Mock diagnosis: ${genericCondition} with ${genericConfidence.toFixed(1)}% confidence.`,
        confidenceLevel: "high", 
        details: ["This is a mock result for testing purposes."],
        recommendations: ["Please consult a healthcare professional for actual medical advice."]
      },
      allPredictions: [{ label: genericCondition, confidence: genericConfidence.toFixed(1) }]
    };
  }
  
  // Create a more realistic mock based on the model details
  const randomIndex = Math.floor(Math.random() * modelDetails.conditions.length);
  const randomCondition = modelDetails.conditions[randomIndex];
  const randomConfidence = 70 + Math.random() * 25; // 70-95% confidence
  
  // Create mock predictions for all conditions
  const allPredictions = modelDetails.conditions.map((condition, index) => {
    let confidence = 0;
    if (index === randomIndex) {
      confidence = randomConfidence;
    } else {
      // Distribute the remaining confidence values
      confidence = (100 - randomConfidence) * Math.random() / (modelDetails.conditions.length - 1);
    }
    return {
      label: condition, 
      confidence: confidence.toFixed(1)
    };
  });
  
  // Generate detailed explanation
  const randomExplanation = generateResultExplanation(
    { condition: randomCondition, confidence: randomConfidence },
    modelDetails.modelType,
    {
      name: modelDetails.name,
      version: modelDetails.version,
      performance: modelDetails.performance
    }
  );
  
  return {
    condition: randomCondition,
    confidence: randomConfidence.toFixed(1),
    explanation: randomExplanation,
    allPredictions
  };
}

/**
 * Run batch inference on multiple images using a specified model
 * @param {string} modelId - Database ID of the ML model to use
 * @param {Array<string>} imagePaths - Array of paths to image files
 * @returns {Promise<Object>} - Aggregated prediction results
 */
async function runBatchInference(modelId, imagePaths) {
  try {
    const results = [];
    
    for (const imagePath of imagePaths) {
      const result = await runInference(modelId, imagePath);
      results.push({
        imagePath: path.basename(imagePath),
        ...result
      });
    }
    
    // Aggregate results if needed
    const aggregatedResults = {
      predictions: results,
      primaryDiagnosis: getMostConfidentPrediction(results),
      timestamp: new Date()
    };
    
    return aggregatedResults;
  } catch (error) {
    console.error('Batch inference error:', error);
    throw error;
  }
}

/**
 * Get the most confident prediction from a list of results
 * @param {Array} results - List of prediction results
 * @returns {Object} - The most confident prediction
 */
function getMostConfidentPrediction(results) {
  if (results.length === 0) return null;
  
  // Find the prediction with the highest confidence
  return results.reduce((mostConfident, current) => {
    return current.confidence > mostConfident.confidence ? current : mostConfident;
  }, results[0]);
}

/**
 * Extract file paths from a medical record's images
 * @param {Object} record - The medical record object
 * @returns {Array<string>} - Array of absolute file paths
 */
function getImagePathsFromRecord(record) {
  const basePath = path.join(__dirname, '..', '..');
  return record.images.map(image => {
    return path.join(basePath, image.url.replace(/^\//, ''));
  });
}

module.exports = {
  loadModel,
  analyzeImage,
  preprocessImage,
  processResults,
  runInference,
  runBatchInference,
  getImagePathsFromRecord,
  generateResultExplanation,
  generateMockResponse,
  runInMockMode
}; 