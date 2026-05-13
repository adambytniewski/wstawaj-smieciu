'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';

const KEY_PREFIX = 'wstawaj.wakeup.';

function todayLocalKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WakeUpGate({ children }: { children: React.ReactNode }) {
  const [showGate, setShowGate] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);

  useEffect(() => {
    const todayKey = KEY_PREFIX + todayLocalKey();
    const seen = localStorage.getItem(todayKey);
    if (seen) {
      setShowGate(false);
      return;
    }
    setShowGate(true);
    fetchWakeup();
  }, []);

  async function fetchWakeup() {
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    try {
      const r = await fetch('/api/coach/message', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'wakeup' }),
      });
      const data = await r.json();
      setMessage(data.message || 'Wstawaj. Rusz dupę.');
    } catch {
      setMessage('Coach analizuje wolno. Rusz się sam — wiesz co masz robić.');
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  // Typewriter reveal
  useEffect(() => {
    if (!message) return;
    setRevealedChars(0);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setRevealedChars(i);
      if (i >= message.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [message]);

  function dismiss() {
    const todayKey = KEY_PREFIX + todayLocalKey();
    localStorage.setItem(todayKey, '1');
    setShowGate(false);
  }

  if (showGate === null) return null;

  return (
    <>
      <AnimatePresence>
        {showGate && (
          <motion.div
            key="gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="absolute inset-0 bg-g-coach pointer-events-none" />
            <div className="absolute inset-0 bg-noise opacity-[0.04] mix-blend-overlay pointer-events-none" />

            <div className="relative flex-1 flex flex-col px-7 pt-10 pb-10">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="label-strong text-accent flex items-center gap-2"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
                BUDZIK
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="display text-display-md text-ink mt-3"
              >
                WSTAWAJ
                <br />
                <span className="text-accent">ŚMIECIU</span>
              </motion.div>

              <div className="mt-12 flex-1 flex items-center">
                {loading && !message ? (
                  <div className="flex items-center gap-3 text-muted">
                    <Loader2 className="animate-spin" size={18} />
                    <span className="text-sm">Coach analizuje twoje dane...</span>
                  </div>
                ) : (
                  <p className="text-ink text-2xl leading-snug font-semibold tracking-tight">
                    <span>{message.slice(0, revealedChars)}</span>
                    {revealedChars < message.length && (
                      <span className="inline-block w-2 h-6 bg-accent ml-0.5 align-middle animate-pulse" />
                    )}
                  </p>
                )}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={dismiss}
                className="btn-primary w-full mt-10 h-14 text-base"
              >
                {loading ? 'Słyszę. Wchodzę.' : 'Słyszę. Rusz mnie.'}
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!showGate && children}
      {showGate === true && <div style={{ visibility: 'hidden' }}>{children}</div>}
    </>
  );
}
