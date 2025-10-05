import * as tf from '@tensorflow/tfjs';

// Enable mock mode for testing without real models
const MOCK_MODE = true;

/**
 * Create a mock model for client-side testing
 * @returns {Object} - A mock TensorFlow.js model
 */
const createMockModel = () => {
  // Create a sequential model with a convolutional layer
  const mockModel = tf.sequential();
  
  // Add a convolutional layer (important for heatmap visualization)
  mockModel.add(tf.layers.conv2d({
    inputShape: [224, 224, 3],
    kernelSize: 3,
    filters: 16,
    activation: 'relu',
    kernelInitializer: 'randomNormal',
  }));
  
  // Add more layers to make it realistic
  mockModel.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
  mockModel.add(tf.layers.flatten());
  mockModel.add(tf.layers.dense({units: 4, activation: 'softmax'}));
  
  // Compile the model to make it complete
  mockModel.compile({
    optimizer: 'sgd',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  
  return mockModel;
};

/**
 * Generate random heatmap tensor for mock visualization
 * @param {number} height - Height of the heatmap
 * @param {number} width - Width of the heatmap
 * @returns {tf.Tensor2D} - A tensor with random heatmap data
 */
const createMockHeatmap = (height, width) => {
  // Create a tensor with random values for the heatmap
  return tf.tidy(() => {
    // Create a basic heatmap with a single hotspot
    const centerY = Math.floor(height * (0.3 + Math.random() * 0.4)); // Random center point in middle area
    const centerX = Math.floor(width * (0.3 + Math.random() * 0.4));
    
    // Create array to hold heatmap values
    const heatmapArray = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        // Calculate distance from center (squared)
        const distSquared = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
        // Use exponential falloff from center
        const value = Math.exp(-distSquared / (width * height * 0.01));
        row.push(value);
      }
      heatmapArray.push(row);
    }
    
    // Convert to tensor
    return tf.tensor2d(heatmapArray);
  });
};

/**
 * Load a TensorFlow.js model for client-side visualization
 * @param {string} modelUrl - URL of the model
 * @returns {Promise<tf.LayersModel>} - The loaded model
 */
export const loadModel = async (modelUrl) => {
  try {
    // In mock mode, return a mock model
    if (MOCK_MODE) {
      console.log('Using mock model for visualization');
      return createMockModel();
    }
    
    // Load the model using the URL
    const model = await tf.loadLayersModel(modelUrl);
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    if (MOCK_MODE) {
      console.log('Falling back to mock model after error');
      return createMockModel();
    }
    throw error;
  }
};

/**
 * Preprocess an image for model input
 * @param {HTMLImageElement} imageElement - The image element
 * @param {Object} options - Processing options (width, height, channels)
 * @returns {tf.Tensor} - Processed tensor ready for prediction
 */
export const preprocessImage = (imageElement, options) => {
  try {
    const { width, height, channels } = options;
    
    // Convert the image to a tensor
    let imageTensor = tf.browser.fromPixels(imageElement, channels);
    
    // Resize the image if needed
    if (width && height) {
      imageTensor = tf.image.resizeBilinear(imageTensor, [height, width]);
    }
    
    // Normalize the values to [0, 1]
    const normalizedTensor = imageTensor.toFloat().div(tf.scalar(255));
    
    // Add batch dimension [1, height, width, channels]
    const batchedTensor = normalizedTensor.expandDims(0);
    
    return batchedTensor;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw error;
  }
};

/**
 * Run prediction on an image using a model
 * @param {tf.LayersModel} model - The TensorFlow.js model
 * @param {HTMLImageElement} imageElement - The image element
 * @param {Object} options - Processing options
 * @param {Array<string>} labels - Array of class labels
 * @returns {Object} - Prediction results
 */
export const runPrediction = async (model, imageElement, options, labels) => {
  try {
    // Preprocess the image
    const processedImage = preprocessImage(imageElement, options);
    
    // Run prediction
    const predictions = await model.predict(processedImage);
    
    // Get prediction data
    const predictionData = await predictions.data();
    
    // Convert to array and find the index with highest probability
    const predictionArray = Array.from(predictionData);
    const maxIndex = predictionArray.indexOf(Math.max(...predictionArray));
    
    // Get the label and confidence
    const label = labels[maxIndex];
    const confidence = predictionArray[maxIndex] * 100;
    
    // Cleanup tensors to prevent memory leaks
    tf.dispose([processedImage, predictions]);
    
    return {
      label,
      confidence,
      allPredictions: predictionArray.map((prob, i) => ({
        label: labels[i],
        probability: prob * 100,
      })),
    };
  } catch (error) {
    console.error('Error running prediction:', error);
    throw error;
  }
};

/**
 * Generate a heatmap visualization for an image classification model
 * (Gradient-weighted Class Activation Mapping)
 * @param {tf.LayersModel} model - The TensorFlow.js model
 * @param {HTMLImageElement} imageElement - The image element
 * @param {Object} options - Processing options
 * @param {number} classIndex - The class index to generate heatmap for
 * @returns {tf.Tensor3D} - Heatmap tensor
 */
export const generateHeatmap = async (model, imageElement, options, classIndex) => {
  // Note: This is a simplified implementation and may not work with all models
  // A full implementation would require access to the model's internal layers
  try {
    // In mock mode, create a random heatmap tensor
    if (MOCK_MODE) {
      console.log('Generating mock heatmap for visualization');
      const { width, height } = options;
      return createMockHeatmap(height, width);
    }
    
    // Get the last convolutional layer
    const lastConvLayer = model.layers.find(
      layer => layer.getClassName().toLowerCase().includes('conv')
    );
    
    if (!lastConvLayer) {
      if (MOCK_MODE) {
        console.log('No convolutional layer found. Using mock heatmap');
        const { width, height } = options;
        return createMockHeatmap(height, width);
      }
      throw new Error('No convolutional layer found in the model');
    }
    
    // Create a model that outputs the last conv layer's activations
    const convModel = tf.model({
      inputs: model.inputs,
      outputs: lastConvLayer.output,
    });
    
    // Preprocess the image
    const processedImage = preprocessImage(imageElement, options);
    
    // Get the last conv layer outputs
    const convOutputs = convModel.predict(processedImage);
    
    // Get the prediction for the target class
    const predictions = model.predict(processedImage);
    const classOutput = predictions.gather([classIndex], 1);
    
    // Compute the gradients of the class output with respect to the conv outputs
    const grads = tf.grad(x => {
      return model.predict(x).gather([classIndex], 1);
    })(processedImage);
    
    // Calculate the heatmap
    const pooledGrads = tf.mean(grads, [0, 1, 2]);
    
    // Multiply the activation maps with the gradients
    const weightedActivations = tf.mul(
      convOutputs,
      pooledGrads.reshape([1, 1, 1, pooledGrads.shape[0]])
    );
    
    // Average the weighted activations across channels
    const heatmap = tf.mean(weightedActivations, -1);
    
    // Normalize the heatmap
    const normalizedHeatmap = tf.div(
      tf.sub(heatmap, tf.min(heatmap)),
      tf.sub(tf.max(heatmap), tf.min(heatmap))
    ).squeeze();
    
    // Cleanup tensors
    tf.dispose([
      processedImage, convOutputs, predictions, classOutput, grads, pooledGrads, weightedActivations, heatmap
    ]);
    
    return normalizedHeatmap;
  } catch (error) {
    console.error('Error generating heatmap:', error);
    if (MOCK_MODE) {
      console.log('Error in heatmap generation. Using mock heatmap');
      const { width, height } = options;
      return createMockHeatmap(height, width);
    }
    throw error;
  }
};

/**
 * Draw the heatmap on a canvas, overlaid on the original image
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 * @param {HTMLImageElement} imageElement - The original image
 * @param {tf.Tensor} heatmapTensor - The heatmap tensor (2D)
 */
export const drawHeatmapOnCanvas = async (canvas, imageElement, heatmapTensor) => {
  try {
    // Check if we're in mock mode and should create a fake visualization
    if (MOCK_MODE && (!imageElement || !imageElement.complete || imageElement.naturalWidth === 0)) {
      console.log('Using fallback drawing in mock mode');
      drawMockHeatmap(canvas);
      return;
    }
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the original image if valid
    const validImage = imageElement && 
                      imageElement.complete && 
                      imageElement.naturalWidth > 0;
    
    if (validImage) {
      // Draw original image
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    } else {
      // Use a fallback background
      console.warn('Invalid image for heatmap, using fallback');
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text explanation
      ctx.fillStyle = '#666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Image unavailable', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '12px Arial';
      ctx.fillText('Using simulated heatmap', canvas.width / 2, canvas.height / 2 + 15);
    }
    
    // Get heatmap data
      const heatmapData = await heatmapTensor.array();
      
    // Create a temporary canvas for the heatmap
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = heatmapData.length;
    tempCanvas.height = heatmapData[0].length;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Create ImageData for the heatmap
    const imageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);
    
    // Fill the image data with heatmap values
    let max = 0;
    for (let i = 0; i < heatmapData.length; i++) {
      for (let j = 0; j < heatmapData[i].length; j++) {
        max = Math.max(max, heatmapData[i][j]);
      }
    }
    
    // Normalize and convert to RGBA
    for (let i = 0; i < heatmapData.length; i++) {
      for (let j = 0; j < heatmapData[i].length; j++) {
        const value = heatmapData[i][j] / max; // Normalize to [0, 1]
        const index = (i * heatmapData[i].length + j) * 4;
        
        // Create a red heatmap with varying transparency
        imageData.data[index] = 255; // R
        imageData.data[index + 1] = 0; // G
        imageData.data[index + 2] = 0; // B
        imageData.data[index + 3] = Math.floor(value * 180); // A (transparency)
      }
    }
    
    // Put the heatmap data on the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);
    
    // Draw the heatmap on the main canvas with scaling
    ctx.globalAlpha = 0.6;
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    
    // Add legend
    drawHeatmapLegend(ctx, canvas.width, canvas.height);
    
    // Clean up
    if (heatmapTensor) {
      heatmapTensor.dispose();
    }
  } catch (error) {
    console.error('Error drawing heatmap:', error);
    
    // Fall back to a simple mock heatmap
    drawMockHeatmap(canvas);
  }
};

/**
 * Draw a mock heatmap when visualization fails
 * @param {HTMLCanvasElement} canvas - The canvas to draw on
 */
const drawMockHeatmap = (canvas) => {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw gray background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);
  
  // Add text to explain it's a simulation
  ctx.fillStyle = '#666';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Simulation Mode', width / 2, 30);
  
  // Draw fake hotspot in the center
  const centerX = width * 0.5;
  const centerY = height * 0.45;
  const radius = Math.min(width, height) * 0.25;
  
  // Create radial gradient for hotspot
  const gradient = ctx.createRadialGradient(
    centerX, centerY, radius * 0.1,
    centerX, centerY, radius
  );
  
  gradient.addColorStop(0, 'rgba(255,0,0,0.8)');
  gradient.addColorStop(1, 'rgba(255,0,0,0)');
  
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
  // Add legend
  drawHeatmapLegend(ctx, width, height);
};

/**
 * Draw a heatmap color legend
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
const drawHeatmapLegend = (ctx, width, height) => {
  const legendHeight = 20;
  const legendWidth = width * 0.8;
  const legendX = (width - legendWidth) / 2;
  const legendY = height - legendHeight - 20;
  
  // Draw legend background
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(legendX - 5, legendY - 5, legendWidth + 10, legendHeight + 30);
  
  // Create gradient for legend
  const gradient = ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
  gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,0,0,0.8)');
  
  // Draw gradient bar
  ctx.fillStyle = gradient;
  ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
  
  // Add labels
  ctx.fillStyle = 'black';
  ctx.font = '12px Arial';
      ctx.textAlign = 'center';
  ctx.fillText('Attention Map', width / 2, legendY - 10);
  
  ctx.textAlign = 'left';
  ctx.fillText('Low', legendX, legendY + legendHeight + 15);
  
  ctx.textAlign = 'right';
  ctx.fillText('High', legendX + legendWidth, legendY + legendHeight + 15);
}; 