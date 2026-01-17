const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './assets/galery';
const outputDir = './assets/galery-compressed';

// Buat folder output jika belum ada
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function compressImage(inputPath, outputPath, filename) {
  try {
    const ext = path.extname(filename).toLowerCase();
    let pipeline = sharp(inputPath);
    
    // Resize jika terlalu besar (max 1200px width)
    const metadata = await sharp(inputPath).metadata();
    if (metadata.width > 1200) {
      pipeline = pipeline.resize(1200, null, { withoutEnlargement: true });
    }
    
    // Compress berdasarkan format
    if (ext === '.jpg' || ext === '.jpeg') {
      await pipeline.jpeg({ quality: 75, mozjpeg: true }).toFile(outputPath);
    } else if (ext === '.png') {
      await pipeline.png({ quality: 75, compressionLevel: 9 }).toFile(outputPath);
    } else if (ext === '.webp') {
      await pipeline.webp({ quality: 75 }).toFile(outputPath);
    } else {
      // Convert lainnya ke jpg
      const newOutput = outputPath.replace(ext, '.jpg');
      await pipeline.jpeg({ quality: 75, mozjpeg: true }).toFile(newOutput);
      return path.basename(newOutput);
    }
    return filename;
  } catch (err) {
    console.error(`Error: ${filename} - ${err.message}`);
    return null;
  }
}

async function main() {
  const files = fs.readdirSync(inputDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  
  console.log(`Found ${imageFiles.length} images to compress...`);
  
  let processed = 0;
  let totalSaved = 0;
  
  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    
    const originalSize = fs.statSync(inputPath).size;
    const result = await compressImage(inputPath, outputPath, file);
    
    if (result) {
      const newSize = fs.statSync(path.join(outputDir, result)).size;
      const saved = originalSize - newSize;
      totalSaved += saved;
      processed++;
      
      const percent = ((saved / originalSize) * 100).toFixed(1);
      console.log(`[${processed}/${imageFiles.length}] ${file}: ${(originalSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB (-${percent}%)`);
    }
  }
  
  console.log(`\nDone! Compressed ${processed} images.`);
  console.log(`Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

main();
