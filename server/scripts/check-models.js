const fs = require('fs');
const path = require('path');

// Get the absolute path to the ml-models directory
const modelsDir = path.resolve(__dirname, '../../ml-models');
console.log('Models directory:', modelsDir);

// Check if the directory exists
if (!fs.existsSync(modelsDir)) {
  console.error('Error: ml-models directory does not exist!');
  process.exit(1);
}

// List all directories in ml-models
const items = fs.readdirSync(modelsDir);
console.log('Items in models directory:', items);

// Check each model directory
for (const item of items) {
  const itemPath = path.join(modelsDir, item);
  
  // Check if it's a directory
  if (fs.statSync(itemPath).isDirectory()) {
    console.log(`\nChecking model: ${item}`);
    
    // Check for model.json
    const modelJsonPath = path.join(itemPath, 'model.json');
    if (fs.existsSync(modelJsonPath)) {
      console.log(`- model.json exists`);
      
      // Try to read and parse the model.json file
      try {
        const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
        console.log(`- model.json parsed successfully`);
        
        // Check if metadata exists
        if (modelJson.metadata) {
          console.log(`- Metadata found:`);
          console.log(`  * Description: ${modelJson.metadata.description}`);
          console.log(`  * Model Type: ${modelJson.metadata.modelType}`);
          console.log(`  * Labels: ${modelJson.metadata.labels.join(', ')}`);
        } else {
          console.warn(`- WARNING: No metadata in model.json`);
        }
        
        // Check for weights manifest
        if (modelJson.weightsManifest && modelJson.weightsManifest.length > 0) {
          const weightFiles = modelJson.weightsManifest[0].paths;
          console.log(`- Weight files specified: ${weightFiles.join(', ')}`);
          
          // Check each weight file
          for (const weightFile of weightFiles) {
            const weightPath = path.join(itemPath, weightFile);
            if (fs.existsSync(weightPath)) {
              console.log(`  * ${weightFile} exists`);
            } else {
              console.error(`  * ERROR: ${weightFile} is missing!`);
            }
          }
        } else {
          console.warn(`- WARNING: No weights manifest found`);
        }
        
      } catch (error) {
        console.error(`- ERROR: Failed to parse model.json: ${error.message}`);
      }
    } else {
      console.error(`- ERROR: model.json missing!`);
    }
  }
}

console.log('\nModel check completed.'); 