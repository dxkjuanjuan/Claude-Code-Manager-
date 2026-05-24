// Generate ICO from PNG for electron-builder
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcPng = path.join(__dirname, 'renderer', 'claude-icon.png');
const destIco = path.join(__dirname, 'build', 'icon.ico');
const destPng = path.join(__dirname, 'build', 'icon.png');

async function generate() {
  // Generate 256x256 PNG for icon.png
  await sharp(srcPng)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(destPng);

  // Generate ICO with multiple sizes: 16, 32, 48, 256
  const sizes = [16, 32, 48, 256];
  const pngBuffers = [];
  for (const size of sizes) {
    const buf = await sharp(srcPng)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push({ size, buf });
  }

  // ICO format: header + directory entries + image data
  const headerSize = 6;
  const entrySize = 16;
  const numImages = pngBuffers.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);   // Reserved
  header.writeUInt16LE(1, 2);   // Type: ICO
  header.writeUInt16LE(numImages, 4); // Count

  const entries = [];
  let dataOffset = headerSize + entrySize * numImages;

  for (const { size, buf } of pngBuffers) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0);  // Width (0 = 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1);  // Height
    entry.writeUInt8(0, 2);    // Color palette
    entry.writeUInt8(0, 3);    // Reserved
    entry.writeUInt16LE(1, 4);  // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8);  // Image size
    entry.writeUInt32LE(dataOffset, 12); // Data offset
    entries.push(entry);
    dataOffset += buf.length;
  }

  const ico = Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buf)]);
  fs.writeFileSync(destIco, ico);

  console.log('Generated icon.ico (' + ico.length + ' bytes) and icon.png');
  console.log('Sizes: ' + sizes.join(', '));
}

generate().catch(e => console.error(e));