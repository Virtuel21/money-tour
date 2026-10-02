import { writeFileSync } from 'node:fs';
// Original vector artwork. Shared toy proportions leave the tile label/pawn lanes intact.
const families = ['mediterranean', 'mansard', 'gable', 'pagoda', 'artdeco'];
const shape = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
function art(family, hotel) {
  const top = hotel ? 46 : 72,
    bottom = 166;
  const front = shape(`M34 ${top} 96 ${top + 26}v${bottom - top - 26}l-62-26Z`, '#fff0cf');
  const side = shape(`M96 ${top + 26} 152 ${top}v${bottom - top - 26}l-56 26Z`, '#b7d2cc');
  let roofs = '';
  if (family === 'mediterranean')
    roofs =
      shape(`M25 ${top} 69 ${top - 31} 159 ${top - 1} 98 ${top + 32}Z`, '#bc5264') +
      shape(`M25 ${top} 69 ${top - 31} 98 ${top + 3} 98 ${top + 32}Z`, '#e77668') +
      shape(
        `M25 ${top + 5} 98 ${top + 37} 159 ${top + 4}v-7L98 ${top + 27} 25 ${top - 5}Z`,
        '#ae4563',
      );
  if (family === 'mansard')
    roofs =
      shape(
        `M24 ${top + 1} 43 ${top - 30} 96 ${top - 11} 143 ${top - 35} 161 ${top + 1} 97 ${top + 34}Z`,
        '#69778e',
      ) +
      shape(`M43 ${top - 30} 91 ${top - 42} 143 ${top - 35} 96 ${top - 11}Z`, '#a6b6c2') +
      shape(`M63 ${top - 9}v-18l14 6v18Z`, '#fff0cf') +
      shape(`m61 ${top - 28} 9-9 10 17Z`, '#bc5264');
  if (family === 'gable')
    roofs =
      shape(
        `M21 ${top + 6} 55 ${top - 39} 121 ${top - 10} 160 ${top + 5} 98 ${top + 36}Z`,
        '#bc5264',
      ) +
      shape(`M21 ${top + 6} 55 ${top - 39} 98 ${top + 36}Z`, '#fff0cf') +
      shape(
        `M28 ${top + 5} 55 ${top - 29} 87 ${top + 27}M55 ${top - 29}v48`,
        'none',
        'stroke="#624b49" stroke-width="5"',
      ) +
      shape(
        `M38 ${top + 36} 91 ${top + 59}m-53 30 53 23M65 ${top + 24}v${bottom - top - 40}`,
        'none',
        'stroke="#806052" stroke-width="5"',
      );
  if (family === 'pagoda')
    roofs =
      shape(`M18 ${top - 5}q30 12 47-25l55 22q13 18 43 7l-8 15-59 27-70-26Z`, '#526b7c') +
      shape(`M18 ${top - 5}q45 22 78 37 39-19 67-33`, 'none', 'stroke="#bc5264" stroke-width="6"') +
      (hotel ? shape(`M27 27q27 9 43-19l44 16q15 13 40 3l-6 12-52 24-61-25Z`, '#526b7c') : '') +
      shape(`M34 ${top + 35} 96 ${top + 61}l56-26`, 'none', 'stroke="#bc5264" stroke-width="8"');
  if (family === 'artdeco')
    roofs =
      shape(`M28 ${top} 88 ${top - 28} 158 ${top} 96 ${top + 30}Z`, '#adb9be') +
      shape(`M61 ${top - 13}v-18l30-13 33 14v17l-31 15Z`, '#fff0cf') +
      shape(
        `M91 ${top - 44}v-13m-12 40v-15m25 16v-15`,
        'none',
        'stroke="#bf596e" stroke-width="5"',
      ) +
      shape(
        `M42 ${top + 15}v${bottom - top - 50}m13 ${-bottom + top + 60}v${bottom - top - 55}m76 ${-bottom + top + 46}v${bottom - top - 42}`,
        'none',
        'stroke="#c89357" stroke-width="3"',
      );
  let windows = '';
  for (const row of hotel ? [0, 1, 2] : [1])
    for (const x of [45, 70]) {
      const y = top + 25 + row * (hotel ? 25 : 20) + (x - 45) * 0.42;
      windows +=
        shape(`M${x} ${y}v14l10 4v-14Z`, '#4b8c9e') +
        shape(`M${x + 5} ${y + 2}v10`, 'none', 'stroke="#bce7dc" stroke-width="2"');
    }
  for (const row of hotel ? [0, 1, 2] : [1])
    for (const x of [109, 132]) {
      const y = top + 34 + row * (hotel ? 25 : 20) - (x - 109) * 0.45;
      windows += shape(`M${x} ${y}v13l9-4v-13Z`, '#397f91');
    }
  const door = shape('M73 155v-22q8-11 16 7v22Z', '#69565e');
  const hotelSign = hotel
    ? '<g stroke="#294854" stroke-width="2"><path d="m52 90 33 14v20l-33-14Z" fill="#ffd36a"/><path d="M62 99v12m13-7v12m-13-11 13 6" fill="none" stroke-width="3"/></g>'
    : '';
  return `<g stroke="#315362" stroke-width="2.5" stroke-linejoin="round">${shape('M21 147 94 180 167 143 94 115Z', '#254d5720', 'stroke="none"')}${front}${side}${windows}${door}${roofs}${hotelSign}<path d="M34 140 96 166l56-26" fill="none" stroke="#e3c396" stroke-width="4"/></g>`;
}
for (const family of families)
  for (const hotel of [false, true])
    writeFileSync(
      `apps/web/public/textures/architecture-${family}-${hotel ? 'hotel' : 'house'}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="384" viewBox="0 0 192 192">${art(family, hotel)}</svg>`,
    );
const atlas = [false, true]
  .map((hotel, row) =>
    families
      .map(
        (family, col) =>
          `<g transform="translate(${col * 192} ${row * 192})">${art(family, hotel)}</g>`,
      )
      .join(''),
  )
  .join('');
writeFileSync(
  'apps/web/public/textures/architecture-regional.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="768" viewBox="0 0 960 384">${atlas}</svg>`,
);
