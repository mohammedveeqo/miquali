/**
 * ContentService — Server-side content loading service.
 * Reads static JSON files from src/content/ using fs/promises.
 * Caches loaded content in module-level variables to avoid re-reading on every call.
 * Designed for use in Next.js App Router server components.
 */

import { promises as fs } from 'fs';
import path from 'path';

import type {
  TopicContent,
  QuizQuestion,
  DiagramTask,
  CapstoneChallenge,
  Flashcard,
  GlossaryEntry,
  KeywordReference,
  ProgressionConfig,
} from '@/types';

/** Resolve the absolute path to the content directory */
function getContentDir(): string {
  return path.join(process.cwd(), 'src', 'content');
}

/**
 * Read and parse a JSON file from the content directory.
 * Throws a descriptive error if the file doesn't exist or can't be parsed.
 */
async function readJsonFile<T>(relativePath: string): Promise<T> {
  const filePath = path.join(getContentDir(), relativePath);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Content file not found: ${relativePath}. Expected at: ${filePath}`
      );
    }
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse content file: ${relativePath}. Invalid JSON: ${error.message}`
      );
    }
    throw new Error(
      `Failed to read content file: ${relativePath}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Module-level caches to avoid re-reading files on every call
const topicCache = new Map<string, TopicContent>();
const quizPoolCache = new Map<string, QuizQuestion[]>();
const diagramTaskCache = new Map<string, DiagramTask>();
const capstoneCache = new Map<string, CapstoneChallenge>();
let flashcardsCache: Flashcard[] | null = null;
let glossaryCache: GlossaryEntry[] | null = null;
let keywordsCache: KeywordReference[] | null = null;
let sectionQuizCache: QuizQuestion[] | null = null;
let progressionCache: ProgressionConfig | null = null;

/**
 * Get the structured content for a specific topic.
 * @param topicId - The unique topic identifier (e.g., "what-is-vpc")
 * @returns The full TopicContent object
 * @throws If the topic file does not exist or is malformed
 */
export async function getTopicContent(topicId: string): Promise<TopicContent> {
  const cached = topicCache.get(topicId);
  if (cached) return cached;

  const content = await readJsonFile<TopicContent>(`topics/${topicId}.json`);
  topicCache.set(topicId, content);
  return content;
}

/**
 * Get the quiz question pool for a specific topic.
 * @param topicId - The unique topic identifier
 * @returns Array of QuizQuestion objects for the topic
 * @throws If the quiz file does not exist or is malformed
 */
export async function getQuizPool(topicId: string): Promise<QuizQuestion[]> {
  const cached = quizPoolCache.get(topicId);
  if (cached) return cached;

  const questions = await readJsonFile<QuizQuestion[]>(`quizzes/${topicId}.json`);
  quizPoolCache.set(topicId, questions);
  return questions;
}

/**
 * Get all section quiz questions.
 * @returns Array of QuizQuestion objects for the section quiz
 * @throws If the section-quiz.json file does not exist or is malformed
 */
export async function getSectionQuizQuestions(): Promise<QuizQuestion[]> {
  if (sectionQuizCache) return sectionQuizCache;

  const questions = await readJsonFile<QuizQuestion[]>('section-quiz.json');
  sectionQuizCache = questions;
  return questions;
}

/**
 * Get a specific diagram task by its ID.
 * @param taskId - The unique diagram task identifier (e.g., "diagram-1")
 * @returns The DiagramTask object
 * @throws If the diagram task file does not exist or is malformed
 */
export async function getDiagramTask(taskId: string): Promise<DiagramTask> {
  const cached = diagramTaskCache.get(taskId);
  if (cached) return cached;

  const task = await readJsonFile<DiagramTask>(`diagrams/${taskId}.json`);
  diagramTaskCache.set(taskId, task);
  return task;
}

/**
 * Get all flashcards for the platform.
 * @returns Array of Flashcard objects
 * @throws If flashcards.json does not exist or is malformed
 */
export async function getFlashcards(): Promise<Flashcard[]> {
  if (flashcardsCache) return flashcardsCache;

  const flashcards = await readJsonFile<Flashcard[]>('flashcards.json');
  flashcardsCache = flashcards;
  return flashcards;
}

/**
 * Get all glossary entries.
 * @returns Array of GlossaryEntry objects
 * @throws If glossary.json does not exist or is malformed
 */
export async function getGlossaryEntries(): Promise<GlossaryEntry[]> {
  if (glossaryCache) return glossaryCache;

  const entries = await readJsonFile<GlossaryEntry[]>('glossary.json');
  glossaryCache = entries;
  return entries;
}

/**
 * Get all keyword tooltip references.
 * @returns Array of KeywordReference objects
 * @throws If keywords.json does not exist or is malformed
 */
export async function getKeywordTooltips(): Promise<KeywordReference[]> {
  if (keywordsCache) return keywordsCache;

  const keywords = await readJsonFile<KeywordReference[]>('keywords.json');
  keywordsCache = keywords;
  return keywords;
}

/**
 * Get a specific capstone challenge by its ID.
 * @param challengeId - The unique capstone challenge identifier (e.g., "capstone-1")
 * @returns The CapstoneChallenge object
 * @throws If the capstone challenge file does not exist or is malformed
 */
export async function getCapstoneChallenge(challengeId: string): Promise<CapstoneChallenge> {
  const cached = capstoneCache.get(challengeId);
  if (cached) return cached;

  const challenge = await readJsonFile<CapstoneChallenge>(`capstone/${challengeId}.json`);
  capstoneCache.set(challengeId, challenge);
  return challenge;
}

/**
 * Get the progression configuration defining sections, clusters, and topic ordering.
 * @returns The ProgressionConfig object
 * @throws If progression.json does not exist or is malformed
 */
export async function getProgressionConfig(): Promise<ProgressionConfig> {
  if (progressionCache) return progressionCache;

  const config = await readJsonFile<ProgressionConfig>('progression.json');
  progressionCache = config;
  return config;
}
