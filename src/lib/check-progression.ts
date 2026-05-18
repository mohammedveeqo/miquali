/**
 * check-progression.ts — Client-side utility for checking progression unlock status.
 *
 * Since progress state lives in localStorage (via Zustand persist), all gating
 * checks must happen client-side. This module provides helper functions that
 * read from the progress store and progression config to determine what content
 * is accessible.
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

import type { ProgressState, ProgressionConfig, Cluster } from '@/types';
import {
  isTopicUnlocked as engineIsTopicUnlocked,
  isQuizUnlocked as engineIsQuizUnlocked,
  isDiagramTaskPending as engineIsDiagramTaskPending,
  isSectionQuizUnlocked as engineIsSectionQuizUnlocked,
  isCapstoneUnlocked as engineIsCapstoneUnlocked,
  getNextUnlockedTopic,
} from '@/services/progression-engine';
import progressionData from '@/content/progression.json';

/** Static progression config loaded from JSON */
const config: ProgressionConfig = progressionData as ProgressionConfig;

/**
 * Get the progression config.
 */
export function getProgressionConfig(): ProgressionConfig {
  return config;
}

/**
 * Check if a topic is unlocked given the current progress state.
 * @param topicId - The topic to check
 * @param state - Current progress state from the store
 * @returns true if the topic is unlocked
 */
export function checkTopicUnlocked(
  topicId: string,
  state: ProgressState
): boolean {
  return engineIsTopicUnlocked(topicId, state, config);
}

/**
 * Check if the mini-quiz is unlocked for a topic.
 * Requires concept chat to be passed.
 * @param topicId - The topic to check
 * @param state - Current progress state from the store
 * @returns true if the quiz is unlocked
 */
export function checkQuizUnlocked(
  topicId: string,
  state: ProgressState
): boolean {
  return engineIsQuizUnlocked(topicId, state);
}

/**
 * Check if a diagram task is accessible (pending completion).
 * All topics in the cluster must be complete and the diagram not yet submitted.
 * @param taskId - The diagram task ID (e.g., "diagram-1")
 * @param state - Current progress state from the store
 * @returns true if the diagram task is pending (accessible)
 */
export function checkDiagramTaskAccessible(
  taskId: string,
  state: ProgressState
): boolean {
  // Find the cluster that owns this diagram task
  const cluster = findClusterByDiagramTaskId(taskId);
  if (!cluster) {
    return false;
  }
  return engineIsDiagramTaskPending(cluster.id, state, config);
}

/**
 * Check if the section quiz is unlocked.
 * Requires all topics complete and all diagram tasks submitted.
 * @param state - Current progress state from the store
 * @returns true if the section quiz is unlocked
 */
export function checkSectionQuizUnlocked(state: ProgressState): boolean {
  return engineIsSectionQuizUnlocked(state, config);
}

/**
 * Check if capstone challenges are unlocked.
 * Requires at least one section quiz attempt to have passed.
 * @param state - Current progress state from the store
 * @returns true if capstone challenges are unlocked
 */
export function checkCapstoneUnlocked(state: ProgressState): boolean {
  return engineIsCapstoneUnlocked(state);
}

/**
 * Get the next unlocked topic that hasn't been completed.
 * @param state - Current progress state from the store
 * @returns The topic ID or null if all complete
 */
export function getNextTopic(state: ProgressState): string | null {
  return getNextUnlockedTopic(state, config);
}

/**
 * Get the redirect path for a locked topic.
 * Returns the dashboard path.
 */
export function getTopicRedirectPath(): string {
  return '/';
}

/**
 * Get the redirect path for a locked quiz.
 * Returns the topic page path.
 * @param topicId - The topic whose quiz is locked
 */
export function getQuizRedirectPath(topicId: string): string {
  return `/topics/${topicId}`;
}

/**
 * Get the redirect path for a locked diagram task.
 * Returns the dashboard path.
 */
export function getDiagramRedirectPath(): string {
  return '/';
}

/**
 * Get the redirect path for a locked section quiz.
 * Returns the dashboard path.
 */
export function getSectionQuizRedirectPath(): string {
  return '/';
}

/**
 * Get the redirect path for a locked capstone.
 * Returns the section quiz page.
 */
export function getCapstoneRedirectPath(): string {
  return '/section-quiz';
}

/**
 * Find the cluster that contains a given diagram task ID.
 */
function findClusterByDiagramTaskId(taskId: string): Cluster | null {
  for (const section of config.sections) {
    for (const cluster of section.clusters) {
      if (cluster.diagramTaskId === taskId) {
        return cluster;
      }
    }
  }
  return null;
}

/**
 * Determine the "next step" for a topic — what the learner should do next.
 * Used for flow wiring (Concept Chat → Mini-Quiz → next topic).
 * @param topicId - The current topic
 * @param state - Current progress state
 * @returns Object with the next action and path
 */
export function getTopicNextStep(
  topicId: string,
  state: ProgressState
): { action: 'chat' | 'quiz' | 'next-topic' | 'diagram' | 'section-quiz' | 'complete'; path: string; label: string } {
  const progress = state.topicProgress[topicId];

  // If concept chat not passed, go to chat
  if (!progress?.conceptChatPassed) {
    return {
      action: 'chat',
      path: `/topics/${topicId}/chat`,
      label: 'Start Concept Chat',
    };
  }

  // If mini-quiz not passed, go to quiz
  if (!progress?.miniQuizPassed) {
    return {
      action: 'quiz',
      path: `/topics/${topicId}/quiz`,
      label: 'Take Mini-Quiz',
    };
  }

  // Topic is complete — check if there's a diagram task pending for this cluster
  const cluster = findClusterContainingTopic(topicId);
  if (cluster) {
    const allClusterTopicsComplete = cluster.topicIds.every((tid) => {
      return state.topicProgress[tid]?.miniQuizPassed === true;
    });
    const diagramSubmitted =
      state.diagramTaskProgress[cluster.diagramTaskId]?.submitted === true;

    if (allClusterTopicsComplete && !diagramSubmitted) {
      return {
        action: 'diagram',
        path: `/diagrams/${cluster.diagramTaskId}`,
        label: 'Complete Diagram Task',
      };
    }
  }

  // Check if section quiz is unlocked
  if (engineIsSectionQuizUnlocked(state, config)) {
    const hasPassed = state.sectionQuizAttempts.some((a) => a.passed);
    if (!hasPassed) {
      return {
        action: 'section-quiz',
        path: '/section-quiz',
        label: 'Take Section Quiz',
      };
    }
  }

  // Find next topic
  const nextTopic = getNextUnlockedTopic(state, config);
  if (nextTopic) {
    return {
      action: 'next-topic',
      path: `/topics/${nextTopic}`,
      label: 'Next Topic',
    };
  }

  return {
    action: 'complete',
    path: '/',
    label: 'Back to Dashboard',
  };
}

/**
 * Find the cluster containing a given topic.
 */
function findClusterContainingTopic(topicId: string): Cluster | null {
  for (const section of config.sections) {
    for (const cluster of section.clusters) {
      if (cluster.topicIds.includes(topicId)) {
        return cluster;
      }
    }
  }
  return null;
}
