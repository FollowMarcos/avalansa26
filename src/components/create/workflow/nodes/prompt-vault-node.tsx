'use client';

import * as React from 'react';
import { BookMarked, ChevronDown } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import type { Prompt } from '@/types/prompt';
import { cn } from '@/lib/utils';

export const promptVaultDefinition: WorkflowNodeDefinition = {
  type: 'promptVault',
  label: 'Prompt from Vault',
  category: 'input',
  description: 'Load a saved prompt from your Prompt Vault',
  icon: 'BookMarked',
  inputs: [],
  outputs: [
    { id: 'prompt', label: 'Prompt', type: 'text' },
    { id: 'negative', label: 'Negative', type: 'text' },
  ],
  defaultConfig: { promptId: '', promptText: '', negativePrompt: '', promptName: '' },
  minWidth: 240,
};

export const promptVaultExecutor: NodeExecutor = async (_inputs, config) => ({
  prompt: (config.promptText as string) || '',
  negative: (config.negativePrompt as string) || '',
});

function dispatchConfig(nodeId: string, config: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent('workflow-node-config', {
      detail: { nodeId, config },
    }),
  );
}

interface PromptVaultNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function PromptVaultNode({ data, id, selected }: PromptVaultNodeProps) {
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const config = data.config;
  const selectedName = (config.promptName as string) || '';
  const promptText = (config.promptText as string) || '';

  const loadPrompts = React.useCallback(async () => {
    if (prompts.length > 0) return;
    setIsLoading(true);
    try {
      const { getPrompts } = await import('@/utils/supabase/prompts.server');
      const result = await getPrompts();
      setPrompts(result);
    } catch {
      // Server actions may not be available
    } finally {
      setIsLoading(false);
    }
  }, [prompts.length]);

  const handleSelect = (prompt: Prompt) => {
    dispatchConfig(id, {
      ...config,
      promptId: prompt.id,
      promptName: prompt.name,
      promptText: prompt.prompt_text,
      negativePrompt: prompt.negative_prompt || '',
    });
    setIsOpen(false);
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={promptVaultDefinition.label}
      icon={<BookMarked className="size-4" />}
      inputs={promptVaultDefinition.inputs}
      outputs={promptVaultDefinition.outputs}
      minWidth={promptVaultDefinition.minWidth}
    >
      <div className="nodrag nowheel space-y-2">
        {/* Prompt selector */}
        <button
          type="button"
          onClick={() => {
            loadPrompts();
            setIsOpen(!isOpen);
          }}
          className={cn(
            'flex items-center justify-between w-full px-2.5 py-1.5 rounded-md border border-border',
            'bg-muted/30 text-xs hover:bg-muted/50 transition-[background-color]',
          )}
        >
          <span className={cn('truncate', !selectedName && 'text-muted-foreground')}>
            {selectedName || 'Select a prompt\u2026'}
          </span>
          <ChevronDown aria-hidden="true" className="size-3 text-muted-foreground flex-shrink-0 ml-1" />
        </button>

        {/* Dropdown list */}
        {isOpen && (
          <div className="rounded-md border border-border overflow-hidden max-h-40 overflow-y-auto bg-background">
            {isLoading ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">Loading\u2026</p>
            ) : prompts.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">No saved prompts</p>
            ) : (
              prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => handleSelect(prompt)}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 text-xs hover:bg-muted/50 transition-[background-color] border-b border-border last:border-b-0',
                    prompt.id === config.promptId && 'bg-accent',
                  )}
                >
                  <span className="font-medium truncate block">{prompt.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {prompt.prompt_text.slice(0, 60)}
                    {prompt.prompt_text.length > 60 ? '\u2026' : ''}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Preview of selected prompt */}
        {promptText && !isOpen && (
          <p className="text-[10px] text-muted-foreground line-clamp-3 bg-muted/30 rounded-md px-2 py-1.5 font-mono">
            {promptText}
          </p>
        )}
      </div>
    </BaseWorkflowNode>
  );
}
