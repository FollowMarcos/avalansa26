/**
 * Workflow Node Registration
 *
 * Imports all node types and registers them in the node registry.
 * Must be imported once before the workflow canvas renders.
 */

import { registerNode } from '../node-registry';

import { PromptInputNode, promptInputDefinition, promptInputExecutor } from './prompt-input-node';
import { SettingsNode, settingsDefinition, settingsExecutor } from './settings-node';
import { ImageGenerateNode, imageGenerateDefinition, imageGenerateExecutor } from './image-generate-node';
import { ImagePreviewNode, imagePreviewDefinition, imagePreviewExecutor } from './image-preview-node';
import { ImageToImageNode, imageToImageDefinition, imageToImageExecutor } from './image-to-image-node';
import { PromptMergeNode, promptMergeDefinition, promptMergeExecutor } from './prompt-merge-node';
import { PromptVaultNode, promptVaultDefinition, promptVaultExecutor } from './prompt-vault-node';
import { AvaNode, avaDefinition, avaExecutor } from './ava-node';
import { ImageGridNode, imageGridDefinition, imageGridExecutor } from './image-grid-node';
import { NoteNode, noteDefinition, noteExecutor } from './note-node';
import { CollageComposerNode, collageComposerDefinition, collageComposerExecutor } from './collage-composer-node';

registerNode({ definition: promptInputDefinition, component: PromptInputNode, executor: promptInputExecutor });
registerNode({ definition: settingsDefinition, component: SettingsNode, executor: settingsExecutor });
registerNode({ definition: imageGenerateDefinition, component: ImageGenerateNode, executor: imageGenerateExecutor });
registerNode({ definition: imagePreviewDefinition, component: ImagePreviewNode, executor: imagePreviewExecutor });
registerNode({ definition: imageToImageDefinition, component: ImageToImageNode, executor: imageToImageExecutor });
registerNode({ definition: promptMergeDefinition, component: PromptMergeNode, executor: promptMergeExecutor });
registerNode({ definition: promptVaultDefinition, component: PromptVaultNode, executor: promptVaultExecutor });
registerNode({ definition: avaDefinition, component: AvaNode, executor: avaExecutor });
registerNode({ definition: imageGridDefinition, component: ImageGridNode, executor: imageGridExecutor });
registerNode({ definition: noteDefinition, component: NoteNode, executor: noteExecutor });
registerNode({ definition: collageComposerDefinition, component: CollageComposerNode, executor: collageComposerExecutor });
