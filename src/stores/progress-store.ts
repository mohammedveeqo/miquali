/**
 * Progress Store — Zustand store with localStorage persistence.
 * Tracks all learner progress: topic completion, quiz attempts,
 * diagram tasks, capstone challenges, flashcards, and study streaks.
 *
 * Validates: Requirements 8.5, 8.6, 13.1, 13.2, 13.3, 13.4
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ProgressState,
  TopicProgress,
  DiagramTaskProgress,
  SectionQuizAttempt,
  CapstoneProgress,
  FlashcardStatus,
  StudyStreakData,
} from '@/types';

/** localStorage key for persisted progress state */
const STORAGE_KEY = 'qualcheck-progress';

/** Actions available on the progress store */
interface ProgressActions {
  /** Mark a topic as read (content consumed) */
  markTopicRead: (topicId: string) => void;
  /** Mark concept chat as passed for a topic */
  completeConceptChat: (topicId: string) => void;
  /** Mark mini-quiz as passed for a topic, increment attempts, set completedAt */
  completeMiniQuiz: (topicId: string) => void;
  /** Mark a diagram task as submitted */
  completeDiagramTask: (taskId: string) => void;
  /** Record a section quiz attempt; returns whether the attempt passed (score >= 14) */
  completeSectionQuiz: (score: number, weakAreas: string[]) => boolean;
  /** Mark a capstone challenge as submitted with a score */
  completeCapstone: (challengeId: string, score: number) => void;
  /** Update flashcard status (got-it or review-again) */
  updateFlashcardStatus: (flashcardId: string, gotIt: boolean) => void;
  /** Update study streak based on current date vs last activity */
  updateStudyStreak: () => void;
  /** Get topic IDs where miniQuizAttempts > 2 (weak areas) */
  getWeakAreas: () => string[];
  /** Get flashcard IDs marked review-again + weak area topic IDs for daily review */
  getDailyReviewQueue: () => { flashcardIds: string[]; topicIds: string[] };
  /** Dismiss the hydration error notification */
  dismissHydrationError: () => void;
}

/** Default study streak data */
const defaultStudyStreak: StudyStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: '',
};

/** Default/initial progress state */
const defaultProgressState: ProgressState & { hydrationError: boolean } = {
  topicProgress: {},
  diagramTaskProgress: {},
  sectionQuizAttempts: [],
  capstoneProgress: {},
  flashcardProgress: {},
  studyStreak: defaultStudyStreak,
  lastActivityDate: '',
  hydrationError: false,
};

/**
 * Get today's date as an ISO date string (YYYY-MM-DD).
 * Uses local timezone for day boundary calculation.
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the difference in calendar days between two ISO date strings.
 * Returns the number of days between dateA and dateB (dateB - dateA).
 */
function daysDifference(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Ensure a TopicProgress record exists for the given topicId.
 * Returns the existing record or a new default one.
 */
function ensureTopicProgress(
  current: Record<string, TopicProgress>,
  topicId: string
): TopicProgress {
  if (current[topicId]) {
    return current[topicId];
  }
  return {
    topicId,
    readComplete: false,
    conceptChatPassed: false,
    miniQuizPassed: false,
    miniQuizAttempts: 0,
  };
}

/**
 * Creates a debounced localStorage adapter that batches writes.
 * Ensures state persistence completes under 1 second (Requirement 13.2)
 * while avoiding excessive writes on rapid state changes (Requirement 16.3).
 *
 * Writes are debounced with a 300ms delay — fast enough to feel instant
 * but prevents thrashing localStorage on rapid interactions (e.g., multiple
 * quiz answers in quick succession).
 */
function createDebouncedStorage() {
  let pendingValue: string | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    getItem: (name: string): string | null => {
      return localStorage.getItem(name);
    },
    setItem: (name: string, value: string): void => {
      pendingValue = value;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        if (pendingValue !== null) {
          localStorage.setItem(name, pendingValue);
          pendingValue = null;
        }
        timeoutId = null;
      }, 300);
    },
    removeItem: (name: string): void => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
        pendingValue = null;
      }
      localStorage.removeItem(name);
    },
  };
}

/**
 * SSR-safe localStorage storage adapter with debounced writes.
 * Returns a no-op storage when running on the server (typeof window === 'undefined').
 * On the client, uses a debounced adapter to batch rapid state changes.
 */
function getStorage() {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return createJSONStorage(() => createDebouncedStorage());
}

/** Zustand progress store with persist middleware */
export const useProgressStore = create<
  ProgressState & { hydrationError: boolean } & ProgressActions
>()(
  persist(
    (set, get) => ({
      ...defaultProgressState,

      markTopicRead: (topicId: string) => {
        const state = get();
        const existing = ensureTopicProgress(state.topicProgress, topicId);
        set({
          topicProgress: {
            ...state.topicProgress,
            [topicId]: {
              ...existing,
              readComplete: true,
            },
          },
        });
        get().updateStudyStreak();
      },

      completeConceptChat: (topicId: string) => {
        const state = get();
        const existing = ensureTopicProgress(state.topicProgress, topicId);
        set({
          topicProgress: {
            ...state.topicProgress,
            [topicId]: {
              ...existing,
              conceptChatPassed: true,
            },
          },
        });
        get().updateStudyStreak();
      },

      completeMiniQuiz: (topicId: string) => {
        const state = get();
        const existing = ensureTopicProgress(state.topicProgress, topicId);
        set({
          topicProgress: {
            ...state.topicProgress,
            [topicId]: {
              ...existing,
              miniQuizPassed: true,
              miniQuizAttempts: existing.miniQuizAttempts + 1,
              completedAt: new Date().toISOString(),
            },
          },
        });
        get().updateStudyStreak();
      },

      completeDiagramTask: (taskId: string) => {
        const state = get();
        set({
          diagramTaskProgress: {
            ...state.diagramTaskProgress,
            [taskId]: {
              taskId,
              submitted: true,
              submittedAt: new Date().toISOString(),
            },
          },
        });
        get().updateStudyStreak();
      },

      completeSectionQuiz: (score: number, weakAreas: string[]): boolean => {
        const state = get();
        const passed = score >= 14;
        const attempt: SectionQuizAttempt = {
          score,
          passed,
          attemptedAt: new Date().toISOString(),
          weakAreas,
        };
        set({
          sectionQuizAttempts: [...state.sectionQuizAttempts, attempt],
        });
        get().updateStudyStreak();
        return passed;
      },

      completeCapstone: (challengeId: string, score: number) => {
        const state = get();
        set({
          capstoneProgress: {
            ...state.capstoneProgress,
            [challengeId]: {
              challengeId,
              submitted: true,
              score,
              submittedAt: new Date().toISOString(),
            },
          },
        });
        get().updateStudyStreak();
      },

      updateFlashcardStatus: (flashcardId: string, gotIt: boolean) => {
        const state = get();
        set({
          flashcardProgress: {
            ...state.flashcardProgress,
            [flashcardId]: {
              gotIt,
              lastReviewedAt: new Date().toISOString(),
            },
          },
        });
        get().updateStudyStreak();
      },

      updateStudyStreak: () => {
        const state = get();
        const today = getTodayDateString();
        const { studyStreak, lastActivityDate } = state;

        // If already recorded activity today, no change needed
        if (lastActivityDate === today) {
          return;
        }

        let newCurrentStreak: number;
        let newLongestStreak: number;

        if (lastActivityDate === '') {
          // First ever activity
          newCurrentStreak = 1;
          newLongestStreak = Math.max(studyStreak.longestStreak, 1);
        } else {
          const diff = daysDifference(lastActivityDate, today);
          if (diff === 1) {
            // Consecutive day — increment streak
            newCurrentStreak = studyStreak.currentStreak + 1;
            newLongestStreak = Math.max(
              studyStreak.longestStreak,
              newCurrentStreak
            );
          } else {
            // Gap of more than 1 day — reset streak
            newCurrentStreak = 1;
            newLongestStreak = studyStreak.longestStreak;
          }
        }

        set({
          lastActivityDate: today,
          studyStreak: {
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            lastActivityDate: today,
          },
        });
      },

      getWeakAreas: (): string[] => {
        const state = get();
        const weakTopicIds: string[] = [];
        for (const [topicId, progress] of Object.entries(
          state.topicProgress
        )) {
          if (progress.miniQuizAttempts > 2) {
            weakTopicIds.push(topicId);
          }
        }
        return weakTopicIds;
      },

      getDailyReviewQueue: (): {
        flashcardIds: string[];
        topicIds: string[];
      } => {
        const state = get();

        // Flashcards marked as review-again
        const flashcardIds: string[] = [];
        for (const [flashcardId, status] of Object.entries(
          state.flashcardProgress
        )) {
          if (!status.gotIt) {
            flashcardIds.push(flashcardId);
          }
        }

        // Weak area topic IDs (miniQuizAttempts > 2)
        const topicIds = get().getWeakAreas();

        return { flashcardIds, topicIds };
      },

      dismissHydrationError: () => {
        set({ hydrationError: false });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: getStorage(),
      partialize: (state) => ({
        topicProgress: state.topicProgress,
        diagramTaskProgress: state.diagramTaskProgress,
        sectionQuizAttempts: state.sectionQuizAttempts,
        capstoneProgress: state.capstoneProgress,
        flashcardProgress: state.flashcardProgress,
        studyStreak: state.studyStreak,
        lastActivityDate: state.lastActivityDate,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            // Corrupted state detected during hydration — reset to defaults
            console.error(
              '[QualCheck] Failed to hydrate progress state from localStorage. Resetting to defaults.',
              error
            );
            useProgressStore.setState({
              ...defaultProgressState,
              hydrationError: true,
            });
          }
        };
      },
    }
  )
);
