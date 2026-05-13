import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const SVG_PATH = path.resolve('public/icon.svg');
const OUT_DIR = path.resolve('public');

const svg = await fs.readFile(SVG_PATH);

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(path.join(OUT_DIR, name));
  console.log(`✓ ${name} (${size}×${size})`);
}

// Maskable icon — wider safe zone (40% padding around content for OS masks)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a0506"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="acc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff5050"/>
      <stop offset="100%" stop-color="#cc1820"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <text x="256" y="320" text-anchor="middle"
    font-family="Impact, sans-serif"
    font-size="240" font-weight="900" fill="url(#acc)" letter-spacing="-10">W</text>
  <rect x="160" y="370" width="192" height="10" rx="5" fill="#ffffff"/>
</svg>`;
await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(OUT_DIR, 'icon-maskable.png'));
console.log('✓ icon-maskable.png (512×512)');

// Splash screen for iOS (optional but nice)
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1284 2778">
  <rect width="100%" height="100%" fill="#000000"/>
  <text x="642" y="1300" text-anchor="middle"
    font-family="Impact, sans-serif"
    font-size="220" font-weight="900" fill="#ff2d2d" letter-spacing="-6">WSTAWAJ</text>
  <text x="642" y="1500" text-anchor="middle"
    font-family="Impact, sans-serif"
    font-size="220" font-weight="900" fill="#ffffff" letter-spacing="-6">ŚMIECIU</text>
</svg>`;
await sharp(Buffer.from(splashSvg)).resize(1284, 2778).png().toFile(path.join(OUT_DIR, 'splash-1284x2778.png'));
console.log('✓ splash-1284x2778.png (iPhone 15 Pro Max)');
