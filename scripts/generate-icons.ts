/**
 * Gera PNGs de ícone PWA a partir de `public/icons/icon-source.svg`.
 */
import { mkdir, readFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const root = process.cwd();
const svgPath = join(root, "public", "icons", "icon-source.svg");
const outDir = join(root, "public", "icons");

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true });
  const svgBuffer = await readFile(svgPath);

  const targets = [
    { file: "icon-192.png", size: 192 },
    { file: "icon-512.png", size: 512 },
    { file: "apple-touch-icon.png", size: 180 },
  ] as const;

  for (const { file, size } of targets) {
    const dest = join(outDir, file);
    await sharp(svgBuffer).resize(size, size).png().toFile(dest);
    console.info(`Wrote ${dest}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
