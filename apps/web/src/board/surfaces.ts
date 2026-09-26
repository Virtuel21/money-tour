import * as THREE from 'three';
import type { Tile } from '@money-tour/engine';

/** Small repeating patterns authored for the board, not photographic map labels. */
export function streetSurface(tile: Tile) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const sand = tile.type === 'resort' || tile.type === 'island';
  ctx.fillStyle = sand ? '#f1d38e' : (tile.color ?? '#f5cf67');
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#fff5e4';
  ctx.globalAlpha = sand ? 0 : 0.22;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = 1;
  const group = Number(tile.group?.slice(1) ?? 0);
  if (sand) {
    ctx.fillStyle = '#36c8d4';
    ctx.fillRect(0, 0, 256, 29);
    ctx.strokeStyle = '#e4fffa';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = 0; x <= 256; x += 4) {
      const y = 29 + Math.sin(x / 26) * 5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < 130; i++) {
      ctx.fillStyle = i % 2 ? '#c69c54' : '#fff0c1';
      ctx.fillRect((i * 73) % 256, (i * 47) % 256, 2, 2);
    }
  } else if (tile.type === 'city' && [1, 3, 4, 6].includes(group)) {
    ctx.strokeStyle = '#153a4824';
    ctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 32)
      for (let x = -32; x < 256; x += 64) {
        ctx.strokeRect(x + (y % 64 ? 32 : 0) + 2, y + 2, 60, 28);
      }
  } else if (tile.type === 'city') {
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = i % 2 ? '#18343b25' : '#ffffff55';
      ctx.fillRect((i * 67) % 256, (i * 97) % 256, 2, 2);
    }
    ctx.strokeStyle = '#fffbe6b0';
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 14]);
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(25, 256);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
