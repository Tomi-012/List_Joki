const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './assets/galery';
const outputDir = './assets/galery-compressed';

// Buat folder output jika belum ada
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processImage(inputPath, outputPath, filename) {
  try {
    const metadata = await sharp(inputPath).metadata();
    
    // Jika gambar lebih besar dari 1920px, resize saja (tanpa ubah kualitas)
    if (metadata.width > 1920) {
      const ext = path.extname(filename).toLowerCase();
      
      if (ext === '.jpg' || ext === '.jpeg') {
        await sharp(inputPath)
          .resize(1920, null, { withoutEnlargement: true })
          .jpeg({ quality: 100 })
          .toFile(outputPath);
      } else if (ext === '.png') {
        await sharp(inputPath)
          .resize(1920, null, { withoutEnlargement: true })
          .png({ compressionLevel: 9 })
          .toFile(outputPath);
      } else if (ext === '.webp') {
        await sharp(inputPath)
          .resize(1920, null, { withoutEnlargement: true })
          .webp({ quality: 100, lossless: true })
          .toFile(outputPath);
      } else {
        // Format lain, copy langsung
        fs.copyFileSync(inputPath, outputPath);
      }
      return 'resized';
    } else {
      // Gambar sudah kecil, copy langsung tanpa proses (kualitas 100% sama)
      fs.copyFileSync(inputPath, outputPath);
      return 'copied';
    }
  } catch (err) {
    console.error(`Error: ${filename} - ${err.message}`);
    // Jika error, copy file asli
    fs.copyFileSync(inputPath, outputPath);
    return 'copied';
  }
}

async function main() {
  const files = fs.readdirSync(inputDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  
  console.log(`Found ${imageFiles.length} images to process...`);
  
  let resized = 0;
  let copied = 0;
  let totalSaved = 0;
  
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    
    const originalSize = fs.statSync(inputPath).size;
    const result = await processImage(inputPath, outputPath, file);
    const newSize = fs.statSync(outputPath).size;
    
    if (result === 'resized') {
      resized++;
      const saved = originalSize - newSize;
      totalSaved += saved;
      console.log(`[${i+1}/${imageFiles.length}] ${file}: RESIZED ${(originalSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB`);
    } else {
      copied++;
      console.log(`[${i+1}/${imageFiles.length}] ${file}: COPIED (${(originalSize/1024).toFixed(0)}KB)`);
    }
  }
  
  console.log(`\nDone!`);
  console.log(`- Resized: ${resized} images (saved ${(totalSaved / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`- Copied: ${copied} images (100% original quality)`);
}

main();
