'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import { Loader } from '@/components/ui/loader';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';

export const imageGenerateDefinition: WorkflowNodeDefinition = {
  type: 'imageGenerate',
  label: 'Generate Image',
  category: 'processing',
  description: 'Generate an image using the connected prompt and settings',
  icon: 'Sparkles',
  inputs: [
    { id: 'prompt', label: 'Prompt', type: 'text', required: true },
    { id: 'negative', label: 'Negative', type: 'text' },
    { id: 'settings', label: 'Settings', type: 'settings' },
    { id: 'reference', label: 'Reference', type: 'image' },
  ],
  outputs: [
    { id: 'image', label: 'Image', type: 'image' },
  ],
  defaultConfig: { apiId: null },
  minWidth: 240,
};

export const imageGenerateExecutor: NodeExecutor = async (inputs, config, context) => {
  const prompt = inputs.prompt as string;
  if (!prompt) throw new Error('Prompt is required');

  const negative = (inputs.negative as string) || '';
  const settings = (inputs.settings as Record<string, unknown>) || {};
  const referenceImagePaths = inputs.reference
    ? [inputs.reference as string]
    : [];
  const apiId = (config.apiId as string) || context.apiId;

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiId,
      prompt,
      negativePrompt: negative,
      aspectRatio: settings.aspectRatio || '1:1',
      imageSize: settings.imageSize || '2K',
      outputCount: 1,
      referenceImagePaths,
      mode: settings.generationSpeed || 'fast',
    }),
    signal: context.signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Generation failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.images?.[0]) {
    throw new Error(data.error || 'No image generated');
  }

  return { image: data.images[0].url };
};

interface ImageGenerateNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function ImageGenerateNode({ data, id, selected }: ImageGenerateNodeProps) {
  const status = data.status ?? 'idle';
  const outputImage = data.outputValues?.image as string | undefined;

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={imageGenerateDefinition.label}
      icon={<Sparkles className="size-4" />}
      inputs={imageGenerateDefinition.inputs}
      outputs={imageGenerateDefinition.outputs}
      minWidth={imageGenerateDefinition.minWidth}
    >
      <div className="space-y-2">
        {/* Running indicator */}
        {status === 'running' && (
          <div className="flex items-center gap-2 py-2">
            <Loader size="sm" />
            <span className="text-xs text-muted-foreground">Generating...</span>
          </div>
        )}

        {/* Thumbnail preview of generated image */}
        {status === 'success' && outputImage && (
          <div className="relative rounded-md overflow-hidden border border-border">
            <img
              src={outputImage}
              alt="Generated"
              className="w-full h-32 object-cover"
              draggable={false}
            />
          </div>
        )}

        {/* Idle state hint */}
        {status === 'idle' && (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Connect a prompt and run the workflow
          </p>
        )}
      </div>
    </BaseWorkflowNode>
  );
}
