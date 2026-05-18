import { TopicGate } from '@/components/layout/TopicGate';

interface ConceptChatPageProps {
  params: Promise<{ topicId: string }>;
}

export default async function ConceptChatPage({ params }: ConceptChatPageProps) {
  const { topicId } = await params;

  return (
    <TopicGate topicId={topicId}>
      <main className="flex min-h-screen flex-col p-8">
        <h1 className="text-3xl font-bold text-foreground">
          Concept Chat: {topicId}
        </h1>
        <p className="mt-4 text-muted-foreground">
          Explain the concept in your own words. The AI will assess your
          understanding in up to 4 exchanges.
        </p>
        <section className="mt-8 rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Chat Interface
          </h2>
          <p className="mt-2 text-muted-foreground">
            Streaming conversation with Nova Lite for concept assessment.
          </p>
        </section>
      </main>
    </TopicGate>
  );
}
