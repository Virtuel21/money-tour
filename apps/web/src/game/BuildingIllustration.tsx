import { architectureAsset } from './architecture';
/** Original vector illustrations: crisp at phone and large desktop sizes. */
export function BuildingIllustration({
  level,
  island = false,
  cityName,
}: {
  level: number;
  island?: boolean;
  cityName?: string;
}) {
  if (cityName && !island && level > 0) {
    const count = level === 4 ? 1 : level;
    return (
      <svg
        className="building-illustration regional-illustration"
        viewBox="0 0 180 132"
        aria-hidden="true"
        focusable="false"
      >
        {Array.from({ length: count }, (_, i) => (
          <image
            key={i}
            href={architectureAsset(cityName, level === 4)}
            x={count === 1 ? 24 : i * 44}
            y={count === 1 ? 0 : i % 2 ? 8 : 22}
            width={count === 1 ? 132 : 92}
            height={count === 1 ? 132 : 92}
          />
        ))}
      </svg>
    );
  }
  const houses =
    level === 1
      ? [[62, 38]]
      : level === 2
        ? [
            [37, 39],
            [82, 59],
          ]
        : [
            [26, 49],
            [64, 29],
            [91, 60],
          ];
  return (
    <svg
      className="building-illustration"
      viewBox="0 0 180 132"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 89 90 45 173 89 90 128Z"
        fill="#579d66"
        stroke="#2c624d"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M8 83 90 39 173 83 90 122Z"
        fill={island ? '#f5d994' : '#b4d66d'}
        stroke="#52764d"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="m20 82 68-35 70 37"
        fill="none"
        stroke="#e6edab"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {island ? (
        <g stroke="#634534" strokeWidth="3" strokeLinejoin="round">
          <path d="M86 98q13-31 6-60" fill="none" strokeWidth="9" />
          <path
            d="M93 48q-32-29-47 7 29-11 47-7m0 0q17-37 42-6-24-7-42 6m0 0q28-3 33 23-18-19-33-23m0 0q-26-11-29 22 10-16 29-22"
            fill="#46a86e"
          />
        </g>
      ) : level === 0 ? (
        <g stroke="#355765" strokeWidth="3" strokeLinejoin="round">
          <path d="m65 90 22-12 25 13-22 12Z" fill="#fff6d9" />
          <path d="M88 86V36" />
          <path d="m90 37 31 7-31 13" fill="#32b9c3" />
          <circle cx="88" cy="34" r="3" fill="#f5bc37" />
        </g>
      ) : level === 4 ? (
        <g stroke="#513c60" strokeWidth="2.5" strokeLinejoin="round">
          <path d="m51 43 35-19 42 22v49l-36 21-41-23Z" fill="#fff5dd" />
          <path d="m92 64 36-18v49l-36 21Z" fill="#dac9ea" />
          <path d="m47 42 39-22 47 25-40 22Z" fill="#bf527f" />
          <path d="M47 42v9l46 25 40-22v-9L93 67Z" fill="#933d70" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <path d={`M61 ${59 + i * 13}v7l8 4v-7Zm15 8v7l8 4v-7Z`} fill="#3baab8" />
              <path d={`M103 ${71 + i * 12}v6l8-4v-6Zm12-6v6l7-4v-6Z`} fill="#3baab8" />
            </g>
          ))}
          <path d="M77 108V94l9 5v14" fill="#76506b" />
          <rect x="66" y="26" width="40" height="18" rx="4" fill="#ffce58" />
          <path d="M83 30v10m7-10v10m-7-5h7" fill="none" stroke="#513c60" strokeWidth="3" />
        </g>
      ) : (
        houses.map(([x, y], i) => (
          <g
            key={i}
            transform={`translate(${x} ${y})`}
            stroke="#355765"
            strokeWidth="2.4"
            strokeLinejoin="round"
          >
            <path d="m0 20 18-11 23 13v23L23 57 0 44Z" fill="#fff4d6" />
            <path d="m23 34 18-12v23L23 57Z" fill="#bce0df" />
            <path d="M-5 22 15 0l31 19-5 11L20 17 1 29Z" fill="#e96d4f" />
            <path d="m-5 22 20-22 5 17L1 29Z" fill="#ffb053" />
            <path d="M8 49V34l8 4v15" fill="#36a1b8" />
            <path d="m29 36 7-4v9l-7 4Z" fill="#36a1b8" />
          </g>
        ))
      )}
    </svg>
  );
}
