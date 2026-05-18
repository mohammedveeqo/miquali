/**
 * AI service type definitions for Nova Lite (tutor/chat) and Nova Pro (architecture review).
 */

/** A single message in a chat conversation */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Who sent the message */
  role: 'user' | 'assistant' | 'system';
  /** Message text content */
  content: string;
  /** ISO timestamp when the message was sent */
  timestamp: string;
}

/**
 * Context about the current topic passed to the AI service.
 * Ensures AI responses are topic-aware.
 */
export interface TopicContext {
  /** The topic identifier */
  topicId: string;
  /** The topic title for context */
  title: string;
  /** Key points from the topic for grounding AI responses */
  keyPoints: string[];
  /** The section this topic belongs to */
  sectionId: string;
}

/**
 * A diagram submission sent to Nova Pro for architecture review.
 * Contains the full diagram state and metadata.
 */
export interface DiagramSubmission {
  /** The diagram task or capstone challenge ID */
  taskId: string;
  /** All components placed on the canvas */
  components: DiagramSubmissionComponent[];
  /** All connections between components */
  connections: DiagramSubmissionConnection[];
}

/** A component in a diagram submission (simplified for AI review) */
export interface DiagramSubmissionComponent {
  /** Instance ID */
  id: string;
  /** Component type name */
  type: string;
  /** User-assigned label */
  label: string;
  /** Parent container ID if nested */
  parentId: string | null;
}

/** A connection in a diagram submission (simplified for AI review) */
export interface DiagramSubmissionConnection {
  /** Source component ID */
  sourceId: string;
  /** Target component ID */
  targetId: string;
  /** Connection type name */
  connectionType: string;
}

/** Score and feedback for a single rubric category */
export interface CategoryScore {
  /** Score for this category (0-100) */
  score: number;
  /** Weight of this category in the overall score */
  weight: number;
  /** Specific feedback for this category */
  feedback: string;
}

/**
 * Structured AI review response for architecture diagram submissions.
 * Contains per-category scores and overall feedback.
 */
export interface ArchitectureReview {
  /** Overall weighted score (0-100) */
  overallScore: number;
  /** Per-category breakdown of scores */
  categories: {
    correctness: CategoryScore;
    connectivity: CategoryScore;
    security: CategoryScore;
    bestPractices: CategoryScore;
  };
  /** Overall textual feedback */
  feedback: string;
  /** Specific improvement suggestions */
  suggestions: string[];
}
