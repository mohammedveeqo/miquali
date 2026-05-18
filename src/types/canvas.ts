/**
 * Canvas type definitions for the Architecture Canvas diagram builder.
 * Covers component definitions, connection types, placement rules,
 * and runtime diagram state.
 */

/** Visual style configuration for a connection line */
export interface ConnectionStyle {
  /** CSS stroke color */
  strokeColor: string;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Dash pattern (empty array for solid line) */
  strokeDasharray: number[];
  /** Whether to render an arrowhead */
  animated: boolean;
}

/** A point on a component where connections can attach */
export interface ConnectionPoint {
  /** Unique identifier for this connection point */
  id: string;
  /** Position relative to component: top, bottom, left, right */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Whether this point can be a connection source */
  allowSource: boolean;
  /** Whether this point can be a connection target */
  allowTarget: boolean;
}

/**
 * Definition of a canvas component type available in the palette.
 * Describes the component's properties and constraints.
 */
export interface CanvasComponentDefinition {
  /** Unique component type identifier */
  id: string;
  /** Display name shown in palette and on canvas */
  name: string;
  /** Component category determining placement behavior */
  category: 'container' | 'standalone' | 'attached';
  /** Icon identifier or path for the component */
  icon: string;
  /** Default dimensions when placed on canvas */
  defaultSize: { width: number; height: number };
  /** For attached components: which container types they can attach to */
  allowedParents?: string[];
  /** For containers: which component types can be placed inside */
  allowedChildren?: string[];
  /** Available connection points on this component */
  connectionPoints: ConnectionPoint[];
  /** Whether this component is available in the MVP */
  mvpEnabled: boolean;
}

/** Definition of a connection type with visual style and validity rules */
export interface ConnectionType {
  /** Unique connection type identifier */
  id: string;
  /** Display name for the connection type */
  name: string;
  /** Visual rendering style for this connection */
  style: ConnectionStyle;
  /** Component type IDs that can be the source of this connection */
  validSourceTypes: string[];
  /** Component type IDs that can be the target of this connection */
  validTargetTypes: string[];
}

/** A placed instance of a component on the canvas */
export interface CanvasComponentInstance {
  /** Unique instance identifier (UUID) */
  id: string;
  /** Reference to the component definition type */
  definitionId: string;
  /** X position on the canvas */
  x: number;
  /** Y position on the canvas */
  y: number;
  /** Current width (may differ from default if resized) */
  width: number;
  /** Current height (may differ from default if resized) */
  height: number;
  /** ID of parent container instance (null if top-level) */
  parentId: string | null;
  /** User-assigned label for this instance */
  label: string;
}

/** A connection between two component instances on the canvas */
export interface CanvasConnection {
  /** Unique connection identifier */
  id: string;
  /** ID of the source component instance */
  sourceId: string;
  /** ID of the source connection point */
  sourcePointId: string;
  /** ID of the target component instance */
  targetId: string;
  /** ID of the target connection point */
  targetPointId: string;
  /** The connection type being used */
  connectionTypeId: string;
}

/** Result of a placement rule validation check */
export interface ValidationResult {
  /** Identifier of the rule that produced this result */
  ruleId: string;
  /** Whether this is a blocking error or non-blocking warning */
  severity: 'error' | 'warning';
  /** Human-readable description of the violation */
  message: string;
  /** IDs of component instances affected by this violation */
  affectedComponents: string[];
}

/**
 * A placement rule that validates component positioning on the canvas.
 * Rules produce errors (block submission) or warnings (allow submission).
 */
export interface PlacementRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable description of what this rule checks */
  description: string;
  /** Whether violations block submission or just warn */
  severity: 'error' | 'warning';
  /**
   * Validation function that checks a component against the current diagram state.
   * Returns true if the rule is satisfied, false if violated.
   */
  validate: (
    component: CanvasComponentInstance,
    diagram: DiagramState
  ) => boolean;
}

/**
 * Complete state of a diagram on the canvas.
 * Used for validation, submission, and persistence.
 */
export interface DiagramState {
  /** All component instances currently on the canvas */
  components: CanvasComponentInstance[];
  /** All connections between components */
  connections: CanvasConnection[];
}
