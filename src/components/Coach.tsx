'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Bell, Skull, Microscope, BellRing } from 'lucide-react';
import clsx from 'clsx';

interface Msg {
  id: number;
  role: 'user' | 'coach';
  content: string;
  kind: string;
  createdAt: number | string;
}

export default function Coach() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [pushReady, setPushReady] = useState(false);
  const [pushSubbed, setPushSubbed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refresh();
    setupPush();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function refresh() {
    const r = await fetch('/api/coach/history', { cache: 'no-store' });
    const data = await r.json();
    setMessages(data.messages ?? []);
  }

  async function setupPush() {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setPushReady(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPushSubbed(!!sub);
    } catch {}
  }

  async function enablePush() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        alert('Brak zgody na powiadomienia. Bez tego coach cię nie ruszy z dupy.');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pub),
      });
      const json = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      setPushSubbed(true);
    } catch (e) {
      alert('Błąd push: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    setMessages((m) => [...m, { id: Date.now(), role: 'user', content: text, kind: 'chat', createdAt: Date.now() }]);
    try {
      const r = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${r.status}`);
      }
      await refresh();
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: 'coach',
          content: `[Błąd: ${e instanceof Error ? e.message : String(e)}]`,
          kind: 'chat',
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function generateKind(kind: 'daily' | 'audit') {
    setGenerating(kind);
    try {
      const r = await fetch('/api/coach/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      if (r.ok) await refresh();
    } finally {
      setGenerating(null);
    }
  }

  async function testPush() {
    await fetch('/api/push/test', { method: 'POST' });
  }

  return (
    <div className="px-5 pb-32 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <ActionBtn
          onClick={() => generateKind('daily')}
          disabled={generating !== null}
          loading={generating === 'daily'}
          icon={<Skull size={14} />}
          label="Opieprz"
        />
        <ActionBtn
          onClick={() => generateKind('audit')}
          disabled={generating !== null}
          loading={generating === 'audit'}
          icon={<Microscope size={14} />}
          label="Audyt"
        />
        {pushReady && !pushSubbed ? (
          <ActionBtn onClick={enablePush} icon={<Bell size={14} />} label="Push" />
        ) : (
          <ActionBtn onClick={testPush} icon={<BellRing size={14} />} label="Test" />
        )}
      </div>

      <div className="space-y-3 pt-1">
        {messages.length === 0 && (
          <div className="card-pad text-muted text-sm text-center py-10">
            Brak rozmowy. Wciśnij &quot;Opieprz&quot; albo napisz coś niżej.
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={clsx(
                'rounded-2xl px-4 py-3 max-w-[88%] whitespace-pre-wrap leading-snug text-[15px] font-medium',
                m.role === 'user'
                  ? 'ml-auto rounded-br-sm text-white'
                  : 'mr-auto rounded-bl-sm text-ink border border-line'
              )}
              style={
                m.role === 'user'
                  ? { background: 'linear-gradient(180deg, #ff4b4b 0%, #d6202b 100%)' }
                  : { background: 'linear-gradient(180deg, #16161a 0%, #0e0e10 100%)' }
              }
            >
              {m.content}
              <div className="text-[10px] opacity-50 mt-1.5">
                {new Date(m.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mr-auto rounded-2xl rounded-bl-sm px-4 py-3 border border-line bg-surface text-muted text-sm italic flex items-center gap-2"
          >
            <Loader2 size={12} className="animate-spin" />
            Coach myśli…
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      <div
        className="fixed bottom-0 inset-x-0 z-30"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)', paddingTop: '8px' }}
      >
        <div className="mx-auto max-w-md px-3">
          <div
            className="flex gap-2 rounded-2xl p-1.5"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,24,0.9) 0%, rgba(8,8,10,0.95) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 12px 32px -12px rgba(0,0,0,0.8)',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Powiedz mu o sobie..."
              className="flex-1 bg-transparent border-0 px-3 h-10 text-ink placeholder:text-muted outline-none text-sm"
              disabled={sending}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="btn-primary h-10 px-4"
              style={{ opacity: !input.trim() ? 0.4 : 1 }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  disabled,
  loading,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="card relative overflow-hidden p-3 active:scale-95 transition-transform disabled:opacity-50"
    >
      <div className="absolute inset-0 bg-g-coach pointer-events-none" />
      <div className="relative flex flex-col items-center gap-1">
        <span className="text-accent">{loading ? <Loader2 size={14} className="animate-spin" /> : icon}</span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-ink">{label}</span>
      </div>
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
