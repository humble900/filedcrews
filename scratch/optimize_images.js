import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeImages() {
  console.log("Starting image optimization...");

  // 1. Optimize favicon.png
  const faviconPath = path.join(__dirname, '../public/favicon.png');
  if (fs.existsSync(faviconPath)) {
    const origSize = fs.statSync(faviconPath).size;
    const inputBuf = fs.readFileSync(faviconPath);
    const buf = await sharp(inputBuf)
      .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, quality: 85, palette: true })
      .toBuffer();
    fs.writeFileSync(faviconPath, buf);
    const newSize = fs.statSync(faviconPath).size;
    console.log(`Favicon optimized: ${(origSize/1024).toFixed(1)} KB -> ${(newSize/1024).toFixed(1)} KB`);
  }

  // 2. Optimize field_team_sidebar.jpg
  const sidebarPath = path.join(__dirname, '../public/field_team_sidebar.jpg');
  if (fs.existsSync(sidebarPath)) {
    const origSize = fs.statSync(sidebarPath).size;
    const inputBuf = fs.readFileSync(sidebarPath);
    const buf = await sharp(inputBuf)
      .resize(600, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
    fs.writeFileSync(sidebarPath, buf);
    const newSize = fs.statSync(sidebarPath).size;
    console.log(`Sidebar image optimized: ${(origSize/1024).toFixed(1)} KB -> ${(newSize/1024).toFixed(1)} KB`);
  }

  // 3. Optimize public/presets/
  const presetsDir = path.join(__dirname, '../public/presets');
  if (fs.existsSync(presetsDir)) {
    const files = fs.readdirSync(presetsDir);
    for (const f of files) {
      if (f.endsWith('.jpg') || f.endsWith('.png')) {
        const fp = path.join(presetsDir, f);
        const origSize = fs.statSync(fp).size;
        const inputBuf = fs.readFileSync(fp);
        const buf = await sharp(inputBuf)
          .resize(800, null, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 75, progressive: true, mozjpeg: true })
          .toBuffer();
        fs.writeFileSync(fp, buf);
        const newSize = fs.statSync(fp).size;
        console.log(`Preset ${f}: ${(origSize/1024).toFixed(1)} KB -> ${(newSize/1024).toFixed(1)} KB`);
      }
    }
  }

  // 4. Optimize src/assets/ WebP files
  const assetsDir = path.join(__dirname, '../src/assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    for (const f of files) {
      if (f.endsWith('.webp')) {
        const fp = path.join(assetsDir, f);
        const origSize = fs.statSync(fp).size;
        const inputBuf = fs.readFileSync(fp);
        const buf = await sharp(inputBuf)
          .webp({ quality: 80, effort: 6 })
          .toBuffer();
        fs.writeFileSync(fp, buf);
        const newSize = fs.statSync(fp).size;
        console.log(`Asset ${f}: ${(origSize/1024).toFixed(1)} KB -> ${(newSize/1024).toFixed(1)} KB`);
      }
    }
  }

  console.log("Image optimization complete!");
}

optimizeImages().catch(err => {
  console.error("Optimization failed:", err);
  process.exit(1);
});
