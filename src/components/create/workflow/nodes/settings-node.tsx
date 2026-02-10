'use client';

import * as React from 'react';
import { Settings } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import { useNodeConfig } from '../hooks/use-node-config';
import { useCreate } from '../../create-context';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';

const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '5:4', '4:5', '21:9'];
const IMAGE_SIZES = ['1K', '2K', '4K'];

export const settingsDefinition: WorkflowNodeDefinition = {
  type: 'settingsNode',
  label: 'Settings',
  category: 'input',
  description: 'Configure generation settings like aspect ratio and quality',
  icon: 'Settings',
  inputs: [],
  outputs: [
    { id: 'settings', label: 'Settings', type: 'settings' },
  ],
  defaultConfig: {
    aspectRatio: '1:1',
    imageSize: '2K',
    outputCount: 1,
    generationSpeed: 'fast',
    apiId: null,
  },
  minWidth: 220,
};

export const settingsExecutor: NodeExecutor = async (_inputs, config) => ({
  settings: {
    aspectRatio: config.aspectRatio ?? '1:1',
    imageSize: config.imageSize ?? '2K',
    outputCount: config.outputCount ?? 1,
    generationSpeed: config.generationSpeed ?? 'fast',
    apiId: config.apiId ?? null,
  },
});

interface SettingsNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function SettingsNode({ data, id, selected }: SettingsNodeProps) {
  const [config, update] = useNodeConfig(id, data.config);
  const { availableApis } = useCreate();

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={settingsDefinition.label}
      icon={<Settings className="size-4" />}
      inputs={settingsDefinition.inputs}
      outputs={settingsDefinition.outputs}
      minWidth={settingsDefinition.minWidth}
    >
      <div className="space-y-2">
        {/* API / Provider */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground w-16 flex-shrink-0">
            API
          </label>
          <select
            value={(config.apiId as string) || ''}
            onChange={(e) =>
              update('apiId', e.target.value || null)
            }
            className="flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring truncate"
            aria-label="API provider"
          >
            <option value="">Default</option>
            {availableApis.map((api) => (
              <option key={api.id} value={api.id}>
                {api.name}{api.model_id ? ` (${api.model_id})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Aspect Ratio */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground w-16 flex-shrink-0">
            Ratio
          </label>
          <select
            value={(config.aspectRatio as string) || '1:1'}
            onChange={(e) =>
              update('aspectRatio', e.target.value)
            }
            className="flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Aspect ratio"
          >
            {ASPECT_RATIOS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Image Size */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground w-16 flex-shrink-0">
            Size
          </label>
          <select
            value={(config.imageSize as string) || '2K'}
            onChange={(e) =>
              update('imageSize', e.target.value)
            }
            className="flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Image size"
          >
            {IMAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Output Count */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground w-16 flex-shrink-0">
            Count
          </label>
          <input
            type="number"
            min={1}
            max={4}
            value={(config.outputCount as number) || 1}
            onChange={(e) =>
              update('outputCount', Math.max(1, Math.min(4, Number(e.target.value))))
            }
            className="flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Output count"
          />
        </div>

        {/* Speed Toggle */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground w-16 flex-shrink-0">
            Speed
          </label>
          <div className="flex gap-1">
            {(['fast', 'relaxed'] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => update('generationSpeed', speed)}
                className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${
                  config.generationSpeed === speed
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BaseWorkflowNode>
  );
}
