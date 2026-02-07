"use client";

import * as React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useCreate } from "./create-context";
import { CanvasViewport } from "./canvas-viewport";
import { HistoryIsland } from "./history-island";
import { CanvasList } from "./canvas-list";
import { PromptComposer } from "./prompt-composer";
import { QuickToolbar } from "./quick-toolbar";
import { GenerationGallery } from "./generation-gallery";
import { MaintenanceBanner } from "./maintenance-banner";
import { HotkeysIsland } from "./hotkeys-island";
import { PromptVaultIsland } from "./prompt-vault-island";
import { SavePromptDialog } from "./save-prompt-dialog";
import { SharePromptDialog } from "./share-prompt-dialog";
import { usePromptVault } from "./use-prompt-vault";
import { useAvaVault } from "./use-ava-vault";
import { CreateAvaDialog } from "./create-ava-dialog";
import { RunAvaDialog } from "./run-ava-dialog";
import { ShareAvaDialog } from "./share-ava-dialog";
import { motion, useReducedMotion } from "motion/react";
import { useWorkflow } from "./workflow/use-workflow";
import { WorkflowCanvas } from "./workflow/workflow-canvas";
import { NodePalette } from "./workflow/node-palette";
import { WorkflowToolbar } from "./workflow/workflow-toolbar";
import { WorkflowList } from "./workflow/workflow-list";

export function StudioLayout() {
  const prefersReducedMotion = useReducedMotion();
  const { addReferenceImages, prompt, setPrompt, settings, updateSettings, selectedApiId, viewMode } = useCreate();

  // Workflow hook
  const workflow = useWorkflow({ apiId: selectedApiId ?? '' });

  // Prompt vault hook
  const promptVault = usePromptVault({
    onPromptSelected: (selectedPrompt) => {
      // Load the prompt into the composer
      setPrompt(selectedPrompt.prompt_text);
      if (selectedPrompt.settings) {
        // Apply saved settings - cast to satisfy type checker since
        // GenerationSettings uses string types but context uses literals
        const savedSettings = selectedPrompt.settings;
        updateSettings({
          negativePrompt: selectedPrompt.negative_prompt || "",
          ...(savedSettings.aspectRatio && { aspectRatio: savedSettings.aspectRatio }),
          ...(savedSettings.imageSize && { imageSize: savedSettings.imageSize }),
          ...(savedSettings.outputCount && { outputCount: savedSettings.outputCount }),
          ...(savedSettings.generationSpeed && { generationSpeed: savedSettings.generationSpeed }),
          ...(savedSettings.referenceImages && { referenceImages: savedSettings.referenceImages }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
    },
  });

  // Ava vault hook
  const avaVault = useAvaVault({
    onAvaResult: (result) => {
      setPrompt(result.prompt);
      if (result.negativePrompt) {
        updateSettings({ negativePrompt: result.negativePrompt } as any);
      }
    },
  });

  // Load avas when vault opens
  React.useEffect(() => {
    if (promptVault.vaultOpen && avaVault.avas.length === 0) {
      avaVault.loadAvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptVault.vaultOpen]);


  return (
    <ReactFlowProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        className="relative h-dvh flex flex-col bg-background text-foreground overflow-hidden"
      >
        {/* Maintenance mode banner (blocks entire page) */}
        <MaintenanceBanner />

        {/* Grain texture overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 bg-noise opacity-[0.03]" />

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center - Canvas/Gallery */}
          <div className="relative flex-1 flex flex-col overflow-hidden">
            {/* Quick Toolbar */}
            <QuickToolbar />

            {/* Canvas Viewport — passes workflow canvas when in workflow mode */}
            <CanvasViewport
              workflowCanvas={
                viewMode === "workflow" ? (
                  <WorkflowCanvas
                    nodes={workflow.nodes}
                    edges={workflow.edges}
                    onNodesChange={workflow.onNodesChange}
                    onEdgesChange={workflow.onEdgesChange}
                    onConnect={workflow.onConnect}
                    onAddNode={workflow.addWorkflowNode}
                    groups={workflow.groups}
                    selectedGroupId={workflow.selectedGroupId}
                    onSelectGroup={workflow.selectGroup}
                    onMoveGroup={workflow.moveGroup}
                    onResizeGroup={workflow.resizeGroup}
                    onUpdateGroup={workflow.updateGroup}
                    onToggleGroupCollapse={workflow.toggleGroupCollapse}
                    onToggleGroupLock={workflow.toggleGroupLock}
                    onDuplicateGroup={workflow.duplicateGroup}
                    onDeleteGroup={workflow.deleteGroup}
                  />
                ) : undefined
              }
            />

            {/* Gallery View (overlay when active) */}
            {viewMode !== "workflow" && <GenerationGallery />}

            {/* Prompt Composer — hidden in workflow mode */}
            {viewMode !== "workflow" && (
              <PromptComposer onSaveToVault={promptVault.openSaveDialog} />
            )}

            {/* Workflow-specific UI */}
            {viewMode === "workflow" && <NodePalette />}
            {viewMode === "workflow" && (
              <WorkflowToolbar
                isExecuting={workflow.isExecuting}
                executionProgress={workflow.executionProgress}
                workflowName={workflow.workflowName}
                onRun={workflow.runWorkflow}
                onStop={workflow.stopWorkflow}
                onSave={workflow.saveWorkflow}
                onExport={workflow.exportWorkflowJSON}
                onImport={workflow.importWorkflowJSON}
                onNameChange={workflow.setWorkflowName}
              />
            )}

            {/* Floating Canvas List (left side) — hidden in workflow mode */}
            {viewMode !== "workflow" && <CanvasList />}

            {/* Floating Workflow List (left side) — only in workflow mode */}
            {viewMode === "workflow" && (
              <WorkflowList
                savedWorkflows={workflow.savedWorkflows}
                currentWorkflowId={workflow.currentWorkflowId}
                workflowName={workflow.workflowName}
                onCreateNew={workflow.createNewWorkflow}
                onSwitch={workflow.switchWorkflow}
                onRename={workflow.renameWorkflow}
                onDelete={workflow.deleteWorkflow}
              />
            )}

            {/* Floating Prompt Vault Island (top left, below canvas list) */}
            <PromptVaultIsland
              open={promptVault.vaultOpen}
              onToggle={promptVault.toggleVault}
              prompts={promptVault.prompts}
              folders={promptVault.folders}
              tags={promptVault.tags}
              onSelectPrompt={promptVault.usePrompt}
              onToggleFavorite={promptVault.toggleFavorite}
              onSharePrompt={promptVault.openShareDialog}
              onDeletePrompt={promptVault.deletePrompt}
              avas={avaVault.avas}
              avaFolders={avaVault.folders}
              onRunAva={avaVault.openRunDialog}
              onEditAva={(ava) => avaVault.openCreateDialog(ava)}
              onCreateAva={() => avaVault.openCreateDialog()}
              onToggleAvaFavorite={avaVault.toggleFavorite}
              onShareAva={avaVault.openShareDialog}
              onDeleteAva={(avaId) => {
                avaVault.deleteAva(avaId);
              }}
            />


            {/* Floating History Island (right side) — hidden in workflow mode */}
            {viewMode !== "workflow" && <HistoryIsland />}

            {/* Floating Hotkeys Island (bottom left) */}
            <HotkeysIsland />
          </div>
        </div>

        {/* Drag overlay for file uploads */}
        <DragOverlay onDrop={addReferenceImages} />

        {/* Save Prompt Dialog */}
        <SavePromptDialog
          open={promptVault.saveDialogOpen}
          onOpenChange={(open) => !open && promptVault.closeSaveDialog()}
          promptText={prompt}
          negativePrompt={settings.negativePrompt}
          settings={settings}
          folders={promptVault.folders}
          tags={promptVault.tags}
          onSave={async (data) => {
            await promptVault.saveNewPrompt({
              name: data.name,
              description: data.description,
              promptText: prompt,
              negativePrompt: settings.negativePrompt,
              settings,
              folderIds: data.folderIds,
              tagIds: data.tagIds,
            });
          }}
          onCreateFolder={promptVault.createFolder}
          onCreateTag={promptVault.createTag}
        />

        {/* Share Prompt Dialog */}
        <SharePromptDialog
          open={promptVault.shareDialogOpen}
          onOpenChange={(open) => !open && promptVault.closeShareDialog()}
          prompt={promptVault.promptToShare}
          onShare={async (userIds, message) => {
            if (promptVault.promptToShare) {
              await promptVault.shareWithUsers(
                promptVault.promptToShare.id,
                userIds,
                message
              );
            }
          }}
          onSearchUsers={promptVault.searchUsers}
        />

        {/* Create/Edit Ava Dialog */}
        <CreateAvaDialog
          open={avaVault.createDialogOpen}
          onOpenChange={(open) => !open && avaVault.closeCreateDialog()}
          editingAva={avaVault.editingAva}
          folders={avaVault.folders}
          tags={avaVault.tags}
          onSave={async (data) => {
            if (avaVault.editingAva) {
              await avaVault.updateExistingAva(avaVault.editingAva.id, data);
            } else {
              await avaVault.saveNewAva(data);
            }
          }}
          onCreateFolder={avaVault.createFolder}
          onCreateTag={avaVault.createTag}
        />

        {/* Run Ava Dialog */}
        <RunAvaDialog
          open={avaVault.runDialogOpen}
          onOpenChange={(open) => !open && avaVault.closeRunDialog()}
          ava={avaVault.avaToRun}
          onRun={avaVault.runAva}
          onUseResult={(resultPrompt, negativePrompt) => {
            setPrompt(resultPrompt);
            if (negativePrompt) {
              updateSettings({ negativePrompt } as any);
            }
          }}
          onSaveResult={(resultPrompt, negativePrompt) => {
            // Pre-fill the save prompt dialog with the generated result
            setPrompt(resultPrompt);
            if (negativePrompt) {
              updateSettings({ negativePrompt } as any);
            }
            promptVault.openSaveDialog();
          }}
          selectedApiId={selectedApiId}
        />

        {/* Share Ava Dialog */}
        <ShareAvaDialog
          open={avaVault.shareDialogOpen}
          onOpenChange={(open) => !open && avaVault.closeShareDialog()}
          ava={avaVault.avaToShare}
          onShare={async (userIds, message) => {
            if (avaVault.avaToShare) {
              await avaVault.shareWithUsers(
                avaVault.avaToShare.id,
                userIds,
                message
              );
            }
          }}
          onSearchUsers={avaVault.searchUsers}
        />

      </motion.div>
    </ReactFlowProvider>
  );
}

function DragOverlay({ onDrop }: { onDrop: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length > 0) {
        onDrop(files);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onDrop]);

  if (!isDragging) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-background/95"
    >
      <div className="text-center">
        <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2 font-mono">
          Drop images here
        </h3>
        <p className="text-sm text-muted-foreground">
          Add up to 14 reference images
        </p>
      </div>
    </motion.div>
  );
}
