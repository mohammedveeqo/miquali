/**
 * ProgressionEngine — Pure functions implementing the sequential gating system.
 *
 * All functions accept ProgressState and ProgressionConfig as parameters,
 * making them testable without needing the actual Zustand store.
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 3.1, 3.7, 4.1, 4.4, 5.1, 5.3
 */

import type {
  ProgressionConfig,
  Cluster,
  ProgressState,
} from '@/types';

/**
 * Determine whether a topic is unlocked for the learner.
 *
 * Rules:
 * - The first topic in the first cluster is always unlocked.
 * - Within a cluster: the previous topic must have miniQuizPassed = true.
 * - First topic of a new cluster: the previous cluster's diagram task must be submitted.
 *
 * @param topicId - The topic to check
 * @param state - Current progress state
 * @param config - Progression configuration
 * @returns true if the topic is unlocked
 */
export function isTopicUnlocked(
  topicId: string,
  state: ProgressState,
  config: ProgressionConfig
): boolean {
  for (const section of config.sections) {
    for (let clusterIndex = 0; clusterIndex < section.clusters.length; clusterIndex++) {
      const cluster = section.clusters[clusterIndex];
      const topicIndex = cluster.topicIds.indexOf(topicId);

      if (topicIndex === -1) {
        continue;
      }

      // First topic in the first cluster is always unlocked
      if (clusterIndex === 0 && topicIndex === 0) {
        return true;
      }

      // First topic in a subsequent cluster: previous cluster's diagram task must be submitted
      if (topicIndex === 0) {
        const previousCluster = section.clusters[clusterIndex - 1];
        const previousDiagramProgress =
          state.diagramTaskProgress[previousCluster.diagramTaskId];
        return previousDiagramProgress?.submitted === true;
      }

      // Within a cluster: previous topic must have miniQuizPassed
      const previousTopicId = cluster.topicIds[topicIndex - 1];
      const previousTopicProgress = state.topicProgress[previousTopicId];
      return previousTopicProgress?.miniQuizPassed === true;
    }
  }

  // Topic not found in config — treat as locked
  return false;
}

/**
 * Determine whether the mini-quiz is unlocked for a topic.
 * Requires the concept chat to be passed for that topic.
 *
 * @param topicId - The topic to check
 * @param state - Current progress state
 * @returns true if the quiz is unlocked
 */
export function isQuizUnlocked(topicId: string, state: ProgressState): boolean {
  const topicProgress = state.topicProgress[topicId];
  return topicProgress?.conceptChatPassed === true;
}

/**
 * Determine whether a diagram task is pending (ready to be completed).
 * All topics in the cluster must have miniQuizPassed AND the diagram task
 * must not yet be submitted.
 *
 * @param clusterId - The cluster to check
 * @param state - Current progress state
 * @param config - Progression configuration
 * @returns true if the diagram task is pending
 */
export function isDiagramTaskPending(
  clusterId: string,
  state: ProgressState,
  config: ProgressionConfig
): boolean {
  const cluster = findClusterById(clusterId, config);
  if (!cluster) {
    return false;
  }

  // Check all topics in the cluster have miniQuizPassed
  const allTopicsComplete = cluster.topicIds.every((topicId) => {
    const progress = state.topicProgress[topicId];
    return progress?.miniQuizPassed === true;
  });

  if (!allTopicsComplete) {
    return false;
  }

  // Check diagram task is NOT yet submitted
  const diagramProgress = state.diagramTaskProgress[cluster.diagramTaskId];
  return diagramProgress?.submitted !== true;
}

/**
 * Determine whether the section quiz is unlocked.
 * Requires ALL 18 topics to have miniQuizPassed AND ALL diagram tasks submitted.
 *
 * @param state - Current progress state
 * @param config - Progression configuration
 * @returns true if the section quiz is unlocked
 */
export function isSectionQuizUnlocked(
  state: ProgressState,
  config: ProgressionConfig
): boolean {
  for (const section of config.sections) {
    for (const cluster of section.clusters) {
      // Check all topics in the cluster have miniQuizPassed
      for (const topicId of cluster.topicIds) {
        const progress = state.topicProgress[topicId];
        if (!progress?.miniQuizPassed) {
          return false;
        }
      }

      // Check diagram task is submitted
      const diagramProgress = state.diagramTaskProgress[cluster.diagramTaskId];
      if (!diagramProgress?.submitted) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Determine whether capstone challenges are unlocked.
 * Requires at least one section quiz attempt to have passed (≥70%).
 *
 * @param state - Current progress state
 * @returns true if capstone challenges are unlocked
 */
export function isCapstoneUnlocked(state: ProgressState): boolean {
  return state.sectionQuizAttempts.some((attempt) => attempt.passed === true);
}

/**
 * Get the next unlocked topic that hasn't been completed yet.
 * Useful for guiding the learner to their next step.
 *
 * @param state - Current progress state
 * @param config - Progression configuration
 * @returns The topic ID of the next unlocked incomplete topic, or null if all complete
 */
export function getNextUnlockedTopic(
  state: ProgressState,
  config: ProgressionConfig
): string | null {
  const allTopicIds = getAllTopicIds(config);

  for (const topicId of allTopicIds) {
    const progress = state.topicProgress[topicId];
    const isComplete = progress?.miniQuizPassed === true;

    if (!isComplete && isTopicUnlocked(topicId, state, config)) {
      return topicId;
    }
  }

  return null;
}

/**
 * Find the cluster that contains a given topic.
 *
 * @param topicId - The topic to look up
 * @param config - Progression configuration
 * @returns The Cluster containing the topic, or null if not found
 */
export function getTopicCluster(
  topicId: string,
  config: ProgressionConfig
): Cluster | null {
  for (const section of config.sections) {
    for (const cluster of section.clusters) {
      if (cluster.topicIds.includes(topicId)) {
        return cluster;
      }
    }
  }
  return null;
}

/**
 * Get all topic IDs in order across all sections and clusters.
 *
 * @param config - Progression configuration
 * @returns Ordered array of all topic IDs
 */
export function getAllTopicIds(config: ProgressionConfig): string[] {
  const topicIds: string[] = [];
  for (const section of config.sections) {
    for (const cluster of section.clusters) {
      for (const topicId of cluster.topicIds) {
        topicIds.push(topicId);
      }
    }
  }
  return topicIds;
}

// --- Completion methods that update progress state ---

/**
 * Create a new ProgressState with concept chat marked as passed for a topic.
 *
 * @param topicId - The topic that was passed
 * @param state - Current progress state
 * @returns Updated progress state
 */
export function completeConceptChat(
  topicId: string,
  state: ProgressState
): ProgressState {
  const existing = state.topicProgress[topicId] ?? {
    topicId,
    readComplete: false,
    conceptChatPassed: false,
    miniQuizPassed: false,
    miniQuizAttempts: 0,
  };

  return {
    ...state,
    topicProgress: {
      ...state.topicProgress,
      [topicId]: {
        ...existing,
        conceptChatPassed: true,
      },
    },
  };
}

/**
 * Create a new ProgressState with mini-quiz marked as passed for a topic.
 *
 * @param topicId - The topic whose quiz was passed
 * @param state - Current progress state
 * @returns Updated progress state
 */
export function completeMiniQuiz(
  topicId: string,
  state: ProgressState
): ProgressState {
  const existing = state.topicProgress[topicId] ?? {
    topicId,
    readComplete: false,
    conceptChatPassed: false,
    miniQuizPassed: false,
    miniQuizAttempts: 0,
  };

  return {
    ...state,
    topicProgress: {
      ...state.topicProgress,
      [topicId]: {
        ...existing,
        miniQuizPassed: true,
        miniQuizAttempts: existing.miniQuizAttempts + 1,
        completedAt: new Date().toISOString(),
      },
    },
  };
}

/**
 * Create a new ProgressState with a diagram task marked as submitted.
 *
 * @param taskId - The diagram task that was submitted
 * @param state - Current progress state
 * @returns Updated progress state
 */
export function completeDiagramTask(
  taskId: string,
  state: ProgressState
): ProgressState {
  return {
    ...state,
    diagramTaskProgress: {
      ...state.diagramTaskProgress,
      [taskId]: {
        taskId,
        submitted: true,
        submittedAt: new Date().toISOString(),
      },
    },
  };
}

/**
 * Create a new ProgressState with a section quiz attempt recorded.
 * Pass threshold is ≥70% (14 out of 20).
 *
 * @param score - Number of correct answers (out of 20)
 * @param weakAreas - Topic IDs identified as weak areas
 * @param state - Current progress state
 * @returns Object with updated state and whether the attempt passed
 */
export function completeSectionQuiz(
  score: number,
  weakAreas: string[],
  state: ProgressState
): { state: ProgressState; passed: boolean } {
  const passed = score >= 14;
  const attempt = {
    score,
    passed,
    attemptedAt: new Date().toISOString(),
    weakAreas,
  };

  return {
    state: {
      ...state,
      sectionQuizAttempts: [...state.sectionQuizAttempts, attempt],
    },
    passed,
  };
}

// --- Internal helpers ---

/**
 * Find a cluster by its ID across all sections.
 */
function findClusterById(
  clusterId: string,
  config: ProgressionConfig
): Cluster | null {
  for (const section of config.sections) {
    for (const cluster of section.clusters) {
      if (cluster.id === clusterId) {
        return cluster;
      }
    }
  }
  return null;
}
