'use client';

import * as React from 'react';
import { Bot, ChevronDown, Loader2 } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import type { Ava } from '@/types/ava';
import type { RunAvaResponse } from '@/types/ava';
import { cn } from '@/lib/utils';

export const avaDefinition: WorkflowNodeDefinition = {
  type: 'avaNode',
  label: 'Ava',
  category: 'input',
  description: 'Run an Ava AI prompt generator',
  icon: 'Bot',
  inputs: [
    { id: 'seed', label: 'Seed Text', type: 'text' },
  ],
  outputs: [
    { id: 'prompt', label: 'Prompt', type: 'text' },
    { id: 'negative', label: 'Negative', type: 'text' },
  ],
  defaultConfig: { avaId: '', avaName: '', seedText: '' },
  minWidth: 240,
};

export const avaExecutor: NodeExecutor = async (inputs, config, context) => {
  const avaId = config.avaId as string;
  if (!avaId) throw new Error('No Ava selected');

  const seedText = (inputs.seed as string) || (config.seedText as string) || '';

  const response = await fetch('/api/ava/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      avaId,
      apiId: context.apiId,
      inputText: seedText,
    }),
    signal: context.signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Ava run failed' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as RunAvaResponse;
  if (!data.success) throw new Error(data.error || 'Ava generation failed');

  return {
    prompt: data.prompt || '',
    negative: data.negativePrompt || '',
  };
};

function dispatchConfig(nodeId: string, config: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent('workflow-node-config', {
      detail: { nodeId, config },
    }),
  );
}

interface AvaNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function AvaNode({ data, id, selected }: AvaNodeProps) {
  const [avas, setAvas] = React.useState<Ava[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const config = data.config;
  const selectedName = (config.avaName as string) || '';
  const status = data.status ?? 'idle';
  const outputPrompt = data.outputValues?.prompt as string | undefined;

  const loadAvas = React.useCallback(async () => {
    if (avas.length > 0) return;
    setIsLoading(true);
    try {
      const { getAvas } = await import('@/utils/supabase/avas.server');
      const result = await getAvas();
      setAvas(result);
    } catch {
      // Server actions may not be available
    } finally {
      setIsLoading(false);
    }
  }, [avas.length]);

  const handleSelect = (ava: Ava) => {
    dispatchConfig(id, { ...config, avaId: ava.id, avaName: ava.name });
    setIsOpen(false);
  };

  const handleSeedChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatchConfig(id, { ...config, seedText: e.target.value });
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={avaDefinition.label}
      icon={<Bot className="size-4" />}
      inputs={avaDefinition.inputs}
      outputs={avaDefinition.outputs}
      minWidth={avaDefinition.minWidth}
    >
      <div className="nodrag nowheel space-y-2">
        {/* Ava selector */}
        <button
          type="button"
          onClick={() => {
            loadAvas();
            setIsOpen(!isOpen);
          }}
          className={cn(
            'flex items-center justify-between w-full px-2.5 py-1.5 rounded-md border border-border',
            'bg-muted/30 text-xs hover:bg-muted/50 transition-[background-color]',
          )}
        >
          <span className={cn('truncate', !selectedName && 'text-muted-foreground')}>
            {selectedName || 'Select an Ava\u2026'}
          </span>
          <ChevronDown aria-hidden="true" className="size-3 text-muted-foreground flex-shrink-0 ml-1" />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="rounded-md border border-border overflow-hidden max-h-36 overflow-y-auto bg-background">
            {isLoading ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">Loading\u2026</p>
            ) : avas.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">No Avas created</p>
            ) : (
              avas.map((ava) => (
                <button
                  key={ava.id}
                  type="button"
                  onClick={() => handleSelect(ava)}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 text-xs hover:bg-muted/50 transition-[background-color] border-b border-border last:border-b-0',
                    ava.id === config.avaId && 'bg-accent',
                  )}
                >
                  <span className="font-medium truncate block">{ava.name}</span>
                  {ava.description && (
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {ava.description}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {/* Seed text input (used when no upstream connection) */}
        {!isOpen && (
          <textarea
            value={(config.seedText as string) || ''}
            onChange={handleSeedChange}
            placeholder="Seed text (optional)&#8230;"
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Seed text for Ava"
          />
        )}

        {/* Running state */}
        {status === 'running' && (
          <div className="flex items-center gap-2 py-1">
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Generating prompt\u2026</span>
          </div>
        )}

        {/* Output preview */}
        {status === 'success' && outputPrompt && (
          <p className="text-[10px] text-muted-foreground line-clamp-3 bg-muted/30 rounded-md px-2 py-1.5 font-mono">
            {outputPrompt}
          </p>
        )}
      </div>
    </BaseWorkflowNode>
  );
}
