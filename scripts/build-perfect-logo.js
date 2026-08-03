const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Icon / Square Emblem SVG (512x512)
// Deep Emerald Green (#064E3B) rounded box with white bold 'e' optically centered (-2px shift)
const emblemSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#064E3B"/>
  <text 
    x="256" 
    y="336" 
    font-family="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
    font-weight="800" 
    font-size="288" 
    fill="#FFFFFF" 
    text-anchor="middle" 
    dominant-baseline="middle"
  >e</text>
</svg>`;

// 2. Full Horizontal Header Logo SVG (Icon + "Entrepreneurs BD" Text)
const horizontalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="800" height="200">
  <!-- Green Square 'e' Icon (Left) -->
  <g transform="translate(20, 20)">
    <rect width="160" height="160" rx="36" fill="#064E3B"/>
    <text 
      x="80" 
      y="102" 
      font-family="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
      font-weight="800" 
      font-size="90" 
      fill="#FFFFFF" 
      text-anchor="middle" 
      dominant-baseline="middle"
    >e</text>
  </g>

  <!-- Typography: Entrepreneurs -->
  <text x="216" y="112" font-family="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="52" letter-spacing="-1.5" fill="#0F172A">Entrepreneurs</text>
  
  <!-- BD Badge -->
  <g transform="translate(640, 68)">
    <rect width="104" height="52" rx="14" fill="#064E3B"/>
    <text x="52" y="36" font-family="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="30" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">BD</text>
  </g>

  <!-- Subtitle Tagline -->
  <text x="218" y="152" font-family="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="16" letter-spacing="3.5" fill="#047857">BANGLADESH'S BUSINESS NETWORK</text>
</svg>`;

async function main() {
  const rootDir = path.join(__dirname, '..');
  const targetDirs = [
    path.join(rootDir, 'public'),
    path.join(rootDir, 'astro-site', 'public')
  ];

  console.log('Generating official logo assets matching the header emblem...');

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 1. Write SVG files
    fs.writeFileSync(path.join(dir, 'logo.svg'), emblemSvg);
    fs.writeFileSync(path.join(dir, 'logo-icon.svg'), emblemSvg);
    fs.writeFileSync(path.join(dir, 'favicon.svg'), emblemSvg);
    fs.writeFileSync(path.join(dir, 'logo-horizontal.svg'), horizontalSvg);

    // 2. Render PNG files via Sharp
    await sharp(Buffer.from(emblemSvg))
      .resize(512, 512)
      .png({ quality: 100 })
      .toFile(path.join(dir, 'logo.png'));

    await sharp(Buffer.from(emblemSvg))
      .resize(512, 512)
      .png({ quality: 100 })
      .toFile(path.join(dir, 'logo-icon.png'));

    await sharp(Buffer.from(emblemSvg))
      .resize(512, 512)
      .png({ quality: 100 })
      .toFile(path.join(dir, 'logo512.png'));

    await sharp(Buffer.from(emblemSvg))
      .resize(192, 192)
      .png({ quality: 100 })
      .toFile(path.join(dir, 'logo192.png'));

    await sharp(Buffer.from(horizontalSvg))
      .resize(1600, 400)
      .png({ quality: 100 })
      .toFile(path.join(dir, 'logo-horizontal.png'));

    await sharp(Buffer.from(emblemSvg))
      .resize(64, 64)
      .toFile(path.join(dir, 'favicon.ico'));

    console.log(`Saved logo files to: ${dir}`);
  }

  fs.unlinkSync(__filename);
  console.log('Successfully generated all logo files!');
}

main().catch(err => {
  console.error('Error generating logo files:', err);
  process.exit(1);
});
