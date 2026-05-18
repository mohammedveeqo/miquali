/**
 * Canvas Store — Zustand store for the Architecture Canvas diagram builder.
 * Manages component instances, connections, selection state, and validation results.
 * This store is session-only (no localStorage persistence).
 */

import { create } from 'zustand';
import type {
  CanvasState,
  CanvasComponentInstance,
  CanvasConnection,
  ValidationResult,
} from '@/types';

/** Actions available on the canvas store */
interface CanvasActions {
  /** Add a component instance to the canvas */
  addComponent: (component: CanvasComponentInstance) => void;
  /** Remove a component by instance ID and clean up associated connections */
  removeComponent: (instanceId: string) => void;
  /** Update the x, y position of a component by instance ID */
  moveComponent: (instanceId: string, x: number, y: number) => void;
  /** Add a connection between two components (validates source/target exist) */
  addConnection: (connection: CanvasConnection) => void;
  /** Remove a connection by its ID */
  removeConnection: (connectionId: string) => void;
  /** Set the currently selected component (or null to deselect) */
  setSelectedComponent: (componentId: string | null) => void;
  /** Replace the current validation errors list */
  setValidationErrors: (errors: ValidationResult[]) => void;
  /** Replace the current validation warnings list */
  setValidationWarnings: (warnings: ValidationResult[]) => void;
  /** Reset the canvas to its initial empty state */
  clearCanvas: () => void;
}

/** Initial empty canvas state */
const initialState: CanvasState = {
  components: [],
  connections: [],
  selectedComponent: null,
  validationErrors: [],
  validationWarnings: [],
};

/** Zustand store combining CanvasState and CanvasActions */
export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
  ...initialState,

  addComponent: (component: CanvasComponentInstance) => {
    set((state) => ({
      components: [...state.components, component],
    }));
  },

  removeComponent: (instanceId: string) => {
    set((state) => ({
      components: state.components.filter((c) => c.id !== instanceId),
      connections: state.connections.filter(
        (conn) => conn.sourceId !== instanceId && conn.targetId !== instanceId
      ),
      selectedComponent:
        state.selectedComponent === instanceId ? null : state.selectedComponent,
    }));
  },

  moveComponent: (instanceId: string, x: number, y: number) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === instanceId ? { ...c, x, y } : c
      ),
    }));
  },

  addConnection: (connection: CanvasConnection) => {
    const { components } = get();
    const sourceExists = components.some((c) => c.id === connection.sourceId);
    const targetExists = components.some((c) => c.id === connection.targetId);

    if (!sourceExists || !targetExists) {
      return;
    }

    set((state) => ({
      connections: [...state.connections, connection],
    }));
  },

  removeConnection: (connectionId: string) => {
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== connectionId),
    }));
  },

  setSelectedComponent: (componentId: string | null) => {
    set({ selectedComponent: componentId });
  },

  setValidationErrors: (errors: ValidationResult[]) => {
    set({ validationErrors: errors });
  },

  setValidationWarnings: (warnings: ValidationResult[]) => {
    set({ validationWarnings: warnings });
  },

  clearCanvas: () => {
    set({ ...initialState });
  },
}));
