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
  Combine,
  LayoutGrid,
  BookOpen,
  RotateCcw,
  Rotate3d,
  Search,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Keyboard,
  type LucideIcon,
} from 'lucide-react';
import { getAllDefinitions } from './node-registry';
import type { WorkflowNodeDefinition, NodeCategory } from '@/types/workflow';
import { SOCKET_COLORS } from '@/types/workflow';

// Ensure registration
import './nodes';

type PanelTab = 'nodes' | 'hotkeys';

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  input: 'Input',
  processing: 'Processing',
  output: 'Output',
  utility: 'Utility',
};

const CATEGORY_ORDER: NodeCategory[] = [
  'input',
  'processing',
  'output',
  'utility',
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Type: <Type className="size-4" />,
  Settings: <Settings className="size-4" />,
  Sparkles: <Sparkles className="size-4" />,
  Eye: <Eye className="size-4" />,
  ImagePlus: <ImagePlus className="size-4" />,
  Merge: <Merge className="size-4" />,
  Combine: <Combine className="size-4" />,
  LayoutGrid: <LayoutGrid className="size-4" />,
  BookOpen: <BookOpen className="size-4" />,
  RotateCcw: <RotateCcw className="size-4" />,
  Rotate3d: <Rotate3d className="size-4" />,
};

const HOTKEY_SECTIONS = [
  {
    title: 'Tools',
    items: [
      { keys: ['V'], description: 'Select tool' },
      { keys: ['H'], description: 'Hand tool' },
      { keys: ['Space', 'Drag'], description: 'Pan canvas' },
    ],
  },
  {
    title: 'Viewport',
    items: [
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '\u2013'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Fit view' },
    ],
  },
  {
    title: 'Editing',
    items: [
      { keys: ['Del'], description: 'Delete selected' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'S'], description: 'Save workflow' },
    ],
  },
];

const TAB_ITEMS: { id: PanelTab; icon: LucideIcon; label: string }[] = [
  { id: 'nodes', icon: LayoutGrid, label: 'Nodes' },
  { id: 'hotkeys', icon: Keyboard, label: 'Keys' },
];

interface NodePaletteProps {
  className?: string;
}

/**
 * Workflow node palette with draggable nodes and hotkeys reference.
 */
export function NodePalette({ className }: NodePaletteProps) {
  const [activeTab, setActiveTab] = React.useState<PanelTab>('nodes');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [collapsedCategories, setCollapsedCategories] = React.useState<
    Set<string>
  >(new Set());

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
        'absolute top-4 right-4 z-20 w-72',
        'rounded-xl bg-background/95 backdrop-blur-xl border border-border shadow-lg',
        'flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden',
        className,
      )}
    >
      {/* Tab bar */}
      <div className="flex" role="tablist" aria-label="Workflow panel tabs">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] border-b-2 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              activeTab === tab.id
                ? 'text-foreground border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground',
            )}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
          >
            <tab.icon className="size-3.5" aria-hidden="true" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Nodes tab */}
      {activeTab === 'nodes' && (
        <div
          id="panel-nodes"
          role="tabpanel"
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={"Search nodes\u2026"}
                className="w-full pl-7 pr-2 py-1.5 rounded-md border border-border bg-muted/30 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Search workflow nodes"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
            {CATEGORY_ORDER.map((cat) => {
              const defs = groupedByCategory.get(cat) ?? [];
              if (defs.length === 0) return null;
              const isCollapsed = collapsedCategories.has(cat);

              return (
                <div key={cat}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-1 w-full px-1 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="size-3" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="size-3" aria-hidden="true" />
                    )}
                    {CATEGORY_LABELS[cat]}
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-0 mb-1">
                      {defs.map((def) => (
                        <div
                          key={def.type}
                          draggable
                          onDragStart={(e) => onDragStart(e, def)}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1 rounded-lg',
                            'cursor-grab active:cursor-grabbing',
                            'hover:bg-muted/60 transition-colors',
                            'select-none',
                          )}
                          title={def.description}
                        >
                          <GripVertical className="size-3 text-muted-foreground/40 flex-shrink-0" aria-hidden="true" />
                          <div className="text-muted-foreground flex-shrink-0">
                            {ICON_MAP[def.icon] ?? (
                              <Settings className="size-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {def.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {def.description}
                            </p>
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            {def.outputs.slice(0, 2).map((s) => (
                              <div
                                key={s.id}
                                className="size-2 rounded-full"
                                style={{
                                  backgroundColor: SOCKET_COLORS[s.type],
                                }}
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
      )}

      {/* Hotkeys tab */}
      {activeTab === 'hotkeys' && (
        <div
          id="panel-hotkeys"
          role="tabpanel"
          className="flex-1 overflow-y-auto px-3 py-2 space-y-3"
        >
          {HOTKEY_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-xs text-foreground">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {item.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd
                            className={cn(
                              'inline-flex items-center justify-center',
                              'min-w-[20px] h-5 px-1.5',
                              'text-[10px] font-medium',
                              'bg-muted border border-border rounded',
                              'text-muted-foreground',
                            )}
                          >
                            {key}
                          </kbd>
                          {keyIdx < item.keys.length - 1 && (
                            <span className="text-[10px] text-muted-foreground mx-0.5">
                              +
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
