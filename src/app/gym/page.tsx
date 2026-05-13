import PageHeader from '@/components/PageHeader';
import Gym from '@/components/Gym';

export const dynamic = 'force-dynamic';

export default function GymPage() {
  return (
    <>
      <PageHeader title="GYM" subtitle="Progressive overload" accent="#ff8a00" />
      <Gym />
    </>
  );
}
