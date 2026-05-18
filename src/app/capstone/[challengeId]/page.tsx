import { CapstoneGate } from '@/components/layout/CapstoneGate';

interface CapstonePageProps {
  params: Promise<{ challengeId: string }>;
}

export default async function CapstonePage({ params }: CapstonePageProps) {
  const { challengeId } = await params;

  return (
    <CapstoneGate challengeId={challengeId}>
      <main className="flex min-h-screen flex-col p-8">
        <h1 className="text-3xl font-bold text-foreground">
          Capstone Challenge: {challengeId}
        </h1>
        <p className="mt-4 text-muted-foreground">
          Design a complete architecture solution. Your submission will be reviewed
          by Nova Pro using the rubric: correctness (40%), connectivity (30%),
          security (20%), best practices (10%).
        </p>
        <section className="mt-8 rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Architecture Canvas
          </h2>
          <p className="mt-2 text-muted-foreground">
            Build your architecture diagram to meet the challenge requirements.
          </p>
        </section>
      </main>
    </CapstoneGate>
  );
}
