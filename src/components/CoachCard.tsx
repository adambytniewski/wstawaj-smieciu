'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CoachCard() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chars, setChars] = useState(0);

  async function loadLatest() {
    try {
      const r = await fetch('/api/coach/history', { cache: 'no-store' });
      const data = await r.json();
      const last = (data.messages as Array<{ role: string; content: string }> | undefined)
        ?.filter((m) => m.role === 'coach')
        ?.slice(-1)[0];
      if (last) setMessage(last.content);
    } catch {}
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/coach/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'daily' }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setMessage(data.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLatest();
  }, []);

  // typewriter
  useEffect(() => {
    if (!message) return;
    setChars(0);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setChars(i);
      if (i >= message.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [message]);

  return (
    <section className="card relative overflow-hidden">
      <div className="absolute inset-0 bg-g-coach pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle, rgba(255,45,45,0.25), rgba(255,45,45,0.05))' }}>
              <MessageSquare size={13} className="text-accent" />
            </div>
            <span className="label-strong text-accent">COACH</span>
            <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-good animate-pulse" />
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="text-muted hover:text-ink active:scale-90 transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface2 disabled:opacity-40"
            aria-label="Wygeneruj nową wiadomość"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>

        {message ? (
          <motion.p
            key={message}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-ink leading-snug text-base font-semibold tracking-tight"
          >
            <span>{message.slice(0, chars)}</span>
            {chars < message.length && (
              <span className="inline-block w-1.5 h-4 bg-accent ml-0.5 align-middle animate-pulse" />
            )}
          </motion.p>
        ) : loading ? (
          <p className="text-muted italic text-sm">Coach analizuje twoje dane...</p>
        ) : error ? (
          <div className="text-warn text-sm space-y-1">
            <div>Coach offline.</div>
            <div className="text-muted text-xs">{error}</div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-muted text-sm">Brak wiadomości. Dotknij ↻ żeby coach cię ocenił.</p>
            <button onClick={generate} className="btn-primary w-full">
              Daj mi opieprz
            </button>
          </div>
        )}

        {message && (
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-line/50">
            <Link href="/coach" className="text-xs text-muted hover:text-ink flex items-center gap-1 group">
              Pełna rozmowa
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <button onClick={generate} disabled={loading} className="text-xs text-muted hover:text-ink disabled:opacity-50">
              {loading ? '...' : 'Nowa wiadomość'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
