'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Code2, Dumbbell, Moon, Flame, BarChart3, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import CoachCard from './CoachCard';

interface Props {
  stats: {
    deepWorkMin: number;
    codingMin: number;
    gymVolume: number;
    gymSets: number;
    sleepMin: number | null;
    sleepQuality: number | null;
  };
  streaks: { deepWork: number; gym: number; sleepLogged: number };
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } },
};

// Compose a "today score" 0-100 from the four pillars
function computeScore(stats: Props['stats']): number {
  const focus = Math.min(1, stats.deepWorkMin / 180); // target 3h
  const code = Math.min(1, stats.codingMin / 180);
  const gym = stats.gymSets > 0 ? 1 : 0;
  const sleep = stats.sleepMin ? Math.min(1, stats.sleepMin / 420) : 0;
  return Math.round(((focus * 0.3 + code * 0.2 + gym * 0.25 + sleep * 0.25) * 100));
}

function scoreLabel(s: number): { text: string; color: string } {
  if (s >= 85) return { text: 'DOMINUJESZ', color: '#34d399' };
  if (s >= 65) return { text: 'NA TRACK', color: '#34d399' };
  if (s >= 40) return { text: 'PRZECIĘTNIE', color: '#fbbf24' };
  if (s >= 15) return { text: 'KIEPSKO', color: '#ff8a00' };
  return { text: 'GÓWNO', color: '#ff2d2d' };
}

export default function Dashboard({ stats, streaks }: Props) {
  const score = computeScore(stats);
  const sl = scoreLabel(score);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="px-5 pb-8 space-y-5"
    >
      {/* Hero score */}
      <motion.section variants={item} className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-g-coach pointer-events-none" />
        <div className="relative p-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="label-strong" style={{ color: sl.color }}>
              {sl.text}
            </div>
            <div className="display text-display-lg leading-none mt-2">
              <span style={{ color: sl.color }}>{score}</span>
              <span className="text-muted2 text-3xl ml-1">/100</span>
            </div>
            <div className="text-muted text-xs mt-2">dzisiejszy wynik z 4 obszarów</div>
          </div>

          {/* Score ring */}
          <div className="relative shrink-0">
            <svg width="92" height="92" className="-rotate-90">
              <circle cx="46" cy="46" r="38" stroke="#1f1f24" strokeWidth="8" fill="none" />
              <motion.circle
                cx="46"
                cy="46"
                r="38"
                stroke={sl.color}
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={2 * Math.PI * 38}
                initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - score / 100) }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
          </div>
        </div>
      </motion.section>

      {/* Coach */}
      <motion.div variants={item}>
        <CoachCard />
      </motion.div>

      {/* Streaks bar */}
      <motion.section variants={item} className="card-pad">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={14} className="text-warn" />
          <span className="label-strong">Streaki</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StreakCol icon={<Brain size={14} />} value={streaks.deepWork} label="FOCUS" color="#ff2d2d" />
          <StreakCol icon={<Dumbbell size={14} />} value={streaks.gym} label="GYM" color="#ff8a00" />
          <StreakCol icon={<Moon size={14} />} value={streaks.sleepLogged} label="SEN" color="#7c5cff" />
        </div>
      </motion.section>

      {/* Stat cards 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          variants={item}
          href="/deep-work"
          label="DEEP WORK"
          value={stats.deepWorkMin}
          unit="MIN"
          target={180}
          icon={<Brain size={14} />}
          color="#ff2d2d"
          gradient="bg-g-focus"
        />
        <StatTile
          variants={item}
          href="/coding"
          label="AI CODE"
          value={stats.codingMin}
          unit="MIN"
          target={240}
          icon={<Code2 size={14} />}
          color="#22d3ee"
          gradient="bg-g-code"
          subline="auto z Second Brain"
        />
        <StatTile
          variants={item}
          href="/gym"
          label="GYM"
          value={Math.round(stats.gymVolume)}
          unit="KG"
          target={3000}
          icon={<Dumbbell size={14} />}
          color="#ff8a00"
          gradient="bg-g-gym"
          subline={`${stats.gymSets} serii`}
        />
        <StatTile
          variants={item}
          href="/sleep"
          label="SEN"
          value={stats.sleepMin !== null ? Math.round(stats.sleepMin / 6) / 10 : 0}
          unit="H"
          target={7.5}
          icon={<Moon size={14} />}
          color="#7c5cff"
          gradient="bg-g-sleep"
          subline={
            stats.sleepQuality !== null ? `jakość ${stats.sleepQuality}/10` : 'brak wpisu'
          }
        />
      </div>

      <motion.div variants={item} className="flex gap-2">
        <SyncCodingButton />
        <Link href="/stats" className="btn-outline px-4 whitespace-nowrap">
          <BarChart3 size={14} />
          Statystyki
        </Link>
      </motion.div>
    </motion.div>
  );
}

function StreakCol({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-muted">
        {icon}
        <span className="text-[9px] uppercase tracking-wider font-bold">{label}</span>
      </div>
      <div className="display text-3xl mt-1.5" style={value > 0 ? { color } : { color: '#52525b' }}>
        {value}
      </div>
      <div className="text-[9px] text-muted2 uppercase tracking-wider mt-0.5">
        {value === 1 ? 'dzień' : value < 5 ? 'dni' : 'dni'}
      </div>
    </div>
  );
}

function StatTile({
  href,
  label,
  value,
  unit,
  target,
  icon,
  color,
  gradient,
  subline,
  variants,
}: {
  href: string;
  label: string;
  value: number;
  unit: string;
  target: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  subline?: string;
  variants?: any;
}) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <motion.div variants={variants}>
      <Link
        href={href}
        className="card relative overflow-hidden block p-4 active:scale-[0.98] transition-transform"
      >
        <div className={`absolute inset-0 ${gradient} pointer-events-none`} />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="label-strong">{label}</span>
            <span style={{ color }}>{icon}</span>
          </div>
          <div className="display text-5xl leading-none">
            {value}
            <span className="text-base text-muted ml-1.5 font-sans font-semibold">{unit}</span>
          </div>
          <div className="text-[10px] text-muted mt-2 h-3">{subline ?? `cel ${target}${unit.toLowerCase()}`}</div>
          <div className="mt-2 h-1 bg-line/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SyncCodingButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        setResult(null);
        try {
          const r = await fetch('/api/coding/sync', { method: 'POST' });
          const data = await r.json();
          setResult(`+${data.added} nowych`);
        } catch {
          setResult('błąd');
        } finally {
          setLoading(false);
          setTimeout(() => location.reload(), 700);
        }
      }}
      className="btn-outline flex-1"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
      {loading ? 'Sync...' : result || 'Sync Brain'}
    </button>
  );
}
