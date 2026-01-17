const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
const galleryFile = path.join(__dirname, 'gallery-raiden', 'index.html');

console.log('Reading contents of:', assetsDir);
console.log('Target file:', galleryFile);

// Extensions to include
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Read assets directory
fs.readdir(assetsDir, (err, files) => {
    if (err) {
        console.error('Error reading assets directory:', err);
        return;
    }

    // Filter images
    const images = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
    });

    console.log(`Found ${images.length} images.`);

    // Generate HTML for grid items
    const galleryHTML = images.map(img => `
        <div class="gallery-item">
            <img src="../assets/${img}" loading="lazy" alt="Gallery Image">
            <div class="gallery-overlay"></div>
        </div>`).join('');

    // Read existing HTML
    fs.readFile(galleryFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading gallery file:', err);
            return;
        }

        const startMarker = '<div class="gallery-grid">';
        const startIdx = data.indexOf(startMarker);

        if (startIdx === -1) {
            console.error('Could not find gallery-grid div');
            return;
        }

        const contentStart = startIdx + startMarker.length;

        // Find matching closing div
        let openDivs = 1;
        let currentIdx = contentStart;

        while (currentIdx < data.length && openDivs > 0) {
            const nextOpen = data.indexOf('<div', currentIdx);
            const nextClose = data.indexOf('</div>', currentIdx);

            if (nextClose === -1) {
                console.error('Could not find closing div');
                return;
            }

            if (nextOpen !== -1 && nextOpen < nextClose) {
                openDivs++;
                currentIdx = nextOpen + 4;
            } else {
                openDivs--;
                currentIdx = nextClose + 6;
            }
        }

        // currentIdx is now after the closing </div> of <div class="gallery-grid">
        // We want to insert BEFORE that closing div.
        // Wait, my logic above: openDivs starts at 1 (the gallery-grid itself).
        // When openDivs hits 0, currentIdx is AFTER the closing `</div>` of the gallery-grid.

        // So the closing tag is at `currentIdx - 6`.
        // We want to replace everything between `contentStart` and `currentIdx - 6`.

        const before = data.substring(0, contentStart);
        const after = data.substring(currentIdx - 6);

        const newData = before + galleryHTML + after;

        fs.writeFile(galleryFile, newData, 'utf8', (err) => {
            if (err) console.error('Error writing file:', err);
            else console.log('Gallery updated successfully with', images.length, 'images.');
        });
    });
});
