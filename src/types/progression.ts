/**
 * Progression model type definitions.
 * Defines the structure of sections, clusters, and topic ordering
 * that drives the sequential gating system.
 */

/** A cluster of 2-3 topics gated by a grouped diagram task */
export interface Cluster {
  /** Unique cluster identifier */
  id: string;
  /** Ordered list of topic IDs in this cluster */
  topicIds: string[];
  /** The diagram task ID that gates the next cluster */
  diagramTaskId: string;
}

/** A learning section containing multiple topic clusters */
export interface Section {
  /** Unique section identifier */
  id: string;
  /** Display name for the section */
  name: string;
  /** Ordered list of clusters in this section */
  clusters: Cluster[];
  /** The section quiz ID that gates capstone challenges */
  sectionQuizId: string;
  /** Capstone challenge IDs unlocked after passing the section quiz */
  capstoneIds: string[];
}

/**
 * Root progression configuration loaded from static JSON.
 * Defines the complete learning path structure.
 */
export interface ProgressionConfig {
  /** All sections in the platform (MVP: Networking only) */
  sections: Section[];
}
