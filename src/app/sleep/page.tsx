import PageHeader from '@/components/PageHeader';
import Sleep from '@/components/Sleep';

export const dynamic = 'force-dynamic';

export default function SleepPage() {
  return (
    <>
      <PageHeader title="SEN" subtitle="Bez tego deep work to żart" accent="#7c5cff" />
      <Sleep />
    </>
  );
}
