import { labelSize } from './tileLabels';

let context: CanvasRenderingContext2D | null | undefined;
const widths = new Map<string, number>();
function textWidth(text: string, size: number) {
  const key = `${size}:${text}`;
  if (widths.has(key)) return widths.get(key)!;
  context ??= document.createElement('canvas').getContext('2d');
  if (context) context.font = `700 ${size}px Arial, sans-serif`;
  const width = context?.measureText(text).width ?? text.length * size;
  widths.set(key, width);
  return width;
}

function Line({
  text,
  y,
  size,
  height,
}: {
  text: string;
  y: number;
  size: number;
  height: number;
}) {
  return (
    <svg
      x="8"
      y={y}
      width="224"
      height={height}
      viewBox={`0 0 ${Math.max(224, textWidth(text, size) + 8)} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size}>
        {text}
      </text>
    </svg>
  );
}

export function TileLabel({
  id,
  name,
  rent,
  conditions,
  matrix,
  dimmed,
}: {
  id: number;
  name: string;
  rent?: string;
  conditions: string[];
  matrix?: number[];
  dimmed: boolean;
}) {
  if (!matrix) return null;
  return (
    <svg
      data-tile-label={id}
      className={`tile-face-label${dimmed ? ' label-dimmed' : ''}`}
      viewBox={`0 0 ${labelSize.width} ${labelSize.height}`}
      style={{ transform: `matrix(${matrix.join(',')})` }}
    >
      <rect className="tile-name-strip" x="0" y="0" width="240" height="58" rx="6" />
      <Line text={name} y={6} size={44} height={46} />
      {conditions.map((condition, i) => (
        <Line key={condition} text={condition} y={58 + i * 16} size={18} height={16} />
      ))}
      {rent && <Line text={rent} y={108} size={48} height={46} />}
    </svg>
  );
}
