// Isometric diagram of the three layers of a study session.
export default function Art() {
  const tile = (x: number, y: number, color: string, stroke: string) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 86 -44 170 0 84 44Z" fill={color} stroke={stroke} />
      <path d="M0 0 84 44 84 53 0 9Z" fill="#8b7cd6" stroke={stroke} />
      <path d="M84 44 170 0 170 9 84 53Z" fill="#ad9cf0" stroke={stroke} />
    </g>
  );
  return (
    <svg viewBox="0 0 360 220" className="hero-art" aria-hidden="true">
      <defs>
        <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".9" fill="#a397cd" />
        </pattern>
      </defs>
      <rect width="360" height="220" fill="url(#dots)" opacity=".45" />
      <g fill="none" stroke="#9e8ecb" strokeDasharray="4 4">
        <path d="M15 156 102 111 185 156 309 91M45 66 185 138 323 67M95 177 208 118 333 182" />
      </g>
      {tile(94, 148, "#d0c5f8", "#8c7ac1")}
      {tile(94, 119, "#c1b1f5", "#8872c4")}
      {tile(94, 86, "#e4ddff", "#8270bc")}
      <g
        transform="matrix(.95 .49 -.94 .49 172 49)"
        fill="none"
        stroke="#7967b3"
        strokeWidth="2"
      >
        <rect x="8" y="6" width="69" height="69" rx="5" />
        <rect x="18" y="15" width="49" height="12" rx="2" fill="#b0a0e5" />
        <path d="M19 38h28m5 0h14M19 48h47M19 59h16m5 0h26" />
      </g>
      <g fill="#f2edff" stroke="#917cc4">
        <circle cx="45" cy="66" r="4" />
        <circle cx="311" cy="90" r="4" />
        <circle cx="95" cy="177" r="4" />
      </g>
      <g fontFamily="monospace" fontSize="10" fill="#76679b">
        <text x="34" y="55">
          input
        </text>
        <text x="277" y="78">
          context
        </text>
        <text x="59" y="196">
          recall
        </text>
      </g>
    </svg>
  );
}
