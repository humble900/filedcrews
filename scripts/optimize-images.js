import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const imagesToOptimize = [
  {
    input: path.join(projectRoot, 'public/images/plumber-sink.jpg'),
    output: path.join(projectRoot, 'public/images/plumber-sink.webp'),
    maxWidth: 800,
    quality: 75,
    mobileOutput: path.join(projectRoot, 'public/images/plumber-sink-sm.webp'),
    mobileWidth: 480,
  },
  {
    input: path.join(projectRoot, 'public/hvac-technician.jpg'),
    output: path.join(projectRoot, 'public/hvac-technician.webp'),
    maxWidth: 800,
    quality: 75,
    mobileOutput: path.join(projectRoot, 'public/hvac-technician-sm.webp'),
    mobileWidth: 480,
  },
  {
    input: path.join(projectRoot, 'public/images/electrician-panel.jpg'),
    output: path.join(projectRoot, 'public/images/electrician-panel.webp'),
    maxWidth: 800,
    quality: 75,
    mobileOutput: path.join(projectRoot, 'public/images/electrician-panel-sm.webp'),
    mobileWidth: 480,
  },
  {
    input: path.join(projectRoot, 'public/images/fleet-vans.jpg'),
    output: path.join(projectRoot, 'public/images/fleet-vans.webp'),
    maxWidth: 800,
    quality: 75,
    mobileOutput: path.join(projectRoot, 'public/images/fleet-vans-sm.webp'),
    mobileWidth: 480,
  },
  {
    input: path.join(projectRoot, 'public/images/hvac-security.jpg'),
    output: path.join(projectRoot, 'public/images/hvac-security.webp'),
    maxWidth: 800,
    quality: 75,
    mobileOutput: path.join(projectRoot, 'public/images/hvac-security-sm.webp'),
    mobileWidth: 480,
  },
  {
    input: path.join(projectRoot, 'public/images/tech-tablet.jpg'),
    output: path.join(projectRoot, 'public/images/tech-tablet.webp'),
    maxWidth: 800,
    quality: 75,
    mobileOutput: path.join(projectRoot, 'public/images/tech-tablet-sm.webp'),
    mobileWidth: 480,
  },
  {
    input: path.join(projectRoot, 'public/field_team_sidebar.jpg'),
    output: path.join(projectRoot, 'public/field_team_sidebar.webp'),
    maxWidth: 700,
    quality: 75,
  }
];

async function optimize() {
  console.log('⚡ Starting image optimization pipeline (converting JPG to multi-resolution WebP)...');
  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const img of imagesToOptimize) {
    if (fs.existsSync(img.input)) {
      const originalStat = fs.statSync(img.input);
      totalOriginal += originalStat.size;

      // Standard desktop/retina version
      await sharp(img.input)
        .resize({ width: img.maxWidth, withoutEnlargement: true })
        .webp({ quality: img.quality, effort: 6 })
        .toFile(img.output);

      const optimizedStat = fs.statSync(img.output);
      totalOptimized += optimizedStat.size;

      const savingPct = (((originalStat.size - optimizedStat.size) / originalStat.size) * 100).toFixed(1);
      console.log(
        `✓ ${path.basename(img.input)} (${(originalStat.size / 1024).toFixed(1)} kB) -> ${path.basename(img.output)} (${(optimizedStat.size / 1024).toFixed(1)} kB) [Saved ${savingPct}%]`
      );

      // Mobile variant if configured
      if (img.mobileOutput && img.mobileWidth) {
        await sharp(img.input)
          .resize({ width: img.mobileWidth, withoutEnlargement: true })
          .webp({ quality: img.quality, effort: 6 })
          .toFile(img.mobileOutput);

        const mobileStat = fs.statSync(img.mobileOutput);
        console.log(
          `  └─ Mobile: ${path.basename(img.mobileOutput)} (${(mobileStat.size / 1024).toFixed(1)} kB)`
        );
      }
    }
  }

  const totalSavedMB = ((totalOriginal - totalOptimized) / (1024 * 1024)).toFixed(2);
  const totalSavedPct = (((totalOriginal - totalOptimized) / totalOriginal) * 100).toFixed(1);
  console.log(`\n🎉 Image Optimization Complete: Saved ${totalSavedMB} MB (${totalSavedPct}% reduction)!`);
}

optimize().catch(err => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
