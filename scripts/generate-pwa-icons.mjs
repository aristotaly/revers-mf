/**
 * Generates the PWA icon set into `public/`.
 *
 * Outputs:
 *   public/icon-192.png         — Android home screen
 *   public/icon-512.png         — Android splash / general purpose
 *   public/icon-maskable.png    — Android adaptive (safe zone padded)
 *   public/apple-icon.png       — iOS home screen (180x180, no transparency)
 *   public/favicon.png          — Browser tab (32x32)
 *
 * Re-run after editing the SVG markup below:
 *   node scripts/generate-pwa-icons.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");
mkdirSync(publicDir, { recursive: true });

const BRAND = "#5b21b6"; // dashboard trend line color
const BRAND_DARK = "#3b0764";
const ACCENT = "#c4b5fd";

/** Standard icon: filled rounded square + downward trend line. */
function buildIconSvg({ rounded = true } = {}) {
  const radius = rounded ? 96 : 0;
  // SVG canvas is 512x512; icon-192 is downscaled from this same source.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND}" />
      <stop offset="100%" stop-color="${BRAND_DARK}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="${radius}" ry="${radius}" fill="url(#bg)" />
  <!-- Subtle baseline grid -->
  <g stroke="${ACCENT}" stroke-opacity="0.18" stroke-width="2">
    <line x1="64" y1="368" x2="448" y2="368" />
    <line x1="64" y1="288" x2="448" y2="288" />
    <line x1="64" y1="208" x2="448" y2="208" />
  </g>
  <!-- Downward trend polyline -->
  <polyline
    fill="none"
    stroke="#ffffff"
    stroke-width="28"
    stroke-linecap="round"
    stroke-linejoin="round"
    points="80,168 176,232 256,200 336,304 432,376" />
  <!-- End dot -->
  <circle cx="432" cy="376" r="22" fill="#ffffff" />
</svg>`;
}

/** Maskable icon: identical artwork but inside the inner 80% safe zone. */
function buildMaskableSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND}" />
      <stop offset="100%" stop-color="${BRAND_DARK}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" fill="url(#bg)" />
  <g transform="translate(51,51) scale(0.8)">
    <g stroke="${ACCENT}" stroke-opacity="0.18" stroke-width="2">
      <line x1="64" y1="368" x2="448" y2="368" />
      <line x1="64" y1="288" x2="448" y2="288" />
      <line x1="64" y1="208" x2="448" y2="208" />
    </g>
    <polyline
      fill="none"
      stroke="#ffffff"
      stroke-width="32"
      stroke-linecap="round"
      stroke-linejoin="round"
      points="80,168 176,232 256,200 336,304 432,376" />
    <circle cx="432" cy="376" r="26" fill="#ffffff" />
  </g>
</svg>`;
}

async function writePng(svg, file, size) {
  const out = join(publicDir, file);
  const buf = await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain", background: BRAND })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(out, buf);
  console.log(`  wrote ${file}  (${size}x${size}, ${buf.length} bytes)`);
}

console.log("Generating PWA icons in", publicDir);

const standard = buildIconSvg();
const maskable = buildMaskableSvg();

await writePng(standard, "icon-192.png", 192);
await writePng(standard, "icon-512.png", 512);
await writePng(maskable, "icon-maskable.png", 512);
await writePng(buildIconSvg({ rounded: false }), "apple-icon.png", 180);
await writePng(standard, "favicon.png", 32);

console.log("Done.");
