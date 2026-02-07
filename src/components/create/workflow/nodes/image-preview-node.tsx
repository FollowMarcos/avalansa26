'use client';

import * as React from 'react';
import { Eye, Download, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const imagePreviewDefinition: WorkflowNodeDefinition = {
  type: 'imagePreview',
  label: 'Image Preview',
  category: 'output',
  description: 'Display and interact with generated images (up to 4)',
  icon: 'Eye',
  inputs: [
    { id: 'image', label: 'Image 1', type: 'image', required: true },
    { id: 'image2', label: 'Image 2', type: 'image' },
    { id: 'image3', label: 'Image 3', type: 'image' },
    { id: 'image4', label: 'Image 4', type: 'image' },
  ],
  outputs: [],
  defaultConfig: {},
  minWidth: 260,
};

/** Preview is a terminal display node — no output */
export const imagePreviewExecutor: NodeExecutor = async (inputs) => {
  return {
    _displayImage: inputs.image,
    _displayImage2: inputs.image2,
    _displayImage3: inputs.image3,
    _displayImage4: inputs.image4,
  };
};

interface ImagePreviewNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

function PreviewImage({ url, index, nodeId }: { url: string; index: number; nodeId: string }) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `workflow-output-${nodeId}-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Image URL copied');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <div className="group/preview relative rounded-md overflow-hidden border border-border">
      <img
        src={url}
        alt={`Output ${index + 1}`}
        className="w-full h-auto max-h-64 object-contain bg-muted/20"
        draggable={false}
      />
      <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/40 transition-colors">
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover/preview:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDownload}
                aria-label={`Download image ${index + 1}`}
                className="size-8 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              >
                <Download className="size-4 text-zinc-900" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopyUrl}
                aria-label={`Copy URL for image ${index + 1}`}
                className="size-8 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              >
                <Link2 className="size-4 text-zinc-900" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy URL</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export function ImagePreviewNode({ data, id, selected }: ImagePreviewNodeProps) {
  const status = data.status ?? 'idle';

  const images: string[] = [];
  const keys = ['_displayImage', '_displayImage2', '_displayImage3', '_displayImage4'] as const;
  for (const key of keys) {
    const url = data.outputValues?.[key] as string | undefined;
    if (url) images.push(url);
  }

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={imagePreviewDefinition.label}
      icon={<Eye className="size-4" />}
      inputs={imagePreviewDefinition.inputs}
      outputs={imagePreviewDefinition.outputs}
      minWidth={imagePreviewDefinition.minWidth}
    >
      {status === 'success' && images.length > 0 ? (
        <div className={cn(
          'space-y-1.5',
          images.length > 1 && 'grid gap-1.5',
          images.length === 2 && 'grid-cols-2',
          images.length >= 3 && 'grid-cols-2',
        )}>
          {images.map((url, i) => (
            <PreviewImage key={`${url}-${i}`} url={url} index={i} nodeId={id} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 rounded-md border border-dashed border-border bg-muted/20">
          <p className="text-[10px] text-muted-foreground">
            {status === 'idle' ? 'Run workflow to see output' : 'Waiting for image...'}
          </p>
        </div>
      )}
    </BaseWorkflowNode>
  );
}
