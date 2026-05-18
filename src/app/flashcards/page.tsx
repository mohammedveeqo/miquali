/**
 * Flashcards page — Loads flashcard data from static JSON and renders
 * the FlashcardDeck component for interactive spaced repetition review.
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { FlashcardDeck } from '@/components/flashcards/FlashcardDeck';
import type { Flashcard } from '@/types';
import flashcardsData from '@/content/flashcards.json';

export default function FlashcardsPage() {
  const flashcards: Flashcard[] = flashcardsData as Flashcard[];

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Flashcards</h1>
        <p className="text-muted-foreground mb-8">
          Review key networking concepts with flip cards. Mark each card as
          &quot;got-it&quot; or &quot;review-again&quot; to track your progress.
        </p>
        <FlashcardDeck flashcards={flashcards} />
      </div>
    </main>
  );
}
