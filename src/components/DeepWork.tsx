'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Loader2, Trash2, Brain, Target } from 'lucide-react';
import { formatDuration } from '@/lib/dates';

interface Session {
  id: number;
  startedAt: number | string;
  endedAt: number | string | null;
  durationSec: number;
  project: string | null;
  goal: string | null;
  notes: string | null;
  completed: boolean;
  date: string;
}

const ACTIVE_KEY = 'wstawaj.deepwork.active';

interface ActiveLocal {
  id: number;
  startedAt: number;
  project: string;
  goal: string;
}

export default function DeepWork() {
  const [active, setActive] = useState<ActiveLocal | null>(null);
  const [project, setProject] = useState('');
  const [goal, setGoal] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(ACTIVE_KEY);
    if (saved) {
      try {
        const a: ActiveLocal = JSON.parse(saved);
        setActive(a);
      } catch {}
    }
    refreshHistory();
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - active.startedAt) / 1000));
    }, 1000);
    setElapsed(Math.floor((Date.now() - active.startedAt) / 1000));
    return () => clearInterval(id);
  }, [active]);

  async function refreshHistory() {
    const r = await fetch('/api/deep-work', { cache: 'no-store' });
    const data = await r.json();
    setSessions(data.sessions ?? []);
  }

  async function startSession() {
    setLoading(true);
    try {
      const r = await fetch('/api/deep-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: project || null, goal: goal || null }),
      });
      const data = await r.json();
      const a: ActiveLocal = {
        id: data.session.id,
        startedAt: new Date(data.session.startedAt).getTime(),
        project: project,
        goal: goal,
      };
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(a));
      setActive(a);
      setElapsed(0);
    } finally {
      setLoading(false);
    }
  }

  async function stopSession() {
    if (!active) return;
    setLoading(true);
    try {
      await fetch('/api/deep-work', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: active.id, completed: true }),
      });
      localStorage.removeItem(ACTIVE_KEY);
      setActive(null);
      setElapsed(0);
      setProject('');
      setGoal('');
      await refreshHistory();
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(id: number) {
    await fetch(`/api/deep-work?id=${id}`, { method: 'DELETE' });
    await refreshHistory();
  }

  const todayTotal = Math.round(
    sessions
      .filter((s) => s.date === new Date().toISOString().slice(0, 10))
      .reduce((sum, s) => sum + s.durationSec, 0) / 60
  );

  return (
    <div className="px-5 pb-8 space-y-5">
      <AnimatePresence mode="wait">
        {active ? (
          <motion.section
            key="active"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="card relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-g-focus opacity-80 pointer-events-none" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,45,45,0.15) 0%, transparent 70%)',
              }}
            />
            <div className="relative p-7 text-center">
              <div className="label-strong text-accent inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                W TRAKCIE
              </div>
              <div className="display text-display-xl mt-5 tabular-nums" style={{
                background: 'linear-gradient(180deg, #fff 0%, #ff8a8a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 60px rgba(255,45,45,0.3)',
              }}>
                {formatTime(elapsed)}
              </div>
              {active.goal && (
                <div className="text-ink text-base font-semibold mt-4 px-2">{active.goal}</div>
              )}
              {active.project && (
                <div className="text-muted text-xs mt-1">{active.project}</div>
              )}
              <button
                onClick={stopSession}
                disabled={loading}
                className="btn-primary w-full mt-7 h-14"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Square size={18} fill="white" />}
                Zakończ sesję
              </button>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-g-focus pointer-events-none" />
            <div className="relative p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Target size={14} className="text-accent" />
                <span className="label-strong">Nowa sesja</span>
                {todayTotal > 0 && (
                  <span className="ml-auto chip">DZIŚ {todayTotal} MIN</span>
                )}
              </div>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Co robisz tę sesję? (cel)"
                className="input"
                maxLength={120}
              />
              <input
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Projekt (opcjonalnie)"
                className="input"
                maxLength={60}
              />
              <button onClick={startSession} disabled={loading} className="btn-primary w-full h-14">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="white" />}
                START
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <section>
        <h2 className="label-strong px-1 mb-3">Historia</h2>
        <div className="space-y-2">
          {sessions.length === 0 && (
            <div className="card-pad text-muted text-sm text-center">
              Pusto. Zacznij pierwszą sesję.
            </div>
          )}
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="card p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="display text-2xl text-ink">{formatDuration(s.durationSec)}</span>
                  {s.completed && (
                    <span className="chip" style={{ color: '#34d399', borderColor: '#34d39940' }}>
                      ✓ DONE
                    </span>
                  )}
                </div>
                {s.goal && <div className="text-sm text-ink truncate mt-0.5">{s.goal}</div>}
                <div className="text-[11px] text-muted mt-0.5">
                  {s.project ? `${s.project} · ` : ''}
                  {new Date(s.startedAt).toLocaleString('pl-PL', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <button
                onClick={() => deleteSession(s.id)}
                className="text-muted hover:text-bad p-1 transition-colors"
                aria-label="Usuń"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
