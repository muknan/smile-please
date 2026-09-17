import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const sourcePath = path.join(
  projectRoot,
  "public",
  "brand",
  "soft-embrace-compact.svg",
);
const appDirectory = path.join(projectRoot, "app");

async function renderPng(source, size) {
  return sharp(source, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(images.length * 16);
  let offset = header.length + directory.length;

  images.forEach(({ size, data }, index) => {
    const entry = index * 16;
    directory.writeUInt8(size === 256 ? 0 : size, entry);
    directory.writeUInt8(size === 256 ? 0 : size, entry + 1);
    directory.writeUInt8(0, entry + 2);
    directory.writeUInt8(0, entry + 3);
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(data.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });

  return Buffer.concat([header, directory, ...images.map(({ data }) => data)]);
}

await mkdir(appDirectory, { recursive: true });
const source = await readFile(sourcePath);
const sizes = [16, 32, 48, 180];
const rendered = new Map(
  await Promise.all(
    sizes.map(async (size) => [size, await renderPng(source, size)]),
  ),
);

await Promise.all([
  writeFile(path.join(appDirectory, "icon1.png"), rendered.get(32)),
  writeFile(path.join(appDirectory, "icon2.png"), rendered.get(48)),
  writeFile(path.join(appDirectory, "apple-icon.png"), rendered.get(180)),
  writeFile(
    path.join(appDirectory, "favicon.ico"),
    createIco(
      [16, 32, 48].map((size) => ({ size, data: rendered.get(size) })),
    ),
  ),
]);

console.log("Generated Soft Embrace favicon assets from the approved compact SVG.");
