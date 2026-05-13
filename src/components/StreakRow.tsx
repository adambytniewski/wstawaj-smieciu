import { Flame, Brain, Dumbbell, Moon } from 'lucide-react';

interface Props {
  streaks: { deepWork: number; gym: number; sleepLogged: number };
}

export default function StreakRow({ streaks }: Props) {
  return (
    <div className="card-pad">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={16} className="text-warn" />
        <span className="label">Streaki</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Streak icon={<Brain size={14} />} label="Focus" value={streaks.deepWork} />
        <Streak icon={<Dumbbell size={14} />} label="Gym" value={streaks.gym} />
        <Streak icon={<Moon size={14} />} label="Sen" value={streaks.sleepLogged} />
      </div>
    </div>
  );
}

function Streak({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-1">
      <div className="text-muted">{icon}</div>
      <div className="font-display text-2xl leading-none">{value}</div>
      <div className="text-[10px] text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}
