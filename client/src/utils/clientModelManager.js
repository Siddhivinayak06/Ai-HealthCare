import * as tf from '@tensorflow/tfjs';

// Cache to store loaded models
const modelCache = new Map();

/**
 * Load a TensorFlow.js model from the given URL
 * @param {string} modelId - Unique identifier for the model
 * @param {string} modelUrl - URL to the model.json file
 * @returns {Promise<tf.LayersModel>} - The loaded TensorFlow model
 */
export async function loadModel(modelId, modelUrl) {
  try {
    // Check if model is already in cache
    if (modelCache.has(modelId)) {
      return modelCache.get(modelId);
    }
    
    // Load the model
    const model = await tf.loadLayersModel(modelUrl);
    
    // Cache the model for future use
    modelCache.set(modelId, model);
    console.log(`Model ${modelId} loaded from ${modelUrl}`);
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    throw error;
  }
}

/**
 * Preprocess an image for model input
 * @param {File|Blob} imageFile - The image file or blob
 * @param {Object} inputShape - The expected input shape {width, height, channels}
 * @returns {Promise<tf.Tensor>} - Preprocessed image tensor
 */
export async function preprocessImage(imageFile, inputShape) {
  return new Promise((resolve, reject) => {
    const { width, height, channels } = inputShape;
    
    // Create a canvas to resize the image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Create an image object from the file
    const img = new Image();
    img.onload = () => {
      try {
        // Draw and resize the image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // Create a tensor from the image data
        let tensor;
        if (channels === 1) {
          // Convert to grayscale if needed
          const grayscaleData = new Float32Array(width * height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            // Standard grayscale conversion
            grayscaleData[i / 4] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          }
          tensor = tf.tensor3d(grayscaleData, [height, width, 1]);
        } else {
          // RGB image
          const rgbData = new Float32Array(width * height * 3);
          for (let i = 0, j = 0; i < imageData.data.length; i += 4, j += 3) {
            rgbData[j] = imageData.data[i] / 255;     // R
            rgbData[j + 1] = imageData.data[i + 1] / 255; // G
            rgbData[j + 2] = imageData.data[i + 2] / 255; // B
          }
          tensor = tf.tensor3d(rgbData, [height, width, 3]);
        }
        
        // Add batch dimension [1, height, width, channels]
        const batchedTensor = tensor.expandDims(0);
        resolve(batchedTensor);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      reject(error);
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Get the top prediction from the model output
 * @param {tf.Tensor} output - The model's output tensor
 * @param {Array<string>} labels - Array of class labels
 * @returns {Object} - Top prediction with label and confidence
 */
export function getTopPrediction(outputTensor, labels) {
  return tf.tidy(() => {
    // Get the predictions
    const predictions = Array.from(outputTensor.dataSync());
    
    // Find the index with the highest confidence
    const maxIndex = predictions.indexOf(Math.max(...predictions));
    
    // Get the corresponding label and confidence
    const condition = labels[maxIndex] || 'Unknown';
    const confidence = predictions[maxIndex] * 100;
    
    return {
      condition,
      confidence,
      allPredictions: predictions.map((conf, idx) => ({
        label: labels[idx] || `Class ${idx}`,
        confidence: conf * 100
      }))
    };
  });
}

/**
 * Run inference on an image
 * @param {tf.LayersModel} model - The loaded TensorFlow.js model
 * @param {File|Blob} imageFile - The image file or blob to analyze
 * @param {Object} options - Options including inputShape and labels
 * @returns {Promise<Object>} - Prediction results
 */
export async function runInference(model, imageFile, options) {
  const { inputShape, labels, modelDetails } = options;
  
  try {
    // Preprocess the image
    const inputTensor = await preprocessImage(imageFile, inputShape);
    
    // Run inference
    const outputTensor = model.predict(inputTensor);
    
    // Get the prediction
    const prediction = getTopPrediction(outputTensor, labels);
    
    // Generate explanation
    const explanation = generateExplanation(
      prediction,
      modelDetails
    );
    
    // Clean up tensors
    tf.dispose([inputTensor, outputTensor]);
    
    return {
      ...prediction,
      explanation,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Inference error:', error);
    throw error;
  }
}

/**
 * Generate an explanation of the model result
 * @param {Object} prediction - The prediction result
 * @param {Object} modelDetails - Details about the model
 * @returns {Object} - Detailed explanation
 */
function generateExplanation(prediction, modelDetails) {
  const { condition, confidence } = prediction;
  
  // Create base explanation object
  const explanation = {
    summary: `AI model detected ${condition} with ${confidence.toFixed(1)}% confidence.`,
    confidenceLevel: getConfidenceLevel(confidence),
    details: [
      getConfidenceLevelDescription(condition, confidence),
      modelDetails ? `This analysis was performed using a ${modelDetails.name} (v${modelDetails.version}) model with client-side TensorFlow.js.` : 'This analysis was performed with client-side TensorFlow.js.'
    ],
    recommendations: []
  };
  
  // Add condition-specific information
  const conditionInfo = getConditionInformation(condition);
  if (conditionInfo) {
    explanation.details.push(conditionInfo.description);
    explanation.recommendations = conditionInfo.recommendations;
  }
  
  return explanation;
}

/**
 * Get the confidence level from percentage
 * @param {number} confidence - Confidence percentage
 * @returns {string} - Confidence level
 */
function getConfidenceLevel(confidence) {
  if (confidence > 90) return 'very high';
  if (confidence > 75) return 'high';
  if (confidence > 50) return 'moderate';
  return 'low';
}

/**
 * Get confidence level description
 * @param {string} condition - Detected condition
 * @param {number} confidence - Confidence percentage
 * @returns {string} - Description
 */
function getConfidenceLevelDescription(condition, confidence) {
  if (confidence > 90) {
    return `The AI is very confident in this diagnosis (${confidence.toFixed(1)}% confidence).`;
  } else if (confidence > 75) {
    return `The AI is confident in this diagnosis (${confidence.toFixed(1)}% confidence).`;
  } else if (confidence > 50) {
    return `The AI has moderate confidence in this diagnosis (${confidence.toFixed(1)}% confidence).`;
  } else {
    return `The AI has low confidence in this diagnosis (${confidence.toFixed(1)}% confidence). Consider additional testing.`;
  }
}

/**
 * Get condition-specific information and recommendations
 * @param {string} condition - The detected condition
 * @returns {Object|null} - Condition information
 */
function getConditionInformation(condition) {
  // Database of condition information
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
 * Clear the model cache to free up memory
 */
export function clearModelCache() {
  // Dispose all models
  for (const model of modelCache.values()) {
    model.dispose();
  }
  
  // Clear the cache
  modelCache.clear();
}

/**
 * Get information about the memory usage of TensorFlow.js
 * @returns {Object} - Memory information
 */
export function getMemoryInfo() {
  return tf.memory();
} 