import { DiagramGate } from '@/components/layout/DiagramGate';

interface DiagramTaskPageProps {
  params: Promise<{ taskId: string }>;
}

export default async function DiagramTaskPage({ params }: DiagramTaskPageProps) {
  const { taskId } = await params;

  return (
    <DiagramGate taskId={taskId}>
      <main className="flex min-h-screen flex-col p-8">
        <h1 className="text-3xl font-bold text-foreground">
          Diagram Task: {taskId}
        </h1>
        <p className="mt-4 text-muted-foreground">
          Complete this grouped architecture diagram task to unlock the next topic
          cluster. Build your diagram using the canvas below.
        </p>
        <section className="mt-8 rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Architecture Canvas
          </h2>
          <p className="mt-2 text-muted-foreground">
            Drag and drop components to build your architecture diagram. Submit
            for AI feedback when ready.
          </p>
        </section>
      </main>
    </DiagramGate>
  );
}
