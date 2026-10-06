// Dessin au trait d'un engrenage droit (décor). Aucune valeur technique: uniquement des termes génériques.
export default function Gear({ className }: { className?: string }) {
  const N = 28, cx = 200, cy = 200, rr = 120, ro = 142, pitch = 131;
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * 2 * Math.PI, step = (2 * Math.PI) / N;
    const seq: [number, number][] = [[0, rr], [0.18, rr], [0.32, ro], [0.62, ro], [0.76, rr]];
    for (const [t, r] of seq) pts.push(`${(cx + r * Math.cos(a0 + t * step)).toFixed(1)},${(cy + r * Math.sin(a0 + t * step)).toFixed(1)}`);
  }
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <g className="gear-spin" strokeWidth="1.2">
        <polygon points={pts.join(" ")} pathLength={1} className="draw" />
        <circle cx={cx} cy={cy} r={pitch} strokeDasharray="10 4 2 4" strokeWidth="0.8" />
        <circle cx={cx} cy={cy} r={90} strokeWidth="0.8" />
        <circle cx={cx} cy={cy} r={34} strokeWidth="1.2" />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * 2 * Math.PI;
          return <circle key={i} cx={cx + 62 * Math.cos(a)} cy={cy + 62 * Math.sin(a)} r={10} strokeWidth="0.8" />;
        })}
      </g>
      <g strokeWidth="0.7" strokeDasharray="14 4 2 4">
        <line x1="20" y1={cy} x2="380" y2={cy} />
        <line x1={cx} y1="20" x2={cx} y2="380" />
      </g>
      <g className="mono" fill="currentColor" stroke="none" fontSize="9" letterSpacing="1">
        <text x="262" y="112">CERCLE DE TÊTE</text>
        <text x="236" y="352">CERCLE PRIMITIF</text>
      </g>
      <path d="M262 116 L232 134 M236 348 L214 332" strokeWidth="0.7" />
    </svg>
  );
}
