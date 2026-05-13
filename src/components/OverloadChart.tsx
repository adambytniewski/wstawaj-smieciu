'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Point {
  exercise: string;
  date: string;
  topWeightKg: number;
  topSetVolume: number;
}

export default function OverloadChart() {
  const [data, setData] = useState<Point[]>([]);
  const [exercise, setExercise] = useState<string>('');
  const [exercises, setExercises] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/gym/overload?days=90', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const pts: Point[] = d.data ?? [];
        setData(pts);
        const set = Array.from(new Set(pts.map((p) => p.exercise)));
        setExercises(set);
        if (set.length > 0 && !exercise) setExercise(set[0]);
      });
  }, []);

  const filtered = exercise ? data.filter((d) => d.exercise === exercise) : [];
  const chartData = filtered.map((p) => ({ date: p.date.slice(5), kg: p.topWeightKg }));

  return (
    <section className="card-pad">
      <div className="flex items-center justify-between mb-3">
        <span className="label">Progres ćwiczenia</span>
        <select
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          className="bg-surface2 text-ink text-xs border border-line rounded-md px-2 py-1"
        >
          {exercises.length === 0 && <option>brak danych</option>}
          {exercises.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>
      {chartData.length > 1 ? (
        <div className="h-44 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#737373" fontSize={10} />
              <YAxis stroke="#737373" fontSize={10} width={28} />
              <Tooltip
                contentStyle={{
                  background: '#141414',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  color: '#f5f5f5',
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="kg" stroke="#ff3b30" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-muted text-xs py-6 text-center">
          Potrzebujesz minimum 2 sesji tego samego ćwiczenia.
        </div>
      )}
    </section>
  );
}
