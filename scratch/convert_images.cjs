const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'src', 'assets');

const files = [
  'feature-geofence.jpg',
  'feature-staff-list.jpg',
  'hero-dashboard.jpg',
  'hero-mobile.jpg',
  'location-permission-guide.jpeg',
  'play-store-app-listing.jpeg'
];

async function convert() {
  console.log("Starting Image Compression and WebP Conversion...");
  for (const file of files) {
    const inputPath = path.join(assetsDir, file);
    if (!fs.existsSync(inputPath)) {
      console.warn(`File not found: ${inputPath}`);
      continue;
    }
    const filenameNoExt = path.basename(file, path.extname(file));
    const outputPath = path.join(assetsDir, `${filenameNoExt}.webp`);

    console.log(`Converting ${file} -> ${filenameNoExt}.webp...`);
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    const oldStats = fs.statSync(inputPath);
    const newStats = fs.statSync(outputPath);
    const ratio = ((1 - newStats.size / oldStats.size) * 100).toFixed(1);
    console.log(`[DONE] ${file}: ${oldStats.size} bytes -> ${newStats.size} bytes (Reduced by ${ratio}%)`);
  }
}

convert().then(() => console.log("Conversion complete!")).catch(console.error);
