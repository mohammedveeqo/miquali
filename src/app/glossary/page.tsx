import type { GlossaryEntry } from '@/types/content';
import { GlossaryView } from '@/components/glossary/GlossaryView';
import glossaryData from '@/content/glossary.json';

/**
 * Glossary page — loads glossary entries server-side from static JSON
 * and renders the interactive GlossaryView client component.
 */
export default function GlossaryPage() {
  const entries: GlossaryEntry[] = glossaryData as GlossaryEntry[];

  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-3xl font-bold text-foreground">Glossary</h1>
      <p className="mt-2 text-muted-foreground">
        Search and filter architecture and exam terms. Approximately{' '}
        {entries.length} entries covering the Networking section.
      </p>
      <section className="mt-8">
        <GlossaryView entries={entries} />
      </section>
    </main>
  );
}
