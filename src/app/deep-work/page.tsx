import PageHeader from '@/components/PageHeader';
import DeepWork from '@/components/DeepWork';

export const dynamic = 'force-dynamic';

export default function DeepWorkPage() {
  return (
    <>
      <PageHeader title="DEEP WORK" subtitle="Sesje fokusowe" accent="#ff2d2d" />
      <DeepWork />
    </>
  );
}
