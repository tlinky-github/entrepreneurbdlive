const sharp = require('sharp');

module.exports = async (req, res) => {
  const { title = 'Entrepreneurs BD', category = 'Insights' } = req.query;

  // Clean title for rendering
  const cleanTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;

  // Branded SVG Template
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#064e3b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#022c22;stop-opacity:1" />
        </linearGradient>
        <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#ffffff" fill-opacity="0.05" />
        </pattern>
      </defs>
      
      <rect width="1200" height="630" fill="url(#bgGrad)" />
      <rect width="1200" height="630" fill="url(#pattern)" />
      
      <!-- Border accent -->
      <rect x="20" y="20" width="1160" height="590" fill="none" stroke="#059669" stroke-width="4" rx="10" stroke-opacity="0.3" />

      <!-- Branding -->
      <text x="60" y="80" font-family="sans-serif" font-size="24" font-weight="bold" fill="#34d399" letter-spacing="2">ENTREPRENEURS BD</text>
      
      <!-- Category Badge -->
      <rect x="60" y="120" width="${category.length * 12 + 20}" height="32" rx="16" fill="#059669" />
      <text x="${60 + (category.length * 12 + 20) / 2}" y="142" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">${category.toUpperCase()}</text>

      <!-- Main Title -->
      <foreignObject x="60" y="200" width="1080" height="300">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: sans-serif; font-size: 64px; font-weight: 800; line-height: 1.2; text-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          ${cleanTitle}
        </div>
      </foreignObject>

      <!-- Site URL -->
      <text x="60" y="570" font-family="sans-serif" font-size="20" fill="#34d399" opacity="0.6">entrepreneurs.bd</text>
    </svg>
  `;

  try {
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(pngBuffer);
  } catch (error) {
    console.error('OG Image Generation Error:', error);
    res.status(500).send('Error generating OG image');
  }
};
