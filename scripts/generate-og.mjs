import sharp from "sharp";

/** Gera `public/og-image.png` (1200×630) com logo centralizado para Open Graph / redes sociais. */
const size = 512;
const width = 1200;
const height = 630;

const logo = await sharp("public/icons/icon-512.png")
  .resize(size, size)
  .toBuffer();

await sharp({
  create: {
    width,
    height,
    channels: 4,
    background: { r: 10, g: 10, b: 10, alpha: 1 },
  },
})
  .composite([
    {
      input: logo,
      gravity: "centre",
    },
  ])
  .png()
  .toFile("public/og-image.png");

console.log("✓ public/og-image.png gerado (1200x630)");
