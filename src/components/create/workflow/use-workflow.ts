'use client';

import * as React from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import { toast } from 'sonner';
import type {
  WorkflowNodeData,
  WorkflowEdgeData,
  WorkflowDefinition,
  Workflow,
} from '@/types/workflow';
import { isSocketCompatible, SOCKET_COLORS } from '@/types/workflow';
import type { GroupData, CanvasViewport } from '@/types/canvas';
import { getNodeEntry, getAllDefinitions, type ExecutionContext } from './node-registry';
import { executeWorkflow } from './execution-engine';
import { GROUP_PADDING, GROUP_TITLE_HEIGHT, getRandomGroupColor } from '../groups/group-utils';

// Ensure nodes are registered
import './nodes';

// ---------------------------------------------------------------------------
// localStorage persistence helpers
// ---------------------------------------------------------------------------

const WORKFLOW_STORAGE_KEY = 'workflow-canvas-state';

interface PersistedWorkflowState {
  nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data: WorkflowNodeData }>;
  edges: Array<{ id: string; source: string; target: string; sourceHandle: string; targetHandle: string; data?: WorkflowEdgeData }>;
  groups: (GroupData & { locked?: boolean })[];
  viewport: CanvasViewport;
  workflowName: string;
  currentWorkflowId: string | null;
  timestamp: number;
}

function loadPersistedWorkflow(): PersistedWorkflowState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedWorkflowState;
    // Invalidate after 7 days
    if (Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(WORKFLOW_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedWorkflow(state: PersistedWorkflowState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be full or disabled
  }
}

interface UseWorkflowOptions {
  apiId: string;
}

export function useWorkflow({ apiId }: UseWorkflowOptions) {
  // React Flow state
  const [nodes, setNodes, rawOnNodesChange] = useNodesState<Node<WorkflowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<WorkflowEdgeData>>([]);

  // Workflow metadata
  const [groups, setGroups] = React.useState<(GroupData & { locked?: boolean })[]>([]);
  const [viewport, setViewport] = React.useState<CanvasViewport>({ x: 0, y: 0, zoom: 1 });
  const [currentWorkflowId, setCurrentWorkflowId] = React.useState<string | null>(null);
  const [workflowName, setWorkflowName] = React.useState('Untitled Workflow');

  // Execution state
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [executionProgress, setExecutionProgress] = React.useState({ completed: 0, total: 0 });
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Saved workflows
  const [savedWorkflows, setSavedWorkflows] = React.useState<Workflow[]>([]);

  // Ref tracking current groups for use in onNodesChange (avoids stale closures)
  const groupsRef = React.useRef(groups);
  React.useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  // Persistence refs
  const persistTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedPersistedState = React.useRef(false);

  // ---------------------------------------------------------------------------
  // Load persisted state from localStorage on mount
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    if (hasLoadedPersistedState.current) return;
    hasLoadedPersistedState.current = true;

    const persisted = loadPersistedWorkflow();
    if (!persisted) return;
    if (!persisted.nodes || persisted.nodes.length === 0) return;

    setWorkflowName(persisted.workflowName || 'Untitled Workflow');
    setCurrentWorkflowId(persisted.currentWorkflowId ?? null);
    setNodes(
      persisted.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: { ...n.data, status: 'idle' as const, error: undefined, outputValues: undefined },
      })),
    );
    setEdges(
      persisted.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        data: e.data,
      })),
    );
    setGroups(persisted.groups || []);
    if (persisted.viewport) setViewport(persisted.viewport);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Node config updates via custom events (from node components)
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId, config } = (e as CustomEvent).detail as {
        nodeId: string;
        config: Record<string, unknown>;
      };
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, config } }
            : n,
        ),
      );
    };
    window.addEventListener('workflow-node-config', handler);
    return () => window.removeEventListener('workflow-node-config', handler);
  }, [setNodes]);

  // ---------------------------------------------------------------------------
  // Wrapped onNodesChange — drag-to-group membership detection
  // ---------------------------------------------------------------------------

  const onNodesChange = React.useCallback(
    (changes: import('@xyflow/react').NodeChange<Node<WorkflowNodeData>>[]) => {
      rawOnNodesChange(changes);

      // Detect drag-end events (position change where dragging switched to false)
      const dragEndChanges = changes.filter(
        (c): c is import('@xyflow/react').NodeChange<Node<WorkflowNodeData>> & { type: 'position'; id: string; dragging: false } =>
          c.type === 'position' && 'dragging' in c && c.dragging === false,
      );

      if (dragEndChanges.length === 0) return;

      // Use setNodes callback to access latest node positions
      setNodes((currentNodes) => {
        const currentGroups = groupsRef.current;
        let groupsChanged = false;
        let updatedGroups = [...currentGroups];

        for (const change of dragEndChanges) {
          const node = currentNodes.find((n) => n.id === change.id);
          if (!node) continue;

          // Node center point
          const nodeWidth = node.measured?.width ?? 260;
          const nodeHeight = node.measured?.height ?? 140;
          const nodeCenterX = node.position.x + nodeWidth / 2;
          const nodeCenterY = node.position.y + nodeHeight / 2;

          // Find current group membership
          const currentGroupIdx = updatedGroups.findIndex((g) =>
            g.nodeIds.includes(node.id),
          );

          // Find target group by position (node center inside group bounds)
          const targetGroupIdx = updatedGroups.findIndex((g) => {
            const b = g.bounds;
            return (
              nodeCenterX >= b.x &&
              nodeCenterX <= b.x + b.width &&
              nodeCenterY >= b.y &&
              nodeCenterY <= b.y + b.height
            );
          });

          if (currentGroupIdx === targetGroupIdx) {
            // Same group (or both -1) — auto-expand if inside a group
            if (targetGroupIdx !== -1) {
              const group = updatedGroups[targetGroupIdx];
              const b = group.bounds;
              const nodeRight = node.position.x + nodeWidth + GROUP_PADDING;
              const nodeBottom = node.position.y + nodeHeight + GROUP_PADDING;
              const nodeLeft = node.position.x - GROUP_PADDING;
              const nodeTop = node.position.y - GROUP_PADDING - GROUP_TITLE_HEIGHT;

              if (nodeRight > b.x + b.width || nodeBottom > b.y + b.height || nodeLeft < b.x || nodeTop < b.y) {
                const newX = Math.min(b.x, nodeLeft);
                const newY = Math.min(b.y, nodeTop);
                const newRight = Math.max(b.x + b.width, nodeRight);
                const newBottom = Math.max(b.y + b.height, nodeBottom);
                updatedGroups[targetGroupIdx] = {
                  ...group,
                  bounds: { x: newX, y: newY, width: newRight - newX, height: newBottom - newY },
                };
                groupsChanged = true;
              }
            }
            continue;
          }

          groupsChanged = true;

          // Remove from old group
          if (currentGroupIdx !== -1) {
            const oldGroup = updatedGroups[currentGroupIdx];
            updatedGroups[currentGroupIdx] = {
              ...oldGroup,
              nodeIds: oldGroup.nodeIds.filter((id) => id !== node.id),
            };
          }

          // Add to new group and expand bounds if needed
          if (targetGroupIdx !== -1) {
            const newGroup = updatedGroups[targetGroupIdx];
            const b = newGroup.bounds;
            const nodeRight = node.position.x + nodeWidth + GROUP_PADDING;
            const nodeBottom = node.position.y + nodeHeight + GROUP_PADDING;
            const nodeLeft = node.position.x - GROUP_PADDING;
            const nodeTop = node.position.y - GROUP_PADDING - GROUP_TITLE_HEIGHT;
            const newX = Math.min(b.x, nodeLeft);
            const newY = Math.min(b.y, nodeTop);
            const newRight = Math.max(b.x + b.width, nodeRight);
            const newBottom = Math.max(b.y + b.height, nodeBottom);

            updatedGroups[targetGroupIdx] = {
              ...newGroup,
              nodeIds: [...newGroup.nodeIds, node.id],
              bounds: { x: newX, y: newY, width: newRight - newX, height: newBottom - newY },
            };
          }
        }

        if (groupsChanged) {
          // Remove empty groups (groups with 0 nodes after drag-out)
          // Keep groups with at least 1 node
          setGroups(updatedGroups);
        }

        // Return currentNodes unchanged — we only needed to read positions
        return currentNodes;
      });
    },
    [rawOnNodesChange, setNodes, setGroups],
  );

  // ---------------------------------------------------------------------------
  // Connection handling with type validation
  // ---------------------------------------------------------------------------

  const onConnect = React.useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (!connection.sourceHandle || !connection.targetHandle) return;

      // Look up socket types for edge coloring
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      const sourceEntry = getNodeEntry(sourceNode.data.definitionType);
      const targetEntry = getNodeEntry(targetNode.data.definitionType);
      if (!sourceEntry || !targetEntry) return;

      const sourceSocketId = connection.sourceHandle.replace('out-', '');
      const targetSocketId = connection.targetHandle.replace('in-', '');

      const sourceSocket = sourceEntry.definition.outputs.find((s) => s.id === sourceSocketId);
      const targetSocket = targetEntry.definition.inputs.find((s) => s.id === targetSocketId);

      if (!sourceSocket || !targetSocket) return;
      if (!isSocketCompatible(sourceSocket.type, targetSocket.type)) {
        toast.error(`Cannot connect ${sourceSocket.type} to ${targetSocket.type}`);
        return;
      }

      const edgeData: WorkflowEdgeData = {
        sourceSocketType: sourceSocket.type,
        targetSocketType: targetSocket.type,
      };

      setEdges((eds) =>
        addEdge(
          { ...connection, data: edgeData },
          eds,
        ),
      );
    },
    [nodes, setEdges],
  );

  // ---------------------------------------------------------------------------
  // Node operations
  // ---------------------------------------------------------------------------

  const addWorkflowNode = React.useCallback(
    (type: string, position: { x: number; y: number }) => {
      const entry = getNodeEntry(type);
      if (!entry) return;

      const id = `wf-${type}-${Date.now()}`;
      const newNode: Node<WorkflowNodeData> = {
        id,
        type: entry.definition.type,
        position,
        data: {
          definitionType: entry.definition.type,
          config: { ...entry.definition.defaultConfig },
          status: 'idle',
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  const updateNodeConfig = React.useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config } } : n,
        ),
      );
    },
    [setNodes],
  );

  // ---------------------------------------------------------------------------
  // Group management
  // ---------------------------------------------------------------------------

  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);

  const selectGroup = React.useCallback((groupId: string | null) => {
    setSelectedGroupId(groupId);
  }, []);

  const toggleGroupLock = React.useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, locked: !g.locked } : g,
      ),
    );
  }, []);

  const toggleGroupCollapse = React.useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g,
      ),
    );
  }, []);

  /** Calculate bounds that encompass the given workflow nodes */
  const calculateWorkflowBounds = React.useCallback(
    (nodeIds: string[]) => {
      const targetNodes = nodes.filter((n) => nodeIds.includes(n.id));
      if (targetNodes.length === 0) return { x: 0, y: 0, width: 300, height: 200 };

      const minX = Math.min(...targetNodes.map((n) => n.position.x)) - GROUP_PADDING;
      const minY = Math.min(...targetNodes.map((n) => n.position.y)) - GROUP_PADDING - GROUP_TITLE_HEIGHT;
      const maxX = Math.max(...targetNodes.map((n) => n.position.x + (n.measured?.width ?? 260))) + GROUP_PADDING;
      const maxY = Math.max(...targetNodes.map((n) => n.position.y + (n.measured?.height ?? 140))) + GROUP_PADDING;

      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    },
    [nodes],
  );

  /** Create a group from the currently selected nodes (Ctrl+G) */
  const createGroup = React.useCallback(() => {
    const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
    if (selectedIds.length < 2) {
      toast.error('Select at least 2 nodes to group');
      return;
    }

    const bounds = calculateWorkflowBounds(selectedIds);
    const newGroup: GroupData & { locked?: boolean } = {
      id: `wfg-${Date.now()}`,
      title: 'Group',
      color: getRandomGroupColor(),
      bounds,
      isCollapsed: false,
      createdAt: Date.now(),
      nodeIds: selectedIds,
    };

    setGroups((prev) => [...prev, newGroup]);
    setSelectedGroupId(newGroup.id);
  }, [nodes, calculateWorkflowBounds]);

  /** Delete a group (does not delete contained nodes) */
  const deleteGroup = React.useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (selectedGroupId === groupId) setSelectedGroupId(null);
  }, [selectedGroupId]);

  /** Update group properties */
  const updateGroup = React.useCallback((groupId: string, updates: Partial<GroupData>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
    );
  }, []);

  /** Move group bounds + all contained nodes by a delta */
  const moveGroup = React.useCallback(
    (groupId: string, delta: { x: number; y: number }) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            bounds: {
              ...g.bounds,
              x: g.bounds.x + delta.x,
              y: g.bounds.y + delta.y,
            },
          };
        }),
      );
      // Also move contained nodes
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;
      setNodes((nds) =>
        nds.map((n) => {
          if (!group.nodeIds.includes(n.id)) return n;
          return {
            ...n,
            position: {
              x: n.position.x + delta.x,
              y: n.position.y + delta.y,
            },
          };
        }),
      );
    },
    [groups, setNodes],
  );

  /** Resize group bounds (nodes are not affected) */
  const resizeGroup = React.useCallback(
    (groupId: string, bounds: { x: number; y: number; width: number; height: number }) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, bounds } : g)),
      );
    },
    [],
  );

  /** Duplicate a group and all its contained nodes + internal edges */
  const duplicateGroup = React.useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const offset = { x: 60, y: 60 };
      const idMap = new Map<string, string>();

      // Clone nodes with new IDs
      const clonedNodes: Node<WorkflowNodeData>[] = [];
      for (const nodeId of group.nodeIds) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;
        const newId = `wf-${node.data.definitionType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        idMap.set(nodeId, newId);
        clonedNodes.push({
          ...node,
          id: newId,
          position: {
            x: node.position.x + offset.x,
            y: node.position.y + offset.y,
          },
          selected: false,
          data: { ...node.data, status: 'idle', error: undefined, outputValues: undefined },
        });
      }

      // Clone internal edges (both source and target in the group)
      const clonedEdges: Edge<WorkflowEdgeData>[] = [];
      for (const edge of edges) {
        const newSource = idMap.get(edge.source);
        const newTarget = idMap.get(edge.target);
        if (newSource && newTarget) {
          clonedEdges.push({
            ...edge,
            id: `wfe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            source: newSource,
            target: newTarget,
          });
        }
      }

      // Create new group
      const newGroup: GroupData & { locked?: boolean } = {
        id: `wfg-${Date.now()}`,
        title: `${group.title} (copy)`,
        color: group.color,
        bounds: {
          x: group.bounds.x + offset.x,
          y: group.bounds.y + offset.y,
          width: group.bounds.width,
          height: group.bounds.height,
        },
        isCollapsed: false,
        createdAt: Date.now(),
        nodeIds: Array.from(idMap.values()),
      };

      setNodes((nds) => [...nds, ...clonedNodes]);
      setEdges((eds) => [...eds, ...clonedEdges]);
      setGroups((prev) => [...prev, newGroup]);
      setSelectedGroupId(newGroup.id);
      toast.success('Group duplicated');
    },
    [groups, nodes, edges, setNodes, setEdges],
  );

  // ---------------------------------------------------------------------------
  // Workflow execution
  // ---------------------------------------------------------------------------

  const runWorkflow = React.useCallback(async () => {
    if (isExecuting) return;
    if (nodes.length === 0) {
      toast.error('Add some nodes before running');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsExecuting(true);

    // Reset all node statuses
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: 'queued' as const, error: undefined, outputValues: undefined },
      })),
    );

    const nonLockedNodes = nodes.filter((n) => {
      return !groups.some((g) => g.locked && g.nodeIds.includes(n.id));
    });
    setExecutionProgress({ completed: 0, total: nonLockedNodes.length });

    const context: ExecutionContext = {
      apiId,
      signal: controller.signal,
      onStatusUpdate: (nodeId, status, message) => {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id !== nodeId) return n;
            return {
              ...n,
              data: {
                ...n.data,
                status,
                error: status === 'error' ? message : undefined,
              },
            };
          }),
        );

        if (status === 'success' || status === 'error' || status === 'skipped') {
          setExecutionProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
          }));
        }
      },
    };

    try {
      const result = await executeWorkflow(nodes, edges, groups, context);

      // Store output values in nodes for display
      setNodes((nds) =>
        nds.map((n) => {
          const outputs = result.dataMap.get(n.id);
          if (!outputs) return n;
          return { ...n, data: { ...n.data, outputValues: outputs } };
        }),
      );

      if (result.errorCount > 0) {
        toast.error(`Workflow completed with ${result.errorCount} error(s)`);
      } else {
        toast.success(
          `Workflow complete: ${result.completedCount} nodes executed` +
            (result.skippedCount > 0 ? `, ${result.skippedCount} skipped` : ''),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Workflow failed';
      toast.error(message);
    } finally {
      setIsExecuting(false);
      abortControllerRef.current = null;
    }
  }, [isExecuting, nodes, edges, groups, apiId, setNodes]);

  const stopWorkflow = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setIsExecuting(false);
    toast.info('Workflow stopped');
  }, []);

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  const buildDefinition = React.useCallback((): WorkflowDefinition => {
    return {
      version: 1,
      name: workflowName,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type!,
        position: n.position,
        data: {
          ...n.data,
          status: 'idle',
          error: undefined,
          outputValues: undefined,
        },
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle!,
        targetHandle: e.targetHandle!,
        data: e.data,
      })),
      groups,
      viewport,
    };
  }, [nodes, edges, groups, viewport, workflowName]);

  const loadDefinition = React.useCallback(
    (def: WorkflowDefinition) => {
      setWorkflowName(def.name || 'Untitled Workflow');
      setNodes(
        def.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: { ...n.data, status: 'idle' as const, error: undefined, outputValues: undefined },
        })),
      );
      setEdges(
        def.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          data: e.data,
        })),
      );
      setGroups(def.groups || []);
      if (def.viewport) setViewport(def.viewport);
    },
    [setNodes, setEdges],
  );

  // ---------------------------------------------------------------------------
  // Persistence (Supabase)
  // ---------------------------------------------------------------------------

  const loadSavedWorkflows = React.useCallback(async () => {
    try {
      const { getUserWorkflows } = await import('@/utils/supabase/workflows.server');
      const workflows = await getUserWorkflows();
      setSavedWorkflows(workflows);
    } catch {
      // Server actions may not be available yet
    }
  }, []);

  const saveWorkflow = React.useCallback(async () => {
    const definition = buildDefinition();
    try {
      if (currentWorkflowId) {
        const { updateWorkflow } = await import('@/utils/supabase/workflows.server');
        await updateWorkflow(currentWorkflowId, { name: workflowName, definition });
        toast.success('Workflow saved');
      } else {
        const { createWorkflow } = await import('@/utils/supabase/workflows.server');
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Sign in to save workflows');
          return;
        }
        const workflow = await createWorkflow({
          user_id: user.id,
          name: workflowName,
          definition,
        });
        setCurrentWorkflowId(workflow.id);
        toast.success('Workflow saved');
      }
      await loadSavedWorkflows();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Workflow save error:', message);
      toast.error(`Failed to save: ${message}`);
    }
  }, [buildDefinition, currentWorkflowId, workflowName, loadSavedWorkflows]);

  const loadWorkflow = React.useCallback(
    async (id: string) => {
      try {
        const { getWorkflow } = await import('@/utils/supabase/workflows.server');
        const workflow = await getWorkflow(id);
        if (!workflow) {
          toast.error('Workflow not found');
          return;
        }
        setCurrentWorkflowId(workflow.id);
        loadDefinition(workflow.definition);
        toast.success(`Loaded: ${workflow.name}`);
      } catch {
        toast.error('Failed to load workflow');
      }
    },
    [loadDefinition],
  );

  const deleteWorkflow = React.useCallback(
    async (id: string) => {
      try {
        const mod = await import('@/utils/supabase/workflows.server');
        await mod.deleteWorkflow(id);
        if (currentWorkflowId === id) {
          setCurrentWorkflowId(null);
        }
        await loadSavedWorkflows();
        toast.success('Workflow deleted');
      } catch {
        toast.error('Failed to delete workflow');
      }
    },
    [currentWorkflowId, loadSavedWorkflows],
  );

  // ---------------------------------------------------------------------------
  // Workflow management (multi-workflow support)
  // ---------------------------------------------------------------------------

  const createNewWorkflow = React.useCallback(async () => {
    // Auto-save current if it has content
    if (nodes.length > 0 && currentWorkflowId) {
      try {
        const definition = buildDefinition();
        const { updateWorkflow } = await import('@/utils/supabase/workflows.server');
        await updateWorkflow(currentWorkflowId, { name: workflowName, definition });
      } catch {
        // Best effort save
      }
    }
    setCurrentWorkflowId(null);
    setWorkflowName('Untitled Workflow');
    setNodes([]);
    setEdges([]);
    setGroups([]);
    toast.success('New workflow created');
  }, [nodes.length, currentWorkflowId, buildDefinition, workflowName, setNodes, setEdges]);

  const switchWorkflow = React.useCallback(
    async (id: string) => {
      if (id === currentWorkflowId) return;
      // Auto-save current before switching
      if (nodes.length > 0 && currentWorkflowId) {
        try {
          const definition = buildDefinition();
          const { updateWorkflow } = await import('@/utils/supabase/workflows.server');
          await updateWorkflow(currentWorkflowId, { name: workflowName, definition });
        } catch {
          // Best effort save
        }
      }
      await loadWorkflow(id);
    },
    [currentWorkflowId, nodes.length, buildDefinition, workflowName, loadWorkflow],
  );

  const renameWorkflow = React.useCallback(
    async (id: string, name: string) => {
      try {
        const { updateWorkflow } = await import('@/utils/supabase/workflows.server');
        await updateWorkflow(id, { name });
        if (id === currentWorkflowId) {
          setWorkflowName(name);
        }
        await loadSavedWorkflows();
      } catch {
        toast.error('Failed to rename workflow');
      }
    },
    [currentWorkflowId, loadSavedWorkflows],
  );

  // ---------------------------------------------------------------------------
  // JSON Export/Import
  // ---------------------------------------------------------------------------

  const exportWorkflowJSON = React.useCallback(() => {
    const definition = buildDefinition();
    const json = JSON.stringify(definition, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Workflow exported');
  }, [buildDefinition, workflowName]);

  const importWorkflowJSON = React.useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const def = JSON.parse(text) as WorkflowDefinition;
        if (def.version !== 1) {
          toast.error('Unsupported workflow version');
          return;
        }
        if (!def.nodes || !def.edges) {
          toast.error('Invalid workflow file');
          return;
        }
        setCurrentWorkflowId(null);
        loadDefinition(def);
        toast.success(`Imported: ${def.name || 'Workflow'}`);
      } catch {
        toast.error('Failed to parse workflow file');
      }
    },
    [loadDefinition],
  );

  // Load saved workflows on mount
  React.useEffect(() => {
    loadSavedWorkflows();
  }, [loadSavedWorkflows]);

  // ---------------------------------------------------------------------------
  // Persist workflow state to localStorage (debounced)
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    if (!hasLoadedPersistedState.current) return;

    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = setTimeout(() => {
      const state: PersistedWorkflowState = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type!,
          position: n.position,
          data: { ...n.data, status: 'idle' as const, error: undefined, outputValues: undefined },
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle!,
          targetHandle: e.targetHandle!,
          data: e.data,
        })),
        groups,
        viewport,
        workflowName,
        currentWorkflowId,
        timestamp: Date.now(),
      };
      savePersistedWorkflow(state);
    }, 1000);

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [nodes, edges, groups, viewport, workflowName, currentWorkflowId]);

  // Save immediately before page unload
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      const state: PersistedWorkflowState = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type!,
          position: n.position,
          data: { ...n.data, status: 'idle' as const, error: undefined, outputValues: undefined },
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle!,
          targetHandle: e.targetHandle!,
          data: e.data,
        })),
        groups,
        viewport,
        workflowName,
        currentWorkflowId,
        timestamp: Date.now(),
      };
      savePersistedWorkflow(state);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [nodes, edges, groups, viewport, workflowName, currentWorkflowId]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Enter to run
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isExecuting) runWorkflow();
      }
      // Escape to stop execution or deselect group
      if (e.key === 'Escape') {
        if (isExecuting) {
          e.preventDefault();
          stopWorkflow();
        } else if (selectedGroupId) {
          e.preventDefault();
          setSelectedGroupId(null);
        }
      }
      // Ctrl+S to save workflow
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveWorkflow();
      }
      // Ctrl+G to group selected nodes
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        createGroup();
      }
      // Delete/Backspace to delete selected group
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGroupId) {
        // Only delete group if not focused on an input element
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        deleteGroup(selectedGroupId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isExecuting, runWorkflow, stopWorkflow, saveWorkflow, selectedGroupId, createGroup, deleteGroup]);

  // ---------------------------------------------------------------------------
  // Recompose single node (re-execute one node using existing upstream outputs)
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    const handler = async (e: Event) => {
      const { nodeId } = (e as CustomEvent<{ nodeId: string }>).detail;
      if (!nodeId || isExecuting) return;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const entry = getNodeEntry(node.data.definitionType);
      if (!entry) return;

      // Resolve inputs from upstream nodes' existing outputValues
      const nodeInputs: Record<string, unknown> = {};
      for (const edge of edges) {
        if (edge.target !== nodeId) continue;
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const sourceOutputs = sourceNode?.data?.outputValues as Record<string, unknown> | undefined;
        if (sourceOutputs) {
          const sourceSocketId = edge.sourceHandle?.replace('out-', '');
          const targetSocketId = edge.targetHandle?.replace('in-', '');
          if (sourceSocketId && targetSocketId) {
            nodeInputs[targetSocketId] = sourceOutputs[sourceSocketId];
          }
        }
      }

      // Mark as running
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, status: 'running' as const, error: undefined } }
            : n,
        ),
      );

      try {
        const ctx: ExecutionContext = {
          apiId,
          signal: new AbortController().signal,
          onStatusUpdate: () => {},
        };
        const outputs = await entry.executor(nodeInputs, node.data.config, ctx);
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, status: 'success' as const, outputValues: outputs } }
              : n,
          ),
        );
        toast.success('Recomposed');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Recompose failed';
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, status: 'error' as const, error: message } }
              : n,
          ),
        );
        toast.error(message);
      }
    };

    window.addEventListener('workflow-recompose-node', handler);
    return () => window.removeEventListener('workflow-recompose-node', handler);
  }, [nodes, edges, apiId, isExecuting, setNodes]);

  return {
    // React Flow state
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,

    // Node operations
    addWorkflowNode,
    updateNodeConfig,

    // Groups
    groups,
    selectedGroupId,
    selectGroup,
    createGroup,
    deleteGroup,
    updateGroup,
    moveGroup,
    resizeGroup,
    toggleGroupCollapse,
    toggleGroupLock,
    duplicateGroup,

    // Execution
    isExecuting,
    executionProgress,
    runWorkflow,
    stopWorkflow,

    // Metadata
    workflowName,
    setWorkflowName,
    currentWorkflowId,

    // Persistence
    savedWorkflows,
    saveWorkflow,
    loadWorkflow,
    deleteWorkflow,
    loadSavedWorkflows,
    createNewWorkflow,
    switchWorkflow,
    renameWorkflow,

    // Export/Import
    exportWorkflowJSON,
    importWorkflowJSON,
  };
}
