'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2, Moon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Entry {
  id: number;
  date: string;
  bedtime: number | string;
  wakeTime: number | string;
  durationMin: number;
  quality: number;
  notes: string | null;
}

function defaultBedtime() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(23, 0, 0, 0);
  return toLocalInput(d);
}

function defaultWake() {
  const d = new Date();
  d.setHours(7, 0, 0, 0);
  return toLocalInput(d);
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Sleep() {
  const [bedtime, setBedtime] = useState(defaultBedtime());
  const [wakeTime, setWakeTime] = useState(defaultWake());
  const [quality, setQuality] = useState(7);
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const r = await fetch('/api/sleep', { cache: 'no-store' });
    const data = await r.json();
    setEntries(data.entries ?? []);
  }

  async function save() {
    setLoading(true);
    try {
      await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedtime: new Date(bedtime).toISOString(),
          wakeTime: new Date(wakeTime).toISOString(),
          quality,
          notes: notes || undefined,
        }),
      });
      setNotes('');
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    await fetch(`/api/sleep?id=${id}`, { method: 'DELETE' });
    await refresh();
  }

  const chartData = entries
    .slice(0, 14)
    .reverse()
    .map((e) => ({ date: e.date.slice(5), h: +(e.durationMin / 60).toFixed(1) }));

  const minutes = Math.max(0, Math.round((new Date(wakeTime).getTime() - new Date(bedtime).getTime()) / 60000));

  return (
    <div className="px-5 pb-6 space-y-5">
      <section className="card-pad">
        <div className="flex items-center gap-2 mb-3">
          <Moon size={16} className="text-accent" />
          <span className="label">Wpis</span>
          <span className="ml-auto text-sm text-muted">
            {Math.floor(minutes / 60)}h {minutes % 60}m
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Poszedłem spać</label>
            <input
              type="datetime-local"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Pobudka</label>
            <input
              type="datetime-local"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="input"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="label flex justify-between">
            <span>Jakość</span>
            <span className="text-ink">{quality}/10</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notatki (opcjonalnie)"
          rows={2}
          className="input mt-3 resize-none"
        />
        <button onClick={save} disabled={loading} className="btn-primary w-full mt-3">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Zapisz sen
        </button>
      </section>

      {chartData.length > 0 && (
        <section className="card-pad">
          <h2 className="label mb-3">Ostatnie {chartData.length} dni</h2>
          <div className="h-40 -mx-2">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#737373" fontSize={10} />
                <YAxis stroke="#737373" fontSize={10} width={24} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    background: '#141414',
                    border: '1px solid #262626',
                    borderRadius: 8,
                    color: '#f5f5f5',
                    fontSize: 12,
                  }}
                />
                <ReferenceLine y={7} stroke="#34d399" strokeDasharray="3 3" />
                <Bar dataKey="h" fill="#ff3b30" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-muted text-right mt-1">linia: 7h target</div>
        </section>
      )}

      <section>
        <h2 className="label px-1 mb-2">Historia</h2>
        <div className="space-y-2">
          {entries.length === 0 && <div className="text-muted text-sm px-1">Brak wpisów.</div>}
          {entries.map((e) => (
            <div key={e.id} className="card-pad flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-xl">
                  {Math.floor(e.durationMin / 60)}h {e.durationMin % 60}m
                </div>
                <div className="text-xs text-muted">
                  {e.date} · jakość {e.quality}/10
                </div>
                {e.notes && <div className="text-xs text-muted mt-1 italic">{e.notes}</div>}
              </div>
              <button onClick={() => remove(e.id)} className="text-muted hover:text-warn p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
