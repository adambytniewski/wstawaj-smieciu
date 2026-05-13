import PageHeader from '@/components/PageHeader';
import Dashboard from '@/components/Dashboard';
import { getDayStats, getStreaks } from '@/lib/stats';
import { todayKey } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const today = todayKey();
  const [stats, streaks] = await Promise.all([getDayStats(today), getStreaks()]);
  const date = new Date();
  const dateLabel = date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const dayNum = date.toLocaleDateString('pl-PL', { day: '2-digit' });

  return (
    <>
      <PageHeader title="DZIŚ" subtitle={dateLabel} />
      <Dashboard stats={stats} streaks={streaks} />
    </>
  );
}
