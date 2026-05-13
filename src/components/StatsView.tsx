'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DayStats {
  date: string;
  deepWorkMin: number;
  codingMin: number;
  gymVolume: number;
  gymSets: number;
  sleepMin: number | null;
  sleepQuality: number | null;
}

interface Props {
  days: DayStats[];
  streaks: { deepWork: number; gym: number; sleepLogged: number };
}

export default function StatsView({ days, streaks }: Props) {
  const last30 = days;
  const totalDeep = last30.reduce((s, d) => s + d.deepWorkMin, 0);
  const totalCode = last30.reduce((s, d) => s + d.codingMin, 0);
  const totalVol = last30.reduce((s, d) => s + d.gymVolume, 0);
  const gymDays = last30.filter((d) => d.gymSets > 0).length;
  const sleeps = last30.filter((d) => d.sleepMin !== null);
  const avgSleep = sleeps.length > 0 ? Math.round(sleeps.reduce((s, d) => s + (d.sleepMin ?? 0), 0) / sleeps.length) : 0;

  const chart = last30.map((d) => ({
    date: d.date.slice(5),
    focus: d.deepWorkMin,
    code: d.codingMin,
    sleep: d.sleepMin ? Math.round(d.sleepMin / 60 * 10) / 10 : null,
  }));

  return (
    <div className="px-5 pb-6 space-y-5">
      <section className="grid grid-cols-2 gap-3">
        <KPI label="Focus 30d" value={`${Math.round(totalDeep / 60)}h`} />
        <KPI label="AI Code 30d" value={`${Math.round(totalCode / 60)}h`} />
        <KPI label="Treningi 30d" value={`${gymDays}/30`} />
        <KPI label="Średni sen" value={avgSleep ? `${Math.floor(avgSleep / 60)}h ${avgSleep % 60}m` : '–'} />
      </section>

      <section className="card-pad">
        <h2 className="label mb-3">Focus + Coding (min/dzień)</h2>
        <div className="h-48 -mx-2">
          <ResponsiveContainer>
            <BarChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#737373" fontSize={9} />
              <YAxis stroke="#737373" fontSize={9} width={28} />
              <Tooltip
                contentStyle={{
                  background: '#141414',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  color: '#f5f5f5',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="focus" stackId="a" fill="#ff3b30" />
              <Bar dataKey="code" stackId="a" fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent" /> Deep Work</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-warn" /> AI Coding</span>
        </div>
      </section>

      <section className="card-pad">
        <h2 className="label mb-3">Sen (h)</h2>
        <div className="h-40 -mx-2">
          <ResponsiveContainer>
            <LineChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#737373" fontSize={9} />
              <YAxis stroke="#737373" fontSize={9} width={24} domain={[0, 12]} />
              <Tooltip
                contentStyle={{
                  background: '#141414',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  color: '#f5f5f5',
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="sleep" stroke="#34d399" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card-pad">
        <h2 className="label mb-3">Streaki aktywne</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Streak value={streaks.deepWork} label="Focus ≥1h" />
          <Streak value={streaks.gym} label="Trening" />
          <Streak value={streaks.sleepLogged} label="Sen log" />
        </div>
      </section>

      <section className="card-pad">
        <h2 className="label mb-3">Total objętość 30d</h2>
        <div className="font-display text-4xl">{Math.round(totalVol).toLocaleString('pl-PL')} <span className="text-base text-muted">kg</span></div>
      </section>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-pad">
      <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}

function Streak({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl">{value}</div>
      <div className="text-[10px] text-muted uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
