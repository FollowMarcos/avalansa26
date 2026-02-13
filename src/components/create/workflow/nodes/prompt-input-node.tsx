'use client';

import * as React from 'react';
import { Type } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import { useNodeConfig } from '../hooks/use-node-config';
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
  const [config, update] = useNodeConfig(id, data.config);
  const [showNegative, setShowNegative] = React.useState(
    Boolean(config.negativePrompt),
  );

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
      resizable
      minHeight={160}
    >
      <div className="flex flex-col flex-1 min-h-0 gap-2">
        <textarea
          value={(config.prompt as string) || ''}
          onChange={(e) => update('prompt', e.target.value)}
          placeholder="Enter your prompt..."
          className="nodrag nowheel w-full flex-1 min-h-[3.5rem] resize-none rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Prompt text"
        />
        <div className="flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-muted-foreground">
            {((config.prompt as string) || '').length} chars
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
            value={(config.negativePrompt as string) || ''}
            onChange={(e) => update('negativePrompt', e.target.value)}
            placeholder="Negative prompt..."
            className="nodrag nowheel w-full flex-1 min-h-[2.5rem] resize-none rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Negative prompt text"
          />
        )}
      </div>
    </BaseWorkflowNode>
  );
}
