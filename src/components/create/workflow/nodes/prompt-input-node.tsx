'use client';

import * as React from 'react';
import { Type } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';

export const promptInputDefinition: WorkflowNodeDefinition = {
  type: 'promptInput',
  label: 'Prompt Input',
  category: 'input',
  description: 'Text input for prompts and negative prompts',
  icon: 'Type',
  inputs: [],
  outputs: [
    { id: 'prompt', label: 'Prompt', type: 'text' },
    { id: 'negative', label: 'Negative', type: 'text' },
  ],
  defaultConfig: { prompt: '', negativePrompt: '' },
  minWidth: 260,
};

export const promptInputExecutor: NodeExecutor = async (_inputs, config) => ({
  prompt: (config.prompt as string) || '',
  negative: (config.negativePrompt as string) || '',
});

interface PromptInputNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function PromptInputNode({ data, id, selected }: PromptInputNodeProps) {
  const [showNegative, setShowNegative] = React.useState(
    Boolean(data.config.negativePrompt),
  );

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Config updates are handled by the parent via onNodesChange
    // We dispatch a custom event that use-workflow.ts listens to
    window.dispatchEvent(
      new CustomEvent('workflow-node-config', {
        detail: { nodeId: id, config: { ...data.config, prompt: e.target.value } },
      }),
    );
  };

  const handleNegativeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    window.dispatchEvent(
      new CustomEvent('workflow-node-config', {
        detail: {
          nodeId: id,
          config: { ...data.config, negativePrompt: e.target.value },
        },
      }),
    );
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={promptInputDefinition.label}
      icon={<Type className="size-4" />}
      inputs={promptInputDefinition.inputs}
      outputs={promptInputDefinition.outputs}
      minWidth={promptInputDefinition.minWidth}
    >
      <div className="space-y-2">
        <textarea
          value={(data.config.prompt as string) || ''}
          onChange={handlePromptChange}
          placeholder="Enter your prompt..."
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Prompt text"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {((data.config.prompt as string) || '').length} chars
          </span>
          <button
            type="button"
            onClick={() => setShowNegative(!showNegative)}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNegative ? 'Hide' : 'Show'} negative
          </button>
        </div>
        {showNegative && (
          <textarea
            value={(data.config.negativePrompt as string) || ''}
            onChange={handleNegativeChange}
            placeholder="Negative prompt..."
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Negative prompt text"
          />
        )}
      </div>
    </BaseWorkflowNode>
  );
}
