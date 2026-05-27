/**
 * Regenerate raster favicons from app/icon.svg (requires sharp).
 * Run: node scripts/generate-favicon.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "app/icon.svg"));

const sizes = [
  { out: "app/apple-icon.png", size: 180 },
  { out: "public/favicon-32x32.png", size: 32 },
  { out: "public/favicon-16x16.png", size: 16 },
];

for (const { out, size } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(root, out));
  console.log(`Wrote ${out} (${size}x${size})`);
}
