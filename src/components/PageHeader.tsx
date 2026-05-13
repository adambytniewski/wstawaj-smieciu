'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  accent?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, accent = '#fafafa', action }: PageHeaderProps) {
  return (
    <header className="px-5 pt-7 pb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="display text-display-md leading-none"
          style={{ color: accent }}
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-muted text-sm mt-2"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {action}
    </header>
  );
}
