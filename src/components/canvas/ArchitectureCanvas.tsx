'use client';

/**
 * ArchitectureCanvas — Main interactive diagram builder using React Flow.
 * Supports drag-and-drop from palette, node rendering, edge creation with
 * connection type selection, real-time validation, and AI submission.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 16.3
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
  type NodeTypes,
  type EdgeTypes,
  type ReactFlowInstance,
  MarkerType,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { Send, Lightbulb, Loader2 } from 'lucide-react';

import { useCanvasStore } from '@/stores/canvas-store';
import { validateDiagram, canSubmit } from '@/services/canvas-validation-engine';
import { reviewArchitecture } from '@/services/ai-service';
import { announceToScreenReader } from '@/lib/accessibility';
import type {
  CanvasComponentDefinition,
  CanvasComponentInstance,
  CanvasConnection,
  ArchitectureReview,
  DiagramState,
  ValidationResult,
} from '@/types';

import { ComponentPalette } from './ComponentPalette';
import { ConnectionTypeSelector } from './ConnectionTypeSelector';
import { ValidationPanel } from './ValidationPanel';
import { ReviewResultsPanel } from './ReviewResultsPanel';
import { CANVAS_COMPONENTS, CONNECTION_TYPES, getConnectionType } from './canvas-data';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ArchitectureCanvasProps {
  /** Whether this is a grouped diagram task or capstone challenge */
  mode: 'diagram' | 'capstone';
  /** The task or challenge ID */
  taskId: string;
  /** Called when submission completes (or null on error) */
  onSubmitComplete?: (result: ArchitectureReview | null) => void;
}

// ─── Custom Node Component ───────────────────────────────────────────────────

interface CanvasNodeData {
  label: string;
  definitionId: string;
  category: 'container' | 'standalone' | 'attached';
  [key: string]: unknown;
}

function CanvasNode({ data }: { data: CanvasNodeData }) {
  const isContainer = data.category === 'container';
  const isAttached = data.category === 'attached';

  return (
    <div
      className={`flex items-center justify-center rounded-lg border text-center text-xs font-medium transition-shadow ${
        isContainer
          ? 'min-h-[60px] min-w-[100px] border-dashed border-blue-500/50 bg-blue-500/5 text-blue-300'
          : isAttached
            ? 'min-h-[40px] min-w-[60px] border-amber-500/50 bg-amber-500/10 text-amber-300'
            : 'min-h-[50px] min-w-[70px] border-border bg-secondary text-foreground'
      }`}
    >
      {data.label}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNode,
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function ArchitectureCanvas({
  mode,
  taskId,
  onSubmitComplete,
}: ArchitectureCanvasProps) {
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Connection type selector state
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [selectorPosition, setSelectorPosition] = useState<{ x: number; y: number } | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<ArchitectureReview | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Canvas store
  const {
    components,
    connections,
    validationErrors,
    validationWarnings,
    addComponent,
    removeComponent,
    moveComponent,
    addConnection,
    setValidationErrors,
    setValidationWarnings,
    setSelectedComponent,
  } = useCanvasStore();

  // ─── Real-time Validation ────────────────────────────────────────────────

  const runValidation = useCallback(() => {
    const diagram: DiagramState = {
      components,
      connections,
    };
    const violations = validateDiagram(diagram);
    const errors = violations.filter((v) => v.severity === 'error');
    const warnings = violations.filter((v) => v.severity === 'warning');
    setValidationErrors(errors);
    setValidationWarnings(warnings);
  }, [components, connections, setValidationErrors, setValidationWarnings]);

  useEffect(() => {
    runValidation();
  }, [runValidation]);

  // ─── Submission Eligibility ──────────────────────────────────────────────

  const diagram: DiagramState = { components, connections };
  const isSubmittable = canSubmit(diagram) && components.length > 0;

  // ─── Drag and Drop from Palette ──────────────────────────────────────────

  const handlePaletteDragStart = useCallback(
    (event: React.DragEvent, definition: CanvasComponentDefinition) => {
      event.dataTransfer.setData('application/qualcheck-component', definition.id);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const definitionId = event.dataTransfer.getData('application/qualcheck-component');
      if (!definitionId || !reactFlowInstance || !reactFlowWrapper.current) return;

      const definition = CANVAS_COMPONENTS.find((c) => c.id === definitionId);
      if (!definition || !definition.mvpEnabled) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const instanceId = uuidv4();
      const label = definition.name;

      // Add to canvas store
      const newComponent: CanvasComponentInstance = {
        id: instanceId,
        definitionId: definition.id,
        x: position.x,
        y: position.y,
        width: definition.defaultSize.width,
        height: definition.defaultSize.height,
        parentId: null,
        label,
      };
      addComponent(newComponent);

      // Add to React Flow nodes
      const newNode: Node = {
        id: instanceId,
        type: 'canvasNode',
        position: { x: position.x, y: position.y },
        data: {
          label,
          definitionId: definition.id,
          category: definition.category,
        },
        style: {
          width: definition.defaultSize.width,
          height: definition.defaultSize.height,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, addComponent, setNodes]
  );

  // ─── Node Interactions ───────────────────────────────────────────────────

  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      // Sync position changes to store
      for (const change of changes) {
        if (change.type === 'position' && change.position && change.id) {
          moveComponent(change.id, change.position.x, change.position.y);
        }
        if (change.type === 'remove' && change.id) {
          removeComponent(change.id);
        }
      }
    },
    [onNodesChange, moveComponent, removeComponent]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedComponent(node.id);
    },
    [setSelectedComponent]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedComponent(null);
  }, [setSelectedComponent]);

  // ─── Edge / Connection Handling ──────────────────────────────────────────

  const handleConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;

      // Show connection type selector
      setPendingConnection(connection);
      // Position the selector near the center of the viewport
      const wrapper = reactFlowWrapper.current;
      if (wrapper) {
        const bounds = wrapper.getBoundingClientRect();
        setSelectorPosition({
          x: bounds.width / 2 - 100,
          y: bounds.height / 2 - 100,
        });
      }
    },
    []
  );

  const handleConnectionTypeSelect = useCallback(
    (connectionType: (typeof CONNECTION_TYPES)[number]) => {
      if (!pendingConnection || !pendingConnection.source || !pendingConnection.target) {
        setPendingConnection(null);
        setSelectorPosition(null);
        return;
      }

      const edgeId = uuidv4();

      // Add to canvas store
      const newConnection: CanvasConnection = {
        id: edgeId,
        sourceId: pendingConnection.source,
        sourcePointId: pendingConnection.sourceHandle || 'default',
        targetId: pendingConnection.target,
        targetPointId: pendingConnection.targetHandle || 'default',
        connectionTypeId: connectionType.id,
      };
      addConnection(newConnection);

      // Add to React Flow edges
      const newEdge: Edge = {
        id: edgeId,
        source: pendingConnection.source,
        target: pendingConnection.target,
        sourceHandle: pendingConnection.sourceHandle,
        targetHandle: pendingConnection.targetHandle,
        type: 'default',
        animated: connectionType.style.animated,
        style: {
          stroke: connectionType.style.strokeColor,
          strokeWidth: connectionType.style.strokeWidth,
          strokeDasharray: connectionType.style.strokeDasharray.join(' ') || undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: connectionType.style.strokeColor,
        },
        label: connectionType.name,
        labelStyle: { fontSize: 10, fill: connectionType.style.strokeColor },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      setPendingConnection(null);
      setSelectorPosition(null);
    },
    [pendingConnection, addConnection, setEdges]
  );

  const handleConnectionTypeCancel = useCallback(() => {
    setPendingConnection(null);
    setSelectorPosition(null);
  }, []);

  // ─── Submission Flow ─────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!isSubmittable || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submissionComponents = components.map((c) => {
        const def = CANVAS_COMPONENTS.find((d) => d.id === c.definitionId);
        return {
          id: c.id,
          type: def?.name || c.definitionId,
          label: c.label,
          parentId: c.parentId,
        };
      });

      const submissionConnections = connections.map((conn) => {
        const ct = getConnectionType(conn.connectionTypeId);
        return {
          sourceId: conn.sourceId,
          targetId: conn.targetId,
          connectionType: ct?.name || conn.connectionTypeId,
        };
      });

      const result = await reviewArchitecture({
        taskId,
        components: submissionComponents,
        connections: submissionConnections,
      });

      setReviewResult(result);
      announceToScreenReader(`Review complete. Overall score: ${result.overallScore} out of 100.`, 'assertive');
      onSubmitComplete?.(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to submit diagram for review.';
      setSubmitError(message);
      announceToScreenReader('Submission failed. Please try again.', 'assertive');
      onSubmitComplete?.(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmittable, isSubmitting, components, connections, taskId, onSubmitComplete]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="relative flex h-full w-full flex-col" role="application" aria-label="Architecture canvas diagram builder">
      {/* Screen reader status announcements for canvas state changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {components.length} components on canvas.
        {validationErrors.length > 0
          ? ` ${validationErrors.length} error${validationErrors.length !== 1 ? 's' : ''} blocking submission.`
          : validationWarnings.length > 0
            ? ` ${validationWarnings.length} warning${validationWarnings.length !== 1 ? 's' : ''}.`
            : ' No validation issues.'}
      </div>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-foreground">
            {mode === 'capstone' ? 'Capstone Challenge' : 'Diagram Task'}
          </h2>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {components.length} components
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Show hints"
            title="Show hints"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Hints</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isSubmittable || isSubmitting}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={
              !isSubmittable
                ? 'Fix errors before submitting'
                : isSubmitting
                  ? 'Submitting...'
                  : 'Submit for AI review'
            }
            title={
              !isSubmittable
                ? 'Fix all errors before submitting'
                : 'Submit for AI review'
            }
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{isSubmitting ? 'Reviewing...' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Component Palette */}
        <ComponentPalette onDragStart={handlePaletteDragStart} />

        {/* Center: React Flow Canvas */}
        <div
          ref={reactFlowWrapper}
          className="relative flex-1"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            className="bg-background"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls className="rounded-lg border border-border bg-card" />
            <MiniMap
              className="rounded-lg border border-border"
              nodeColor="#6366f1"
              maskColor="rgba(0, 0, 0, 0.7)"
            />
            {/* Empty state */}
            {nodes.length === 0 && (
              <Panel position="top-center">
                <div className="mt-20 rounded-lg border border-dashed border-border bg-card/50 px-8 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Drag components from the palette to start building your architecture diagram.
                  </p>
                </div>
              </Panel>
            )}
          </ReactFlow>

          {/* Connection Type Selector Popup */}
          {selectorPosition && pendingConnection && (
            <ConnectionTypeSelector
              position={selectorPosition}
              onSelect={handleConnectionTypeSelect}
              onCancel={handleConnectionTypeCancel}
            />
          )}

          {/* Loading Overlay */}
          {isSubmitting && (
            <div
              className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm"
              role="status"
              aria-label="Submitting diagram for review"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Reviewing your architecture...
                </p>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {submitError && !isSubmitting && (
            <div className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2">
              <p className="text-sm text-red-400">{submitError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Validation Panel */}
      <ValidationPanel errors={validationErrors} warnings={validationWarnings} />

      {/* Review Results Overlay */}
      {reviewResult && (
        <ReviewResultsPanel
          review={reviewResult}
          onClose={() => setReviewResult(null)}
        />
      )}
    </div>
  );
}
