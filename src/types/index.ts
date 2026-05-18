/**
 * Barrel export for all MiQuali type definitions.
 * Import types from '@/types' for convenience.
 */

// Content types
export type {
  KeywordReference,
  TopicContent,
  QuizOption,
  QuizQuestion,
  ExpectedConnection,
  DiagramTask,
  RubricWeights,
  CapstoneChallenge,
  Flashcard,
  GlossaryEntry,
} from './content';

// State types
export type {
  TopicProgress,
  DiagramTaskProgress,
  SectionQuizAttempt,
  CapstoneProgress,
  FlashcardStatus,
  StudyStreakData,
  ProgressState,
  AIChatState,
  AnsweredQuestion,
  QuizState,
} from './state';

// AI types
export type {
  ChatMessage,
  TopicContext,
  DiagramSubmission,
  DiagramSubmissionComponent,
  DiagramSubmissionConnection,
  CategoryScore,
  ArchitectureReview,
} from './ai';

// Progression types
export type { Cluster, Section, ProgressionConfig } from './progression';
