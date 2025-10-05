const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Dataset = require('../../models/Dataset');

// Directory for training data
const TRAINING_DATA_DIR = path.join(__dirname, '../../training-data');

/**
 * Ensure dataset directories exist
 * @param {string} datasetName - Name of the dataset
 * @param {Array<string>} classes - Array of class names
 */
function ensureDatasetDirectories(datasetName, classes) {
  // Create main dataset directories
  const dirs = [
    TRAINING_DATA_DIR,
    path.join(TRAINING_DATA_DIR, datasetName),
    path.join(TRAINING_DATA_DIR, datasetName, 'train'),
    path.join(TRAINING_DATA_DIR, datasetName, 'validation'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create class subdirectories in both train and validation directories
  classes.forEach(className => {
    const trainClassDir = path.join(TRAINING_DATA_DIR, datasetName, 'train', className);
    const validationClassDir = path.join(TRAINING_DATA_DIR, datasetName, 'validation', className);

    if (!fs.existsSync(trainClassDir)) {
      fs.mkdirSync(trainClassDir, { recursive: true });
    }

    if (!fs.existsSync(validationClassDir)) {
      fs.mkdirSync(validationClassDir, { recursive: true });
    }
  });
}

/**
 * Create a new dataset in the database and filesystem
 * @param {Object} datasetInfo - Dataset information
 * @param {string} userId - ID of user creating dataset
 * @returns {Promise<Object>} - Created dataset
 */
async function createDataset(datasetInfo, userId) {
  try {
    const { name, description, type, classes } = datasetInfo;
    
    // Check if dataset with the same name already exists
    const existingDataset = await Dataset.findOne({ name });
    if (existingDataset) {
      throw new Error(`Dataset with name "${name}" already exists`);
    }
    
    // Initialize class information
    const classesData = classes.map(className => ({
      name: className,
      count: 0,
      description: '',
    }));
    
    // Create dataset record
    const dataset = await Dataset.create({
      name,
      description,
      type,
      classes: classesData,
      totalSamples: 0,
      trainSamples: 0,
      validationSamples: 0,
      path: path.join(TRAINING_DATA_DIR, name),
      status: 'creating',
      createdBy: userId,
      lastUpdatedBy: userId,
    });
    
    // Create dataset directories
    ensureDatasetDirectories(name, classes);
    
    // Update status to ready
    dataset.status = 'ready';
    await dataset.save();
    
    return dataset;
  } catch (error) {
    console.error('Error creating dataset:', error);
    throw error;
  }
}

/**
 * Add images to a dataset
 * @param {string} datasetId - ID of the dataset
 * @param {string} className - Class name to add images to
 * @param {Array<Object>} files - Array of file objects
 * @param {string} split - Whether to add to 'train' or 'validation'
 * @param {string} userId - ID of user adding images
 * @returns {Promise<Object>} - Updated dataset
 */
async function addImagesToDataset(datasetId, className, files, split, userId) {
  try {
    // Get dataset
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      throw new Error(`Dataset with ID ${datasetId} not found`);
    }
    
    // Check if class exists
    const classIndex = dataset.classes.findIndex(c => c.name === className);
    if (classIndex === -1) {
      throw new Error(`Class "${className}" not found in dataset "${dataset.name}"`);
    }
    
    // Update dataset status
    dataset.status = 'updating';
    dataset.lastUpdatedBy = userId;
    await dataset.save();
    
    // Process and save each image
    const processedCount = await processAndSaveImages(
      dataset.name,
      className,
      files,
      split
    );
    
    // Update dataset information
    dataset.classes[classIndex].count += processedCount;
    dataset.totalSamples += processedCount;
    
    if (split === 'train') {
      dataset.trainSamples += processedCount;
    } else {
      dataset.validationSamples += processedCount;
    }
    
    dataset.status = 'ready';
    await dataset.save();
    
    return dataset;
  } catch (error) {
    console.error('Error adding images to dataset:', error);
    
    // Update dataset status to error if it exists
    if (datasetId) {
      try {
        await Dataset.findByIdAndUpdate(datasetId, { status: 'error' });
      } catch (err) {
        console.error('Error updating dataset status:', err);
      }
    }
    
    throw error;
  }
}

/**
 * Process and save images to the dataset directory
 * @param {string} datasetName - Name of the dataset
 * @param {string} className - Class name
 * @param {Array<Object>} files - Array of file objects
 * @param {string} split - 'train' or 'validation'
 * @returns {Promise<number>} - Number of successfully processed images
 */
async function processAndSaveImages(datasetName, className, files, split) {
  // Target directory for the class
  const targetDir = path.join(TRAINING_DATA_DIR, datasetName, split, className);
  
  // Process each file
  const promises = files.map(async (file, index) => {
    try {
      // Generate a unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${index}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const targetPath = path.join(targetDir, filename);
      
      // Read the uploaded file
      const fileData = fs.readFileSync(file.path);
      
      // Process and save the image (resize to reasonable dimensions)
      await sharp(fileData)
        .resize(299, 299, { fit: 'cover' })
        .toFile(targetPath);
      
      // Delete the original temporary file
      fs.unlinkSync(file.path);
      
      return true;
    } catch (error) {
      console.error(`Error processing image ${file.originalname}:`, error);
      return false;
    }
  });
  
  // Wait for all processing to complete
  const results = await Promise.all(promises);
  
  // Return count of successfully processed images
  return results.filter(Boolean).length;
}

/**
 * Get dataset statistics
 * @param {string} datasetId - ID of the dataset
 * @returns {Promise<Object>} - Dataset statistics
 */
async function getDatasetStats(datasetId) {
  try {
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      throw new Error(`Dataset with ID ${datasetId} not found`);
    }
    
    const datasetDir = path.join(TRAINING_DATA_DIR, dataset.name);
    const stats = {
      name: dataset.name,
      type: dataset.type,
      totalSamples: 0,
      trainSamples: 0,
      validationSamples: 0,
      classes: [],
    };
    
    // Count samples in each class
    for (const classInfo of dataset.classes) {
      const className = classInfo.name;
      const trainDir = path.join(datasetDir, 'train', className);
      const validationDir = path.join(datasetDir, 'validation', className);
      
      const trainFiles = fs.existsSync(trainDir) 
        ? fs.readdirSync(trainDir).filter(file => file.match(/\.(jpg|jpeg|png)$/i))
        : [];
        
      const validationFiles = fs.existsSync(validationDir)
        ? fs.readdirSync(validationDir).filter(file => file.match(/\.(jpg|jpeg|png)$/i))
        : [];
      
      const trainCount = trainFiles.length;
      const validationCount = validationFiles.length;
      const totalCount = trainCount + validationCount;
      
      stats.classes.push({
        name: className,
        trainCount,
        validationCount,
        totalCount,
      });
      
      stats.trainSamples += trainCount;
      stats.validationSamples += validationCount;
      stats.totalSamples += totalCount;
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting dataset stats:', error);
    throw error;
  }
}

/**
 * Delete a dataset
 * @param {string} datasetId - ID of the dataset to delete
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
async function deleteDataset(datasetId) {
  try {
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      throw new Error(`Dataset with ID ${datasetId} not found`);
    }
    
    // Delete dataset directory
    const datasetDir = path.join(TRAINING_DATA_DIR, dataset.name);
    if (fs.existsSync(datasetDir)) {
      fs.rmdirSync(datasetDir, { recursive: true });
    }
    
    // Delete dataset from database
    await Dataset.findByIdAndDelete(datasetId);
    
    return true;
  } catch (error) {
    console.error('Error deleting dataset:', error);
    throw error;
  }
}

module.exports = {
  createDataset,
  addImagesToDataset,
  getDatasetStats,
  deleteDataset,
  ensureDatasetDirectories,
}; 