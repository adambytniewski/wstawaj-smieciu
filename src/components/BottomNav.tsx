'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Brain, Dumbbell, Moon, Code2, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

const items = [
  { href: '/', label: 'Dziś', icon: Home, color: '#fafafa' },
  { href: '/deep-work', label: 'Focus', icon: Brain, color: '#ff2d2d' },
  { href: '/gym', label: 'Gym', icon: Dumbbell, color: '#ff8a00' },
  { href: '/sleep', label: 'Sen', icon: Moon, color: '#7c5cff' },
  { href: '/coding', label: 'Code', icon: Code2, color: '#22d3ee' },
  { href: '/coach', label: 'Coach', icon: MessageSquare, color: '#ff2d2d' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)', paddingTop: '8px' }}
    >
      <div className="mx-auto max-w-md px-3 pointer-events-auto">
        <div
          className="relative flex items-center justify-between rounded-2xl px-1.5 py-1.5"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,24,0.9) 0%, rgba(8,8,10,0.95) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 32px -12px rgba(0,0,0,0.8)',
          }}
        >
          {items.map(({ href, label, icon: Icon, color }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center justify-center flex-1 h-12 rounded-xl"
              >
                {active && (
                  <motion.span
                    layoutId="navActive"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: `linear-gradient(180deg, ${color}26 0%, ${color}10 100%)`,
                      border: `1px solid ${color}33`,
                      boxShadow: `0 0 18px -4px ${color}55 inset`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative">
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.6 : 1.9}
                    style={{ color: active ? color : '#71717a' }}
                  />
                </span>
                <span
                  className={clsx(
                    'relative text-[9px] tracking-wider uppercase font-bold mt-0.5',
                    active ? 'text-ink' : 'text-muted2'
                  )}
                  style={active ? { color } : {}}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
