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

// Ensure nodes are registered
import './nodes';

interface UseWorkflowOptions {
  apiId: string;
}

export function useWorkflow({ apiId }: UseWorkflowOptions) {
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>([]);
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
  // Group locking
  // ---------------------------------------------------------------------------

  const toggleGroupLock = React.useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, locked: !g.locked } : g,
      ),
    );
  }, []);

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
  // Drag-and-drop from palette
  // ---------------------------------------------------------------------------

  const onDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer.getData('application/workflow-node');
      if (!data) return;

      try {
        const { type } = JSON.parse(data) as { type: string };

        // Get drop position relative to the canvas
        const reactFlowBounds = (event.target as HTMLElement)
          .closest('.react-flow')
          ?.getBoundingClientRect();
        if (!reactFlowBounds) return;

        const position = {
          x: event.clientX - reactFlowBounds.left - 100,
          y: event.clientY - reactFlowBounds.top - 30,
        };

        addWorkflowNode(type, position);
      } catch {
        // Invalid drag data
      }
    },
    [addWorkflowNode],
  );

  const onDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
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
          toast.error('Not authenticated');
          return;
        }
        const workflow = await createWorkflow({
          user_id: user.id,
          name: workflowName,
          definition,
        });
        if (workflow) {
          setCurrentWorkflowId(workflow.id);
          toast.success('Workflow saved');
        }
      }
      await loadSavedWorkflows();
    } catch {
      toast.error('Failed to save workflow');
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
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Enter to run
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isExecuting) runWorkflow();
      }
      // Escape to stop
      if (e.key === 'Escape' && isExecuting) {
        e.preventDefault();
        stopWorkflow();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isExecuting, runWorkflow, stopWorkflow]);

  return {
    // React Flow state
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,

    // Drag-and-drop
    onDrop,
    onDragOver,

    // Node operations
    addWorkflowNode,
    updateNodeConfig,

    // Groups
    groups,
    toggleGroupLock,

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

    // Export/Import
    exportWorkflowJSON,
    importWorkflowJSON,
  };
}
