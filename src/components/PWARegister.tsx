'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      console.warn('SW register failed:', e);
    });
  }, []);
  return null;
}
