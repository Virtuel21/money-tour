import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
const colors = ['#2ba8bc', '#e8725b', '#e6b94a', '#70a88b', '#9683c5'];
const houses = Array.from({ length: 10 }, (_, i) => {
  const x = 635 + (i % 5) * 86,
    y = 170 + Math.floor(i / 5) * 138;
  return `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="74" height="105" rx="9" fill="#fff6df"/><rect x="6" y="6" width="62" height="9" rx="3" fill="${colors[i % 5]}"/><path d="M18 52L37 32L56 52V82H18Z" fill="${colors[i % 5]}"/><path d="M13 54L37 28L61 54" fill="none" stroke="#142d3d" stroke-width="5"/><path d="M28 55h7v9h-7zm13 0h7v9h-7z" fill="#fff6df"/><rect x="33" y="70" width="9" height="12" fill="#142d3d"/></g>`;
}).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f9f5e9"/><circle cx="972" cy="300" r="365" fill="#c1e4db"/><path d="M605 475Q750 400 910 470T1220 450" fill="none" stroke="#70a88b" stroke-width="3"/><rect x="70" y="65" width="75" height="75" rx="21" fill="#142d3d"/><path d="M109 76v39H83z" fill="#fff6df"/><path d="M115 88v27h19z" fill="#e8725b"/><path d="M82 120h51l-10 11H94z" fill="#e6b94a"/><text x="168" y="112" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#142d3d">MONEY TOUR</text><text x="70" y="255" font-family="Georgia,serif" font-size="65" fill="#142d3d">Un archipel.</text><text x="70" y="330" font-family="Georgia,serif" font-size="65" font-style="italic" fill="#397c68">Mille fortunes.</text><text x="72" y="405" font-family="Arial,sans-serif" font-size="22" fill="#52675f">Achetez. Construisez. Jouez entre amis.</text><rect x="70" y="468" width="420" height="62" rx="15" fill="#e8725b"/><text x="280" y="507" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" font-weight="700" fill="#142d3d">2–4 voyageurs · Dans votre navigateur</text><g transform="rotate(-8 850 300)">${houses}</g><circle cx="1090" cy="100" r="62" fill="#e6b94a"/><text x="1090" y="94" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#142d3d">LE GRAND</text><text x="1090" y="115" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#142d3d">TOUR</text></svg>`;
await writeFile('apps/web/public/social-card.svg', svg);
await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile('apps/web/public/social-card.png');
