'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Type,
  Settings,
  Sparkles,
  Eye,
  ImagePlus,
  Merge,
  Search,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { getAllDefinitions } from './node-registry';
import type { WorkflowNodeDefinition, NodeCategory } from '@/types/workflow';
import { SOCKET_COLORS } from '@/types/workflow';

// Ensure registration
import './nodes';

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  input: 'Input',
  processing: 'Processing',
  output: 'Output',
  utility: 'Utility',
};

const CATEGORY_ORDER: NodeCategory[] = ['input', 'processing', 'output', 'utility'];

const ICON_MAP: Record<string, React.ReactNode> = {
  Type: <Type className="size-4" />,
  Settings: <Settings className="size-4" />,
  Sparkles: <Sparkles className="size-4" />,
  Eye: <Eye className="size-4" />,
  ImagePlus: <ImagePlus className="size-4" />,
  Merge: <Merge className="size-4" />,
};

interface NodePaletteProps {
  className?: string;
}

/**
 * Draggable node palette sidebar for workflow mode.
 * Nodes can be dragged from here onto the canvas.
 */
export function NodePalette({ className }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(
    new Set(),
  );

  const definitions = React.useMemo(() => getAllDefinitions(), []);

  const filteredDefinitions = React.useMemo(() => {
    if (!searchQuery.trim()) return definitions;
    const query = searchQuery.toLowerCase();
    return definitions.filter(
      (d) =>
        d.label.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query),
    );
  }, [definitions, searchQuery]);

  const groupedByCategory = React.useMemo(() => {
    const groups = new Map<NodeCategory, WorkflowNodeDefinition[]>();
    for (const cat of CATEGORY_ORDER) {
      groups.set(cat, []);
    }
    for (const def of filteredDefinitions) {
      const list = groups.get(def.category) ?? [];
      list.push(def);
      groups.set(def.category, list);
    }
    return groups;
  }, [filteredDefinitions]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const onDragStart = (
    event: React.DragEvent,
    definition: WorkflowNodeDefinition,
  ) => {
    event.dataTransfer.setData(
      'application/workflow-node',
      JSON.stringify({ type: definition.type }),
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={cn(
        'absolute top-4 right-4 z-20 w-56',
        'rounded-xl bg-background/95 backdrop-blur-xl border border-border shadow-lg',
        'flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border/50">
        <h3 className="text-xs font-semibold text-foreground mb-2">Nodes</h3>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-7 pr-2 py-1.5 rounded-md border border-border bg-muted/30 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Search workflow nodes"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {CATEGORY_ORDER.map((cat) => {
          const defs = groupedByCategory.get(cat) ?? [];
          if (defs.length === 0) return null;
          const isCollapsed = collapsedCategories.has(cat);

          return (
            <div key={cat}>
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="flex items-center gap-1 w-full px-1 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <ChevronRight className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
                {CATEGORY_LABELS[cat]}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 mb-2">
                  {defs.map((def) => (
                    <div
                      key={def.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, def)}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-lg',
                        'cursor-grab active:cursor-grabbing',
                        'hover:bg-muted/60 transition-colors',
                        'select-none',
                      )}
                      title={def.description}
                    >
                      <GripVertical className="size-3 text-muted-foreground/40 flex-shrink-0" />
                      <div className="text-muted-foreground flex-shrink-0">
                        {ICON_MAP[def.icon] ?? <Settings className="size-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{def.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {def.description}
                        </p>
                      </div>
                      {/* Socket type indicators */}
                      <div className="flex gap-0.5 flex-shrink-0">
                        {def.outputs.slice(0, 2).map((s) => (
                          <div
                            key={s.id}
                            className="size-2 rounded-full"
                            style={{ backgroundColor: SOCKET_COLORS[s.type] }}
                            title={`${s.label} (${s.type})`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredDefinitions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No matching nodes
          </p>
        )}
      </div>
    </div>
  );
}
