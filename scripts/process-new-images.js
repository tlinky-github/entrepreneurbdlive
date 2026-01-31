
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/PC 02/.gemini/antigravity/brain/fcdefa3c-a03a-41b2-873e-9636d41f79d7';
const PUBLIC_DIR = path.join(__dirname, '../public/images');

const images = [
    {
        input: 'govt_initiatives_1769841746802.png',
        output: 'govt-initiatives.webp'
    },
    {
        input: 'sme_development_1769841765988.png',
        output: 'sme-development.webp'
    },
    {
        input: 'time_management_1769841782999.png',
        output: 'time-management.webp'
    },
    {
        input: 'ecommerce_regulations_1769841799251.png',
        output: 'ecommerce-regulations.webp'
    },
    {
        input: 'freelancing_future_1769841814897.png',
        output: 'freelancing.webp'
    }
];

async function processImages() {
    if (!fs.existsSync(PUBLIC_DIR)) {
        fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    for (const img of images) {
        const inputPath = path.join(ARTIFACTS_DIR, img.input);
        const outputPath = path.join(PUBLIC_DIR, img.output);

        try {
            if (!fs.existsSync(inputPath)) {
                console.error(`Input file not found: ${inputPath}`);
                continue;
            }

            await sharp(inputPath)
                .webp({ quality: 80 })
                .toFile(outputPath);

            console.log(`✅ Converted ${img.input} -> ${img.output}`);
        } catch (error) {
            console.error(`❌ Error processing ${img.input}:`, error);
        }
    }
}

processImages();
