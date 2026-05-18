/**
 * State type definitions for Zustand stores.
 * All state is persisted to browser localStorage.
 */

import type { QuizQuestion } from './content';
import type { ChatMessage } from './ai';

/** Progress tracking for a single topic */
export interface TopicProgress {
  /** The topic this progress record belongs to */
  topicId: string;
  /** Whether the learner has finished reading the topic content */
  readComplete: boolean;
  /** Whether the concept chat assessment was passed */
  conceptChatPassed: boolean;
  /** Whether the mini-quiz was passed (3 correct answers) */
  miniQuizPassed: boolean;
  /** Number of mini-quiz attempts (for weak area identification) */
  miniQuizAttempts: number;
  /** ISO timestamp when the topic was fully completed */
  completedAt?: string;
}

/** Progress tracking for a grouped diagram task */
export interface DiagramTaskProgress {
  /** The diagram task identifier */
  taskId: string;
  /** Whether the task has been submitted */
  submitted: boolean;
  /** ISO timestamp of submission */
  submittedAt?: string;
  /** AI feedback received after submission */
  feedback?: string;
}

/** A single section quiz attempt record */
export interface SectionQuizAttempt {
  /** Number of correct answers (out of 20) */
  score: number;
  /** Whether this attempt passed (score >= 14) */
  passed: boolean;
  /** ISO timestamp of the attempt */
  attemptedAt: string;
  /** Topic IDs identified as weak areas on failure */
  weakAreas: string[];
}

/** Progress tracking for a capstone challenge */
export interface CapstoneProgress {
  /** The capstone challenge identifier */
  challengeId: string;
  /** Whether the capstone has been submitted */
  submitted: boolean;
  /** Overall AI review score (0-100) */
  score?: number;
  /** ISO timestamp of submission */
  submittedAt?: string;
}

/** Tracking status for a single flashcard */
export interface FlashcardStatus {
  /** Whether the learner marked this card as "got-it" */
  gotIt: boolean;
  /** ISO timestamp of last review */
  lastReviewedAt?: string;
}

/** Study streak tracking data */
export interface StudyStreakData {
  /** Current consecutive day streak count */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** ISO date string of the last activity (YYYY-MM-DD) */
  lastActivityDate: string;
}

/**
 * Root progress state persisted to localStorage.
 * Tracks all learner progress across the platform.
 */
export interface ProgressState {
  /** Per-topic progress keyed by topic ID */
  topicProgress: Record<string, TopicProgress>;
  /** Per-diagram-task progress keyed by task ID */
  diagramTaskProgress: Record<string, DiagramTaskProgress>;
  /** History of section quiz attempts */
  sectionQuizAttempts: SectionQuizAttempt[];
  /** Per-capstone progress keyed by challenge ID */
  capstoneProgress: Record<string, CapstoneProgress>;
  /** Per-flashcard status keyed by flashcard ID */
  flashcardProgress: Record<string, FlashcardStatus>;
  /** Study streak tracking */
  studyStreak: StudyStreakData;
  /** ISO date string of the last activity (YYYY-MM-DD) */
  lastActivityDate: string;
}

/**
 * AI chat store state for concept chat and tutor interactions.
 * Tracks conversation history and session limits.
 */
export interface AIChatState {
  /** Ordered list of messages in the current conversation */
  messages: ChatMessage[];
  /** Whether an AI response is currently being streamed */
  isStreaming: boolean;
  /** Number of learner messages sent in concept chat (max 4) */
  exchangeCount: number;
  /** Total messages in the current AI tutor session (soft limit 20) */
  sessionMessageCount: number;
  /** Result of concept chat assessment (null if not yet determined) */
  assessmentResult?: 'pass' | 'fail' | null;
}

/** A question that has been answered in a quiz session */
export interface AnsweredQuestion {
  /** The question that was answered */
  questionId: string;
  /** The option ID selected by the learner */
  selectedOptionId: string;
  /** Whether the selected option was correct */
  isCorrect: boolean;
}

/**
 * Quiz store state for mini-quiz and section quiz sessions.
 * Tracks the current question pool and answer progress.
 */
export interface QuizState {
  /** Questions available in the current session */
  currentQuestions: QuizQuestion[];
  /** Questions already answered with results */
  answeredQuestions: AnsweredQuestion[];
  /** Running count of correct answers in this session */
  correctCount: number;
  /** Index of the current question being displayed */
  currentQuestionIndex: number;
}
