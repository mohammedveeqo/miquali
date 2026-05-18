/**
 * Canvas module barrel export.
 * Provides the ArchitectureCanvas component and supporting utilities.
 *
 * Use DynamicArchitectureCanvas for lazy-loaded pages (diagrams, capstone)
 * to optimize bundle splitting and keep page loads under 2 seconds.
 */

export { ArchitectureCanvas } from './ArchitectureCanvas';
export { DynamicArchitectureCanvas } from './DynamicArchitectureCanvas';
export { ComponentPalette } from './ComponentPalette';
export { ConnectionTypeSelector } from './ConnectionTypeSelector';
export { ValidationPanel } from './ValidationPanel';
export { ReviewResultsPanel } from './ReviewResultsPanel';
export {
  CANVAS_COMPONENTS,
  CONNECTION_TYPES,
  PALETTE_GROUPS,
  getComponentDefinition,
  getConnectionType,
} from './canvas-data';
