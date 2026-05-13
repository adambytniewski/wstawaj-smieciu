import PageHeader from '@/components/PageHeader';
import Coding from '@/components/Coding';

export const dynamic = 'force-dynamic';

export default function CodingPage() {
  return (
    <>
      <PageHeader title="AI CODING" subtitle="Auto z Second Brain" accent="#22d3ee" />
      <Coding />
    </>
  );
}
