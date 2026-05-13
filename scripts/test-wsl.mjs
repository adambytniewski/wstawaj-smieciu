import { spawn } from 'node:child_process';

const t0 = Date.now();
const child = spawn('wsl.exe', ['--', 'bash', '-c', 'curl -sS --max-time 4 http://localhost:11434/api/tags'], { windowsHide: true });
let out = '';
let err = '';
child.stdout.on('data', (c) => (out += c));
child.stderr.on('data', (c) => (err += c));
child.on('close', (code, signal) => {
  console.log('exit code:', code, 'signal:', signal, 'ms:', Date.now() - t0);
  console.log('stdout:', out.slice(0, 200));
  console.log('stderr:', err.slice(0, 200));
});
child.on('error', (e) => console.log('spawn error:', e));
