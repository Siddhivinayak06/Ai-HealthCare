const https = require('https');
const fs = require('fs');
const path = require('path');

// Sample image URLs and their destinations
const images = [
  {
    url: 'https://openi.nlm.nih.gov/imgs/512/0/0/0000001_0000001_0000000.png',
    category: 'xray',
    filename: 'chest-xray-normal.jpg'
  },
  {
    url: 'https://openi.nlm.nih.gov/imgs/512/0/0/0000001_0000001_0000001.png',
    category: 'xray',
    filename: 'chest-xray-pneumonia.jpg'
  },
  {
    url: 'https://openi.nlm.nih.gov/imgs/512/0/0/0000001_0000001_0000002.png',
    category: 'xray',
    filename: 'chest-xray-tuberculosis.jpg'
  },
  {
    url: 'https://openi.nlm.nih.gov/imgs/512/0/0/0000001_0000001_0000003.png',
    category: 'mri',
    filename: 'brain-mri-normal.jpg'
  },
  {
    url: 'https://openi.nlm.nih.gov/imgs/512/0/0/0000001_0000001_0000004.png',
    category: 'mri',
    filename: 'brain-mri-tumor.jpg'
  },
  {
    url: 'https://openi.nlm.nih.gov/imgs/512/0/0/0000001_0000001_0000005.png',
    category: 'mri',
    filename: 'spine-mri-normal.jpg'
  },
  {
    url: 'https://openi.nlm.nih.gov/imgs/512/0/0/0000001_0000001_0000006.png',
    category: 'ct-scan',
    filename: 'chest-ct-normal.jpg'
  },
  {
    url: 'https://openi.nlm.nih.gov/imgs/512/0/0/0000001_0000001_0000007.png',
    category: 'ct-scan',
    filename: 'chest-ct-cancer.jpg'
  },
  {
    url: 'https://openi.nlm.nih.gov/imgs/512/0/0/0000001_0000001_0000008.png',
    category: 'ct-scan',
    filename: 'abdomen-ct-normal.jpg'
  }
];

// Base directory for sample images
const baseDir = path.join(__dirname, '..', 'client', 'public', 'sample-images');

// Create directories if they don't exist
const categories = ['xray', 'mri', 'ct-scan'];
categories.forEach(category => {
  const dir = path.join(baseDir, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Function to download an image
function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(dest, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Download all images
async function downloadAllImages() {
  console.log('Starting image downloads...');
  
  for (const image of images) {
    const dest = path.join(baseDir, image.category, image.filename);
    
    try {
      console.log(`Downloading ${image.filename}...`);
      await downloadImage(image.url, dest);
      console.log(`Successfully downloaded ${image.filename}`);
    } catch (error) {
      console.error(`Error downloading ${image.filename}:`, error.message);
    }
  }
  
  console.log('All downloads completed!');
}

// Run the script
downloadAllImages().catch(console.error); 