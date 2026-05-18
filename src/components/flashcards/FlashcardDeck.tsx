'use client';

/**
 * FlashcardDeck — Interactive flip card review component with session management.
 * Displays flashcards one at a time with 3D flip animation, got-it/review-again
 * tracking, keyboard navigation, and progress persistence via the Progress Store.
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProgressStore } from '@/stores/progress-store';
import { announceToScreenReader } from '@/lib/accessibility';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Flashcard } from '@/types';

/** Props for the FlashcardDeck component */
export interface FlashcardDeckProps {
  /** Array of flashcards loaded server-side from static JSON */
  flashcards: Flashcard[];
}

/** Shuffles an array using Fisher-Yates algorithm */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * FlashcardDeck component for spaced repetition review.
 * Shows cards one at a time with a 3D flip animation.
 * Got-it removes from session; review-again keeps in rotation.
 * Session ends when no review-again cards remain.
 */
export function FlashcardDeck({ flashcards }: FlashcardDeckProps) {
  // Progress store for persisting flashcard status
  const flashcardProgress = useProgressStore((s) => s.flashcardProgress);
  const updateFlashcardStatus = useProgressStore(
    (s) => s.updateFlashcardStatus
  );

  // Session state
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [gotItCount, setGotItCount] = useState(0);
  const [reviewAgainCount, setReviewAgainCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session: show unseen cards first, then review-again cards
  useEffect(() => {
    if (flashcards.length === 0) {
      setIsInitialized(true);
      return;
    }

    const unseenCards: Flashcard[] = [];
    const reviewAgainCards: Flashcard[] = [];

    for (const card of flashcards) {
      const status = flashcardProgress[card.id];
      if (!status) {
        // Never reviewed — unseen
        unseenCards.push(card);
      } else if (!status.gotIt) {
        // Previously marked review-again
        reviewAgainCards.push(card);
      }
      // Cards marked got-it are excluded from the session
    }

    // Shuffle both groups independently, then combine: unseen first, review-again after
    const orderedSession = [
      ...shuffleArray(unseenCards),
      ...shuffleArray(reviewAgainCards),
    ];

    setSessionCards(orderedSession);
    setCurrentIndex(0);
    setIsFlipped(false);
    setGotItCount(0);
    setReviewAgainCount(0);
    setSessionComplete(orderedSession.length === 0);
    setIsInitialized(true);
    // Only run on mount — flashcardProgress is read once for initial session setup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashcards]);

  /** Current card being displayed */
  const currentCard = useMemo(() => {
    if (currentIndex >= sessionCards.length) return null;
    return sessionCards[currentIndex];
  }, [sessionCards, currentIndex]);

  /** Total cards in the session (initial count) */
  const totalSessionCards = useMemo(() => {
    return sessionCards.length;
  }, [sessionCards]);

  /** Cards processed so far */
  const cardsProcessed = gotItCount + reviewAgainCount;

  /** Flip the current card */
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  /** Mark current card as got-it: remove from session, persist status */
  const handleGotIt = useCallback(() => {
    if (!currentCard) return;

    // Persist to store
    updateFlashcardStatus(currentCard.id, true);
    setGotItCount((prev) => prev + 1);

    // Remove from session cards and advance
    const remaining = sessionCards.filter((_, i) => i !== currentIndex);
    setSessionCards(remaining);

    // Reset flip state
    setIsFlipped(false);

    // Check if session is complete
    if (remaining.length === 0) {
      setSessionComplete(true);
      announceToScreenReader(`Flashcard session complete. ${gotItCount + 1} known, ${reviewAgainCount} to review.`);
    } else {
      // Adjust index if we're at the end
      setCurrentIndex((prev) => (prev >= remaining.length ? 0 : prev));
    }
  }, [currentCard, currentIndex, sessionCards, updateFlashcardStatus]);

  /** Mark current card as review-again: keep in rotation, persist status */
  const handleReviewAgain = useCallback(() => {
    if (!currentCard) return;

    // Persist to store
    updateFlashcardStatus(currentCard.id, false);
    setReviewAgainCount((prev) => prev + 1);

    // Keep card in session but move to next
    setIsFlipped(false);

    if (sessionCards.length === 1) {
      // Only one card left and it's review-again — keep showing it
      setCurrentIndex(0);
    } else {
      // Move to next card, wrap around if at end
      setCurrentIndex((prev) =>
        prev + 1 >= sessionCards.length ? 0 : prev + 1
      );
    }
  }, [currentCard, sessionCards, updateFlashcardStatus]);

  /** Handle keyboard navigation */
  useEffect(() => {
    if (sessionComplete || !isInitialized) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
        case 'Spacebar':
          event.preventDefault();
          handleFlip();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handleGotIt();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleReviewAgain();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionComplete, isInitialized, handleFlip, handleGotIt, handleReviewAgain]);

  // --- Render States ---

  // Loading state
  if (!isInitialized) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading flashcards...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state: no flashcards provided
  if (flashcards.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Flashcards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No flashcards available yet. Check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Session complete: all cards processed
  if (sessionComplete) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Session Complete</CardTitle>
            <Badge variant="default" className="bg-green-600 text-white">
              Done
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div
              className="text-4xl mb-4"
              role="img"
              aria-label="Celebration"
            >
              🎉
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Great work!
            </h3>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {gotItCount}
                </p>
                <p className="text-sm text-muted-foreground">Known</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {reviewAgainCount}
                </p>
                <p className="text-sm text-muted-foreground">To Review</p>
              </div>
            </div>
            {reviewAgainCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Cards marked &quot;review-again&quot; will appear in your next
                session.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No current card (shouldn't happen, but safety check)
  if (!currentCard) {
    return null;
  }

  // Active flashcard state
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {cardsProcessed} / {cardsProcessed + sessionCards.length} cards
        </Badge>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="text-green-500">✓ {gotItCount} known</span>
          <span className="text-amber-500">↻ {reviewAgainCount} review</span>
        </div>
      </div>

      {/* Flashcard with 3D flip animation */}
      <div
        className="perspective-1000"
        style={{ perspective: '1000px' }}
      >
        {/* Screen reader announcement for flip state */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {isFlipped
            ? `Answer: ${currentCard.back}`
            : `Question: ${currentCard.front}`}
        </div>
        <div
          className="relative w-full cursor-pointer transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
          onClick={handleFlip}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFlip();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={
            isFlipped
              ? 'Flashcard showing answer. Click or press Space to flip back.'
              : 'Flashcard showing question. Click or press Space to flip.'
          }
        >
          {/* Front face (question/term) */}
          <Card
            className="w-full min-h-[280px] flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {currentCard.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Tap or Space to flip
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-8">
              <p className="text-lg text-center text-foreground font-medium">
                {currentCard.front}
              </p>
            </CardContent>
          </Card>

          {/* Back face (answer/definition) */}
          <Card
            className="w-full min-h-[280px] flex flex-col absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  Answer
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Tap or Space to flip back
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-8">
              <p className="text-base text-center text-muted-foreground leading-relaxed">
                {currentCard.back}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handleGotIt}
          aria-label="Got it — remove from session (keyboard: left arrow)"
          className="flex items-center gap-2 border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400"
        >
          <span aria-hidden="true">←</span>
          Got it
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleReviewAgain}
          aria-label="Review again — keep in rotation (keyboard: right arrow)"
          className="flex items-center gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
        >
          Review again
          <span aria-hidden="true">→</span>
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground">
        Keyboard: Space to flip · ← Got it · → Review again
      </p>
    </div>
  );
}
