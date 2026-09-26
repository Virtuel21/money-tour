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
if (assets >= 5_000_000) throw new Error(`Asset budget exceeded: ${assets} bytes`);
console.log(
  `Original static assets: ${assets} bytes / 5,000,000 bytes. Graphics and audio are otherwise synthesized in code.`,
);
