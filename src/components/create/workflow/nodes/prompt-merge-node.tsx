'use client';

import * as React from 'react';
import { Merge } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';

export const promptMergeDefinition: WorkflowNodeDefinition = {
  type: 'promptMerge',
  label: 'Prompt Merge',
  category: 'utility',
  description: 'Combine multiple prompts into one using concatenation or templates',
  icon: 'Merge',
  inputs: [
    { id: 'prompt_a', label: 'Prompt A', type: 'text', required: true },
    { id: 'prompt_b', label: 'Prompt B', type: 'text' },
    { id: 'prompt_c', label: 'Prompt C', type: 'text' },
  ],
  outputs: [
    { id: 'prompt', label: 'Merged', type: 'text' },
  ],
  defaultConfig: { separator: ', ', mode: 'concatenate', template: '{A}, {B}, {C}' },
  minWidth: 240,
};

export const promptMergeExecutor: NodeExecutor = async (inputs, config) => {
  const prompts = [inputs.prompt_a, inputs.prompt_b, inputs.prompt_c].filter(
    Boolean,
  ) as string[];

  if (config.mode === 'template') {
    let template = (config.template as string) || '{A}, {B}, {C}';
    template = template
      .replace('{A}', (prompts[0] || ''))
      .replace('{B}', (prompts[1] || ''))
      .replace('{C}', (prompts[2] || ''));
    return { prompt: template.trim() };
  }

  const separator = (config.separator as string) ?? ', ';
  return { prompt: prompts.join(separator).trim() };
};

function dispatchConfig(nodeId: string, config: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent('workflow-node-config', {
      detail: { nodeId, config },
    }),
  );
}

interface PromptMergeNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function PromptMergeNode({ data, id, selected }: PromptMergeNodeProps) {
  const config = data.config;
  const mode: string = typeof config.mode === 'string' ? config.mode : 'concatenate';

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={promptMergeDefinition.label}
      icon={<Merge className="size-4" />}
      inputs={promptMergeDefinition.inputs}
      outputs={promptMergeDefinition.outputs}
      minWidth={promptMergeDefinition.minWidth}
    >
      <div className="space-y-2">
        {/* Mode Toggle */}
        <div className="flex gap-1">
          {(['concatenate', 'template'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => dispatchConfig(id, { ...config, mode: m })}
              className={`flex-1 px-2 py-0.5 text-[10px] rounded-md border transition-colors capitalize ${
                mode === m
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Mode-specific config */}
        {mode === 'concatenate' ? (
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground flex-shrink-0">
              Separator
            </label>
            <input
              type="text"
              value={typeof config.separator === 'string' ? config.separator : ', '}
              onChange={(e) =>
                dispatchConfig(id, { ...config, separator: e.target.value })
              }
              className="flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Prompt separator"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">
              Template (use {'{A}'}, {'{B}'}, {'{C}'})
            </label>
            <textarea
              value={typeof config.template === 'string' ? config.template : '{A}, {B}, {C}'}
              onChange={(e) =>
                dispatchConfig(id, { ...config, template: e.target.value })
              }
              rows={2}
              className="w-full resize-none rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Merge template"
            />
          </div>
        )}

        {/* Preview of merged output */}
        {typeof data.outputValues?.prompt === 'string' && data.outputValues.prompt.length > 0 ? (
          <div className="rounded-md bg-muted/30 px-2 py-1.5 border border-border">
            <p className="text-[10px] text-muted-foreground line-clamp-2">
              {data.outputValues.prompt}
            </p>
          </div>
        ) : null}
      </div>
    </BaseWorkflowNode>
  );
}
