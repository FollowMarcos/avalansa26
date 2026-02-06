'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Play,
  Square,
  Save,
  FolderOpen,
  Download,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Workflow } from '@/types/workflow';

interface WorkflowToolbarProps {
  isExecuting: boolean;
  executionProgress: { completed: number; total: number };
  savedWorkflows: Workflow[];
  workflowName: string;
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  onLoad: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onNameChange: (name: string) => void;
}

/**
 * Floating toolbar for workflow mode with run, save, load, export/import controls.
 */
export function WorkflowToolbar({
  isExecuting,
  executionProgress,
  savedWorkflows,
  workflowName,
  onRun,
  onStop,
  onSave,
  onLoad,
  onExport,
  onImport,
  onNameChange,
}: WorkflowToolbarProps) {
  const [showLoadMenu, setShowLoadMenu] = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [nameValue, setNameValue] = React.useState(workflowName);
  const importRef = React.useRef<HTMLInputElement>(null);
  const loadMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setNameValue(workflowName);
  }, [workflowName]);

  // Close load menu on outside click
  React.useEffect(() => {
    if (!showLoadMenu) return;
    const handler = (e: MouseEvent) => {
      if (loadMenuRef.current && !loadMenuRef.current.contains(e.target as HTMLElement)) {
        setShowLoadMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLoadMenu]);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    if (importRef.current) importRef.current.value = '';
  };

  const finishNameEdit = () => {
    setIsEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== workflowName) {
      onNameChange(trimmed);
    } else {
      setNameValue(workflowName);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1.5 rounded-xl bg-background/95 backdrop-blur-xl border border-border shadow-lg px-3 py-2">
          {/* Workflow name */}
          {isEditingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={finishNameEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishNameEdit();
                if (e.key === 'Escape') {
                  setNameValue(workflowName);
                  setIsEditingName(false);
                }
              }}
              className="w-32 px-2 py-0.5 text-xs rounded-md border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
              aria-label="Workflow name"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="px-2 py-0.5 text-xs font-medium text-foreground hover:bg-muted/60 rounded-md transition-colors max-w-[140px] truncate"
              title="Click to rename"
            >
              {workflowName}
            </button>
          )}

          <div className="w-px h-5 bg-border mx-1" />

          {/* Run / Stop */}
          {isExecuting ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onStop}
                  className="gap-1.5 h-8"
                >
                  <Square className="size-3.5" />
                  Stop
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop Execution (Esc)</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onRun}
                  className="gap-1.5 h-8"
                >
                  <Play className="size-3.5" />
                  Run
                </Button>
              </TooltipTrigger>
              <TooltipContent>Run Workflow (Ctrl+Enter)</TooltipContent>
            </Tooltip>
          )}

          {/* Progress indicator */}
          {isExecuting && (
            <div className="flex items-center gap-1.5 px-2">
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">
                {executionProgress.completed}/{executionProgress.total}
              </span>
            </div>
          )}

          <div className="w-px h-5 bg-border mx-1" />

          {/* Save */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSave}
                className="size-8 rounded-lg"
                aria-label="Save workflow"
              >
                <Save className="size-4" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save Workflow</TooltipContent>
          </Tooltip>

          {/* Load */}
          <div className="relative" ref={loadMenuRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLoadMenu(!showLoadMenu)}
                  className="size-8 rounded-lg"
                  aria-label="Load workflow"
                  aria-expanded={showLoadMenu}
                >
                  <FolderOpen className="size-4" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Load Workflow</TooltipContent>
            </Tooltip>

            {showLoadMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 rounded-lg bg-background border border-border shadow-lg py-1 max-h-48 overflow-y-auto">
                {savedWorkflows.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    No saved workflows
                  </p>
                ) : (
                  savedWorkflows.map((wf) => (
                    <button
                      key={wf.id}
                      type="button"
                      onClick={() => {
                        onLoad(wf.id);
                        setShowLoadMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors truncate"
                    >
                      {wf.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Export JSON */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onExport}
                className="size-8 rounded-lg"
                aria-label="Export workflow as JSON"
              >
                <Download className="size-4" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export JSON</TooltipContent>
          </Tooltip>

          {/* Import JSON */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => importRef.current?.click()}
                className="size-8 rounded-lg"
                aria-label="Import workflow from JSON"
              >
                <Upload className="size-4" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import JSON</TooltipContent>
          </Tooltip>

          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
