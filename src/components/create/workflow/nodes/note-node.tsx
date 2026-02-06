'use client';

import * as React from 'react';
import { StickyNote } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';

export const noteDefinition: WorkflowNodeDefinition = {
  type: 'noteNode',
  label: 'Note',
  category: 'utility',
  description: 'Sticky note for annotating your workflow',
  icon: 'StickyNote',
  inputs: [],
  outputs: [],
  defaultConfig: { text: '' },
  minWidth: 200,
};

/** No-op executor — notes don't produce outputs */
export const noteExecutor: NodeExecutor = async () => ({});

function dispatchConfig(nodeId: string, config: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent('workflow-node-config', {
      detail: { nodeId, config },
    }),
  );
}

interface NoteNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function NoteNode({ data, id, selected }: NoteNodeProps) {
  const config = data.config;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatchConfig(id, { ...config, text: e.target.value });
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={noteDefinition.label}
      icon={<StickyNote className="size-4" />}
      inputs={noteDefinition.inputs}
      outputs={noteDefinition.outputs}
      minWidth={noteDefinition.minWidth}
      resizable
      minHeight={100}
    >
      <div className="flex flex-col flex-1 min-h-0">
        <textarea
          value={(config.text as string) || ''}
          onChange={handleChange}
          placeholder="Add a note&#8230;"
          className="nodrag nowheel w-full flex-1 min-h-[2.5rem] resize-none rounded-md bg-amber-50/50 dark:bg-amber-950/20 border-0 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Note text"
        />
      </div>
    </BaseWorkflowNode>
  );
}
