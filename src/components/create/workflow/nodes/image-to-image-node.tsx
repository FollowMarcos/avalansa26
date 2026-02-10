'use client';

import * as React from 'react';
import { ImagePlus } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { useNodeConfig } from '../hooks/use-node-config';
import {
  ImageUploadSlot,
  type UploadedImage,
} from '../shared/image-upload-slot';

const MAX_IMAGES = 5;

export const imageToImageDefinition: WorkflowNodeDefinition = {
  type: 'imageToImage',
  label: 'Reference Image',
  category: 'input',
  description: 'Provide one or more reference images (up to 5)',
  icon: 'ImagePlus',
  inputs: [
    { id: 'image', label: 'Source', type: 'image' },
  ],
  outputs: [
    { id: 'image', label: 'Primary', type: 'image' },
    { id: 'references', label: 'All Refs', type: 'image' },
  ],
  defaultConfig: { images: [] },
  minWidth: 240,
};

export const imageToImageExecutor: NodeExecutor = async (inputs, config) => {
  const connectedImage = inputs.image as string | undefined;

  // New multi-image config
  const images = (config.images as UploadedImage[]) ?? [];

  // Legacy single-image config (backward compat)
  const legacyPath = config.storagePath as string | undefined;

  if (connectedImage) {
    return { image: connectedImage, references: [connectedImage] };
  }

  if (images.length > 0) {
    const paths = images.map((i) => i.storagePath).filter(Boolean);
    if (paths.length === 0) throw new Error('Images are still uploading');
    return { image: paths[0], references: paths };
  }

  // Legacy fallback
  if (legacyPath) {
    return { image: legacyPath, references: [legacyPath] };
  }

  throw new Error('No reference images provided');
};

interface ImageToImageNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function ImageToImageNode({ data, id, selected }: ImageToImageNodeProps) {
  const [config, , updateMultiple] = useNodeConfig(id, data.config);
  const hasConnectedInput = Boolean(data.outputValues?.image);

  // Legacy migration + current images
  const images: UploadedImage[] = React.useMemo(() => {
    const imgs = config.images as UploadedImage[] | undefined;
    if (imgs && imgs.length > 0) return imgs;
    const legacyUrl = config.imageUrl as string | undefined;
    const legacyPath = config.storagePath as string | undefined;
    if (legacyUrl || legacyPath) {
      return [{ url: legacyUrl || '', storagePath: legacyPath || '' }];
    }
    return [];
  }, [config.images, config.imageUrl, config.storagePath]);

  const handleImagesChange = React.useCallback(
    (newImages: UploadedImage[]) => {
      updateMultiple({ images: newImages, imageUrl: '', storagePath: '' });
    },
    [updateMultiple],
  );

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={imageToImageDefinition.label}
      icon={<ImagePlus className="size-4" />}
      inputs={imageToImageDefinition.inputs}
      outputs={imageToImageDefinition.outputs}
      minWidth={imageToImageDefinition.minWidth}
    >
      <ImageUploadSlot
        images={images}
        onChange={handleImagesChange}
        maxImages={MAX_IMAGES}
        emptyLabel={`Drop or click to upload (up to ${MAX_IMAGES})`}
        previewHeight="h-20"
      />
      {hasConnectedInput && (
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Using connected source image
        </p>
      )}
    </BaseWorkflowNode>
  );
}
