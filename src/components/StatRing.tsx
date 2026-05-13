interface StatRingProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
}

export default function StatRing({
  value,
  max,
  label,
  unit,
  color = '#ff3b30',
  size = 110,
}: StatRingProps) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const pct = max === 0 ? 0 : Math.min(1, value / max);
  const dash = c * pct;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#262626"
            strokeWidth={8}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={8}
            fill="none"
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-2xl leading-none">{value}</div>
          {unit && <div className="text-[10px] text-muted uppercase tracking-wider mt-0.5">{unit}</div>}
        </div>
      </div>
      <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}
