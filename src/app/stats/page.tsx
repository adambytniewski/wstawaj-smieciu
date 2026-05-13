import PageHeader from '@/components/PageHeader';
import StatsView from '@/components/StatsView';
import { getLastNDays, getStreaks } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const [days, streaks] = await Promise.all([getLastNDays(30), getStreaks()]);
  return (
    <>
      <PageHeader title="STATYSTYKI" subtitle="Co naprawdę robisz" accent="#34d399" />
      <StatsView days={days} streaks={streaks} />
    </>
  );
}
