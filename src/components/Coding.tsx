'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Code2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CodingSession {
  id: number;
  date: string;
  fileName: string;
  startedAt: number | string;
  durationMin: number;
  project: string | null;
  title: string | null;
  topics: string | null;
}

export default function Coding() {
  const [sessions, setSessions] = useState<CodingSession[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const r = await fetch('/api/coding/sync', { cache: 'no-store' });
    const data = await r.json();
    setSessions(data.sessions ?? []);
  }

  async function sync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const r = await fetch('/api/coding/sync', { method: 'POST' });
      const data = await r.json();
      setSyncResult(`+${data.added} nowych z ${data.scanned}`);
      await refresh();
    } catch (e) {
      setSyncResult('błąd synchronizacji');
    } finally {
      setSyncing(false);
    }
  }

  // Aggregate per-day chart (last 14 days)
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    byDay.set(s.date, (byDay.get(s.date) ?? 0) + s.durationMin);
  }
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push(key);
  }
  const chartData = days.map((k) => ({ date: k.slice(5), min: byDay.get(k) ?? 0 }));

  const today = days[days.length - 1];
  const todayMin = byDay.get(today) ?? 0;
  const weekMin = chartData.slice(-7).reduce((s, d) => s + d.min, 0);

  return (
    <div className="px-5 pb-6 space-y-5">
      <section className="card-pad">
        <div className="flex items-center gap-2 mb-3">
          <Code2 size={16} className="text-accent" />
          <span className="label">Statystyki</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="card-pad">
            <div className="font-display text-3xl">{todayMin}</div>
            <div className="text-xs text-muted mt-1">DZIŚ (min)</div>
          </div>
          <div className="card-pad">
            <div className="font-display text-3xl">{Math.round(weekMin / 60 * 10) / 10}h</div>
            <div className="text-xs text-muted mt-1">7 DNI</div>
          </div>
        </div>
      </section>

      <button onClick={sync} disabled={syncing} className="btn-outline w-full">
        {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        {syncing ? 'Synchronizuję...' : syncResult || 'Sync Second Brain'}
      </button>

      {chartData.some((d) => d.min > 0) && (
        <section className="card-pad">
          <h2 className="label mb-3">Ostatnie 14 dni (min)</h2>
          <div className="h-44 -mx-2">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                <Bar dataKey="min" fill="#ff3b30" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section>
        <h2 className="label px-1 mb-2">Sesje</h2>
        <div className="space-y-2">
          {sessions.length === 0 && (
            <div className="text-muted text-sm px-1">
              Brak danych. Kliknij &quot;Sync&quot; żeby zaciągnąć z Second Brain.
            </div>
          )}
          {sessions.slice(0, 30).map((s) => {
            const topics = s.topics ? (JSON.parse(s.topics) as string[]) : [];
            return (
              <div key={s.id} className="card-pad">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink truncate">{s.title || s.fileName}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {new Date(s.startedAt).toLocaleString('pl-PL', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {s.project && ` · ${s.project}`}
                    </div>
                  </div>
                  <div className="font-display text-lg">{s.durationMin}<span className="text-xs text-muted">m</span></div>
                </div>
                {topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {topics.slice(0, 5).map((t) => (
                      <span key={t} className="chip">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
