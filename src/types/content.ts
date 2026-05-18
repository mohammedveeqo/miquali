/**
 * Content type definitions for static JSON learning content.
 * All learning material is loaded from bundled JSON files at build time.
 */

/** Reference to a keyword with tooltip metadata used inline in topic content */
export interface KeywordReference {
  /** The keyword term displayed inline */
  term: string;
  /** Determines tooltip visual style: gold, blue+SVG, or purple */
  type: 'exam-signal' | 'service-reference' | 'architecture-term';
  /** Short definition shown in the tooltip */
  definition: string;
  /** Optional path to a mini-diagram SVG displayed in the tooltip */
  svgDiagram?: string;
}

/** A single topic's structured learning content */
export interface TopicContent {
  /** Unique topic identifier */
  id: string;
  /** Display title for the topic */
  title: string;
  /** Parent section identifier (e.g., "networking") */
  sectionId: string;
  /** Cluster this topic belongs to for grouped diagram gating */
  clusterId: string;
  /** Sequential order within the section (1-based) */
  order: number;
  /** Main explanation content in markdown format */
  explanation: string;
  /** Real-world analogy to aid understanding */
  analogy: string;
  /** SVG reference or inline SVG for the topic diagram */
  diagram: string;
  /** Bullet-point key takeaways */
  keyPoints: string[];
  /** Keywords with tooltip metadata rendered inline */
  examKeywords: KeywordReference[];
  /** Common misconceptions or errors learners make */
  commonMistakes: string[];
  /** IDs of related topics for cross-referencing */
  relatedTopics: string[];
}

/** A single answer option within a quiz question */
export interface QuizOption {
  /** Unique option identifier within the question */
  id: string;
  /** Display text for this option */
  text: string;
}

/** A quiz question drawn from a topic's question pool */
export interface QuizQuestion {
  /** Unique question identifier */
  id: string;
  /** The topic this question belongs to */
  topicId: string;
  /** The question text */
  question: string;
  /** Available answer options (typically 4) */
  options: QuizOption[];
  /** ID of the correct option */
  correctOptionId: string;
  /** Explanation shown after answering (correct or incorrect) */
  explanation: string;
  /** Question difficulty level */
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * An expected connection in a diagram task used for validation hints.
 * Describes a connection the learner should create.
 */
export interface ExpectedConnection {
  /** Source component type or ID */
  sourceType: string;
  /** Target component type or ID */
  targetType: string;
  /** The connection type expected */
  connectionTypeId: string;
}

/** A grouped diagram task assigned after completing a topic cluster */
export interface DiagramTask {
  /** Unique task identifier */
  id: string;
  /** The cluster this task gates */
  clusterId: string;
  /** Display title for the task */
  title: string;
  /** Task description and instructions */
  prompt: string;
  /** Component type IDs that must be placed on the canvas */
  requiredComponents: string[];
  /** Progressive hints to guide the learner */
  hints: string[];
  /** Optional expected connections for validation guidance */
  expectedConnections?: ExpectedConnection[];
}

/** Rubric weight distribution for AI architecture review scoring */
export interface RubricWeights {
  /** Weight for architectural correctness (default 0.4) */
  correctness: number;
  /** Weight for proper connectivity between components (default 0.3) */
  connectivity: number;
  /** Weight for security best practices (default 0.2) */
  security: number;
  /** Weight for general best practices (default 0.1) */
  bestPractices: number;
}

/** A capstone architecture challenge requiring full diagram submission */
export interface CapstoneChallenge {
  /** Unique challenge identifier */
  id: string;
  /** Display title */
  title: string;
  /** Real-world scenario description */
  scenario: string;
  /** Specific requirements the architecture must satisfy */
  requirements: string[];
  /** Scoring rubric weights for AI review */
  rubricWeights: RubricWeights;
}

/** A flashcard for spaced repetition review */
export interface Flashcard {
  /** Unique flashcard identifier */
  id: string;
  /** The topic this flashcard relates to */
  topicId: string;
  /** Front of card: question or term */
  front: string;
  /** Back of card: answer or definition */
  back: string;
  /** Content category for filtering */
  category: string;
}

/** A glossary entry for the searchable reference view */
export interface GlossaryEntry {
  /** Unique entry identifier */
  id: string;
  /** The term being defined */
  term: string;
  /** Full definition of the term */
  definition: string;
  /** Category for filtering in the glossary view */
  category: 'exam-term' | 'service' | 'architecture-pattern';
  /** IDs of related topics for cross-referencing */
  relatedTopics: string[];
}
