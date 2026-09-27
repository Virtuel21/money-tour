import type { Tile } from '@money-tour/engine';

/** A visual rename also applies when displaying a preserved historical save. */
export function tileTitle(tile: Pick<Tile, 'type' | 'name'>) {
  return tile.type === 'championship' ? 'Festival' : tile.name;
}

export function festivalText(text?: string) {
  return (text ?? '')
    .replaceAll('Championnat du monde', 'Festival')
    .replaceAll('Invitation sportive', 'Pass festival')
    .replaceAll('Mondial', 'Festival');
}
