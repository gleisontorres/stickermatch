import sharp from "sharp";

const source = "public/icons/logo-source.png";

const icons = [
  { file: "public/icons/icon-512.png", size: 512 },
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/apple-touch-icon.png", size: 180 },
  { file: "public/favicon.ico", size: 32 },
];

for (const icon of icons) {
  await sharp(source)
    .resize(icon.size, icon.size)
    .toFile(icon.file);
  console.log(`✓ ${icon.file}`);
}
