import PageHeader from '@/components/PageHeader';
import Coach from '@/components/Coach';

export const dynamic = 'force-dynamic';

export default function CoachPage() {
  return (
    <>
      <PageHeader title="COACH" subtitle="Bez owijania" accent="#ff2d2d" />
      <Coach />
    </>
  );
}
