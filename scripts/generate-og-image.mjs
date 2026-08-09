// Generates public/og.png — the branded 1200x630 social card for Stack2Set.
// Pure Node script using @napi-rs/canvas (no browser, no network). Rerun with:
//   node scripts/generate-og-image.mjs
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'og.png');

const W = 1200;
const H = 630;

// @napi-rs/canvas auto-registers system fonts, so "Segoe UI" / "Arial" are
// available natively on Windows and macOS. On headless Linux builds the font
// list is empty, so fall back to registering a system sans-serif when present.
const onWindows = process.platform === 'win32';

function tryRegister(candidates) {
  for (const { path, name } of candidates) {
    try {
      if (existsSync(path) && GlobalFonts.registerFromPath(path, name)) return name;
    } catch {
      // try next candidate
    }
  }
  return null;
}

const BOLD_FONT = onWindows
  ? 'Segoe UI'
  : tryRegister([
      { path: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', name: 'DejaVuBold' },
      { path: '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', name: 'LiberationBold' },
    ]) ?? 'sans-serif';

const REG_FONT = onWindows
  ? 'Segoe UI'
  : tryRegister([
      { path: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', name: 'DejaVu' },
      { path: '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', name: 'Liberation' },
    ]) ?? 'sans-serif';

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

const color = (r, g, b, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`;

// ---- background -----------------------------------------------------------
ctx.fillStyle = '#06060a';
ctx.fillRect(0, 0, W, H);

const radial = (cx, cy, rx, ry, r, g, b, a) => {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  grad.addColorStop(0, color(r, g, b, a));
  grad.addColorStop(1, color(r, g, b, 0));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
  ctx.translate(-cx, -cy);
  ctx.fillStyle = grad;
  ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  ctx.restore();
};

radial(170, -40, 520, 320, 167, 139, 250, 0.16); // violet top-left
radial(1050, -50, 520, 330, 34, 211, 238, 0.13); // cyan top-right
radial(600, 720, 760, 420, 52, 211, 153, 0.1); // emerald bottom
radial(980, 430, 420, 300, 129, 140, 248, 0.06); // indigo right

// faint dot grid
ctx.fillStyle = color(255, 255, 255, 0.045);
for (let x = 60; x < W; x += 60) {
  for (let y = 60; y < H; y += 60) {
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- accent tile ----------------------------------------------------------
const tileX = W / 2 - 55;
const tileY = 118;
const tile = 110;
const radius = 26;

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// outer glow
ctx.save();
ctx.shadowColor = color(20, 184, 166, 0.55);
ctx.shadowBlur = 90;
const tileGrad = ctx.createLinearGradient(tileX, tileY, tileX + tile, tileY + tile);
tileGrad.addColorStop(0, '#14b8a6'); // teal-500
tileGrad.addColorStop(1, '#0891b2'); // cyan-600
ctx.fillStyle = tileGrad;
roundedRect(tileX, tileY, tile, tile, radius);
ctx.fill();
ctx.restore();

// inner highlight ring
ctx.strokeStyle = color(255, 255, 255, 0.25);
ctx.lineWidth = 2;
roundedRect(tileX + 4, tileY + 4, tile - 8, tile - 8, radius - 4);
ctx.stroke();

// sparkle (8-point star)
const cx = W / 2;
const cy = tileY + tile / 2;
const R = 30;
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.moveTo(cx, cy - R);
ctx.quadraticCurveTo(cx + 6, cy - 4, cx + R, cy);
ctx.quadraticCurveTo(cx + 6, cy + 4, cx, cy + R);
ctx.quadraticCurveTo(cx - 6, cy + 4, cx - R, cy);
ctx.quadraticCurveTo(cx - 6, cy - 4, cx, cy - R);
ctx.fill();
const r2 = 13;
ctx.beginPath();
ctx.moveTo(cx - r2, cy);
ctx.lineTo(cx, cy - r2);
ctx.lineTo(cx + r2, cy);
ctx.lineTo(cx, cy + r2);
ctx.closePath();
ctx.fill();

// ---- wordmark --------------------------------------------------------------
const wordY = 388;
const wordSize = 96;
ctx.textBaseline = 'alphabetic';
ctx.font = `bold ${wordSize}px ${BOLD_FONT}`;
const partA = 'Stack';
const partB = '2Set';
const wA = ctx.measureText(partA).width;
const wB = ctx.measureText(partB).width;
const gap = 6;
const total = wA + gap + wB;
const startX = (W - total) / 2;

ctx.fillStyle = '#f8fafc';
ctx.fillText(partA, startX, wordY);

const gradText = ctx.createLinearGradient(startX + wA + gap, 0, startX + wA + gap + wB, 0);
gradText.addColorStop(0, '#2dd4bf');
gradText.addColorStop(1, '#5eead4');
ctx.fillStyle = gradText;
ctx.fillText(partB, startX + wA + gap, wordY);

// ---- tagline ---------------------------------------------------------------
const tagY = 462;
const tagSize = 29;
ctx.font = `${tagSize}px ${REG_FONT}`;
ctx.textAlign = 'center';
ctx.fillStyle = color(148, 163, 184, 1);
ctx.fillText('AI-powered technology stack discovery for developers', W / 2, tagY);
ctx.textAlign = 'start';

// ---- domain ---------------------------------------------------------------
const domY = 566;
const domSize = 24;
ctx.font = `600 ${domSize}px ${REG_FONT}`;
ctx.textAlign = 'center';
ctx.fillStyle = color(100, 116, 139, 1);
ctx.fillText('stack2set.com', W / 2, domY);
ctx.textAlign = 'start';

// thin accent bar above domain
const barGrad = ctx.createLinearGradient(W / 2 - 60, 0, W / 2 + 60, 0);
barGrad.addColorStop(0, color(45, 212, 191, 0));
barGrad.addColorStop(0.5, color(45, 212, 191, 0.9));
barGrad.addColorStop(1, color(45, 212, 191, 0));
ctx.fillStyle = barGrad;
ctx.fillRect(W / 2 - 60, domY - 44, 120, 2);

const buf = canvas.toBuffer('image/png');
writeFileSync(OUT, buf);
console.log(`wrote ${OUT} (${buf.length} bytes, ${W}x${H})`);
