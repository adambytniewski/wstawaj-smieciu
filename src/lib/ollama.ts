import 'server-only';
import { spawn } from 'node:child_process';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';
const USE_WSL_FALLBACK = process.platform === 'win32';

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatResponse {
  message?: { role: string; content: string };
  done: boolean;
  error?: string;
}

// Fallback: shell out to `wsl.exe -- curl ...` so Windows host can reach
// Ollama running inside WSL2 even when port-forwarding/mirrored networking
// isn't set up. Slower (~200ms overhead) but reliable.
async function wslCurl(pathAndQuery: string, body?: object, timeoutMs = 120_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = body
      ? ['--', 'bash', '-c', `curl -sS -X POST -H 'Content-Type: application/json' --max-time ${Math.ceil(timeoutMs / 1000)} --data-binary @- http://localhost:11434${pathAndQuery}`]
      : ['--', 'bash', '-c', `curl -sS --max-time ${Math.ceil(timeoutMs / 1000)} http://localhost:11434${pathAndQuery}`];
    const child = spawn('wsl.exe', args, { windowsHide: true });
    let out = '';
    let err = '';
    const killer = setTimeout(() => child.kill(), timeoutMs + 2000);
    child.stdout.on('data', (c) => (out += c.toString('utf-8')));
    child.stderr.on('data', (c) => (err += c.toString('utf-8')));
    child.on('error', (e) => {
      clearTimeout(killer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(killer);
      if (code === 0) resolve(out);
      else reject(new Error(`wsl curl exited ${code}: ${err || out}`));
    });
    if (body) {
      child.stdin.write(JSON.stringify(body));
      child.stdin.end();
    }
  });
}

async function tryDirectFetch(path: string, body?: object, timeoutMs = 120_000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${OLLAMA_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      signal: ctrl.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function ollamaCall(path: string, body?: object, timeoutMs = 120_000): Promise<string> {
  try {
    return await tryDirectFetch(path, body, Math.min(timeoutMs, 4000));
  } catch (e) {
    if (!USE_WSL_FALLBACK) throw e;
    return await wslCurl(path, body, timeoutMs);
  }
}

export async function ollamaChat(
  messages: OllamaChatMessage[],
  opts: { temperature?: number; numPredict?: number; timeoutMs?: number } = {}
): Promise<string> {
  const { temperature = 0.85, numPredict = 600, timeoutMs = 120_000 } = opts;
  // qwen3 supports turning off chain-of-thought by appending /no_think to user msg.
  // We append it to the last user message to force a direct response.
  const tweaked = messages.map((m, i) => {
    if (i === messages.length - 1 && m.role === 'user' && !m.content.includes('/no_think')) {
      return { ...m, content: m.content + ' /no_think' };
    }
    return m;
  });
  const text = await ollamaCall(
    '/api/chat',
    {
      model: OLLAMA_MODEL,
      messages: tweaked,
      stream: false,
      think: false,
      options: { temperature, num_predict: numPredict },
    },
    timeoutMs
  );
  const data = JSON.parse(text) as OllamaChatResponse;
  if (data.error) throw new Error(data.error);
  const raw = data.message?.content ?? '';
  return cleanModelOutput(raw);
}

function cleanModelOutput(raw: string): string {
  // 1) Remove explicit <think>...</think> blocks
  let s = raw.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim();
  // 2) If the model left an unclosed <think> (cut off by num_predict), drop everything before/after it
  if (s.includes('<think>')) {
    const after = s.split('</think>').pop();
    if (after && after.trim()) s = after.trim();
    else s = '';
  }
  // 3) Strip leading "Adam:" / "Coach:" prefixes
  s = s.replace(/^(coach|adam|odpowiedź|response)\s*:\s*/i, '').trim();
  // 4) If still empty, surface a clear marker so UI can retry
  if (!s) return '[Model thinking too long — spróbuj jeszcze raz]';
  return s;
}

export async function ollamaHealthcheck(): Promise<{ ok: boolean; models?: string[]; error?: string; via?: 'fetch' | 'wsl' }> {
  // Try direct fetch first (very short timeout to keep healthcheck snappy)
  try {
    const t = await tryDirectFetch('/api/tags', undefined, 1500);
    const data = JSON.parse(t) as { models?: { name: string }[] };
    return { ok: true, models: data.models?.map((m) => m.name) ?? [], via: 'fetch' };
  } catch {}
  if (!USE_WSL_FALLBACK) return { ok: false, error: 'fetch failed and no WSL fallback' };
  try {
    // First WSL invocation has a ~6s cold-start cost; subsequent calls are <300ms
    const t = await wslCurl('/api/tags', undefined, 12_000);
    const data = JSON.parse(t) as { models?: { name: string }[] };
    return { ok: true, models: data.models?.map((m) => m.name) ?? [], via: 'wsl' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
