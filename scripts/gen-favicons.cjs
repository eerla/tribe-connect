const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }
  return [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)];
}

const primary = hslToRgb(239, 0.84, 0.67);
const secondary = hslToRgb(160, 0.84, 0.39);
const white = [255, 255, 255];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xEDB88320 & mask);
    }
  }
  const out = Buffer.alloc(4);
  out.writeUInt32BE(~crc >>> 0, 0);
  return out;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tbuf = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([tbuf, data]));
  return Buffer.concat([len, tbuf, data, crc]);
}

function writePng({ size, outPath }) {
  const rowSize = size * 4 + 1; // filter byte + RGBA
  const raw = Buffer.alloc(rowSize * size);

  const thickness = Math.max(3, Math.round(size * 0.24));
  const barWidth = size * 0.78;
  const verticalHeight = size * 0.70;
  const cx = (size - 1) / 2;
  const topY = size * 0.19;

  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      const idx = rowStart + 1 + x * 4;
      const t = (x + y) / (2 * (size - 1));
      const [r, g, b] = lerpColor(primary, secondary, t);
      let R = r, G = g, B = b, A = 255;

      const inTopBar = Math.abs(y - topY) <= thickness / 2 && Math.abs(x - cx) <= barWidth / 2;
      const inStem = Math.abs(x - cx) <= thickness / 2 && y >= topY && y <= topY + verticalHeight;
      if (inTopBar || inStem) {
        [R, G, B] = white;
      }

      raw[idx] = R;
      raw[idx + 1] = G;
      raw[idx + 2] = B;
      raw[idx + 3] = A;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = zlib.deflateSync(raw);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(outPath, png);
  console.log(`wrote ${outPath}`);
}

const outDir = path.resolve(__dirname, '..', 'public');
writePng({ size: 32, outPath: path.join(outDir, 'favicon-32.png') });
writePng({ size: 48, outPath: path.join(outDir, 'favicon-48.png') });
