'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Dumbbell, Loader2, TrendingUp } from 'lucide-react';
import OverloadChart from './OverloadChart';

interface SetDraft {
  exercise: string;
  weightKg: string;
  reps: string;
  rpe?: string;
}

interface Workout {
  id: number;
  date: string;
  startedAt: number | string;
  totalVolume: number;
  notes: string | null;
  sets: Array<{
    id: number;
    exercise: string;
    weightKg: number;
    reps: number;
    rpe: number | null;
    setIndex: number;
  }>;
}

const COMMON_EXERCISES = [
  'Wyciskanie sztangi',
  'Przysiad',
  'Martwy ciąg',
  'Podciąganie',
  'OHP',
  'Wiosłowanie',
  'Hantle skos',
  'Biceps',
  'Triceps',
  'Brzuch',
];

export default function Gym() {
  const [sets, setSets] = useState<SetDraft[]>([{ exercise: '', weightKg: '', reps: '' }]);
  const [notes, setNotes] = useState('');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const r = await fetch('/api/gym/workout', { cache: 'no-store' });
    const data = await r.json();
    setWorkouts(data.workouts ?? []);
  }

  function updateSet(i: number, key: keyof SetDraft, val: string) {
    setSets((prev) => prev.map((s, j) => (i === j ? { ...s, [key]: val } : s)));
  }

  function addSet() {
    const last = sets[sets.length - 1];
    setSets([...sets, { exercise: last?.exercise ?? '', weightKg: last?.weightKg ?? '', reps: last?.reps ?? '' }]);
  }

  function removeSet(i: number) {
    setSets((prev) => (prev.length === 1 ? prev : prev.filter((_, j) => j !== i)));
  }

  async function saveWorkout() {
    const valid = sets
      .filter((s) => s.exercise.trim() && Number(s.reps) > 0)
      .map((s) => ({
        exercise: s.exercise.trim(),
        weightKg: Number(s.weightKg) || 0,
        reps: Number(s.reps),
        rpe: s.rpe ? Number(s.rpe) : undefined,
      }));
    if (valid.length === 0) return;
    setLoading(true);
    try {
      await fetch('/api/gym/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sets: valid, notes: notes || undefined }),
      });
      setSets([{ exercise: '', weightKg: '', reps: '' }]);
      setNotes('');
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteWorkout(id: number) {
    await fetch(`/api/gym/workout?id=${id}`, { method: 'DELETE' });
    await refresh();
  }

  return (
    <div className="px-5 pb-6 space-y-5">
      <section className="card-pad">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell size={16} className="text-accent" />
          <span className="label">Nowa sesja</span>
        </div>
        <div className="space-y-2">
          {sets.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={s.exercise}
                onChange={(e) => updateSet(i, 'exercise', e.target.value)}
                placeholder="Ćwiczenie"
                list="exercise-suggestions"
                className="input flex-1 min-w-0"
              />
              <input
                value={s.weightKg}
                onChange={(e) => updateSet(i, 'weightKg', e.target.value)}
                placeholder="kg"
                inputMode="decimal"
                className="input w-16 text-center"
              />
              <input
                value={s.reps}
                onChange={(e) => updateSet(i, 'reps', e.target.value)}
                placeholder="rep"
                inputMode="numeric"
                className="input w-14 text-center"
              />
              <button
                onClick={() => removeSet(i)}
                className="text-muted hover:text-warn p-2"
                aria-label="Usuń serię"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <datalist id="exercise-suggestions">
            {COMMON_EXERCISES.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
          <button onClick={addSet} className="btn-ghost w-full">
            <Plus size={14} /> Dodaj serię
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notatki (opcjonalnie)"
          className="input mt-3 resize-none"
          rows={2}
        />
        <button onClick={saveWorkout} disabled={loading} className="btn-primary w-full mt-3">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Zapisz trening
        </button>
      </section>

      <button
        onClick={() => setShowChart((s) => !s)}
        className="btn-outline w-full"
      >
        <TrendingUp size={14} />
        {showChart ? 'Ukryj progres' : 'Pokaż progressive overload'}
      </button>
      {showChart && <OverloadChart />}

      <section>
        <h2 className="label px-1 mb-2">Historia treningów</h2>
        <div className="space-y-2">
          {workouts.length === 0 && (
            <div className="text-muted text-sm px-1">Brak treningów. Zapisz pierwszy.</div>
          )}
          {workouts.map((w) => (
            <div key={w.id} className="card-pad">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-xl">{Math.round(w.totalVolume)} kg</div>
                  <div className="text-xs text-muted">
                    {new Date(w.startedAt).toLocaleString('pl-PL', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {w.sets.length} serii
                  </div>
                </div>
                <button
                  onClick={() => deleteWorkout(w.id)}
                  className="text-muted hover:text-warn p-1"
                  aria-label="Usuń"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-3 space-y-1">
                {Object.entries(groupByExercise(w.sets)).map(([ex, exSets]) => (
                  <div key={ex} className="flex items-center justify-between text-sm">
                    <span className="text-ink truncate mr-2">{ex}</span>
                    <span className="text-muted text-xs whitespace-nowrap">
                      {exSets.map((s) => `${s.weightKg || ''}${s.weightKg ? '×' : ''}${s.reps}`).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
              {w.notes && <div className="mt-2 text-xs text-muted italic">{w.notes}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function groupByExercise(sets: Workout['sets']) {
  const out: Record<string, Workout['sets']> = {};
  for (const s of sets) {
    (out[s.exercise] ??= []).push(s);
  }
  return out;
}
