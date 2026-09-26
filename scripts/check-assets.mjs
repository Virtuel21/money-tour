import { readdir, stat } from 'node:fs/promises';
async function size(path) {
  let bytes = 0;
  for (const name of await readdir(path)) {
    const child = `${path}/${name}`;
    const info = await stat(child);
    bytes += info.isDirectory() ? await size(child) : info.size;
  }
  return bytes;
}
const assets = await size('apps/web/public');
if (assets >= 16_000_000) throw new Error(`Asset budget exceeded: ${assets} bytes`);
console.log(
  `Static assets: ${assets} bytes / 16,000,000 bytes, including music, Blender models and detailed illustration atlases.`,
);
