'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Loader2,
    Plus,
    Trash2,
    Pencil,
    GripVertical,
    Save,
    X,
    ChevronDown,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

import type { DockItem, DockItemInsert, DockDropdownItem } from '@/types/database';
import {
    getDockItems,
    createDockItem,
    updateDockItem,
    deleteDockItem,
    reorderDockItems,
} from '@/utils/supabase/dock-items.client';

// Sortable Item Component
function SortableDockItem({
    item,
    onEdit,
    onDelete,
}: {
    item: DockItem;
    onEdit: (item: DockItem) => void;
    onDelete: (item: DockItem) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    // @ts-ignore
    const Icon = LucideIcons[item.icon] || LucideIcons.HelpCircle;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-3 bg-card border rounded-lg shadow-sm group"
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:text-primary active:cursor-grabbing"
            >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted/50">
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{item.label}</span>
                    {!item.is_visible && (
                        <Badge variant="secondary" className="text-[10px] h-5">
                            Hidden
                        </Badge>
                    )}
                    {item.required_role === 'admin' && (
                        <Badge variant="outline" className="text-[10px] h-5 border-amber-500/50 text-amber-500">
                            Admin
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                    {item.href || (item.dropdown_items?.length ? `${item.dropdown_items.length} dropdown items` : 'No action')}
                </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Pencil className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(item)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export function DockManager() {
    const [items, setItems] = useState<DockItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<DockItem>>({});
    const [dropdownItems, setDropdownItems] = useState<DockDropdownItem[]>([]);

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadItems();
    }, []);

    async function loadItems() {
        setIsLoading(true);
        const data = await getDockItems();
        setItems(data);
        setIsLoading(false);
    }

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update order in DB
                const reorderedItems = newItems.map((item, index) => ({
                    id: item.id,
                    order: index,
                }));

                reorderDockItems(reorderedItems);

                return newItems;
            });
        }
    };

    const handleSaveItem = async () => {
        if (!currentItem.label || !currentItem.icon) {
            toast.error('Label and Icon are required');
            return;
        }

        setIsSaving(true);

        const itemData: any = {
            label: currentItem.label,
            icon: currentItem.icon,
            href: currentItem.href || null,
            is_visible: currentItem.is_visible !== false, // default true
            required_role: currentItem.required_role || null,
            dropdown_items: dropdownItems.length > 0 ? dropdownItems : null,
            order: currentItem.order ?? items.length,
        };

        let savedItem;
        if (currentItem.id) {
            // Update
            savedItem = await updateDockItem(currentItem.id, itemData);
            if (savedItem) {
                setItems(items.map(i => i.id === savedItem!.id ? savedItem! : i));
                toast.success('Dock item updated');
            } else {
                toast.error('Failed to update dock item');
            }
        } else {
            // Create
            savedItem = await createDockItem(itemData);
            if (savedItem) {
                setItems([...items, savedItem]);
                toast.success('Dock item created');
            } else {
                toast.error('Failed to create dock item');
            }
        }

        setIsSaving(false);
        setIsDialogOpen(false);
    };

    const handleDeleteItem = async (item: DockItem) => {
        if (confirm('Are you sure you want to delete this dock item?')) {
            const success = await deleteDockItem(item.id);
            if (success) {
                setItems(items.filter(i => i.id !== item.id));
                toast.success('Dock item deleted');
            } else {
                toast.error('Failed to delete dock item');
            }
        }
    };

    const openEditDialog = (item: DockItem) => {
        setCurrentItem(item);
        setDropdownItems(item.dropdown_items || []);
        setIsDialogOpen(true);
    };

    const openCreateDialog = () => {
        setCurrentItem({ is_visible: true, required_role: null as any });
        setDropdownItems([]);
        setIsDialogOpen(true);
    };

    const addDropdownItem = () => {
        setDropdownItems([...dropdownItems, { label: 'New Item', href: '/', icon: 'Sparkles' }]);
    };

    const removeDropdownItem = (index: number) => {
        const newItems = [...dropdownItems];
        newItems.splice(index, 1);
        setDropdownItems(newItems);
    };

    const updateDropdownItem = (index: number, field: keyof DockDropdownItem, value: string) => {
        const newItems = [...dropdownItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setDropdownItems(newItems);
    };

    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Dock Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage the icons and links visible in the main site dock.
                    </p>
                </div>
                <Button onClick={openCreateDialog} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Item
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                    <div className="grid gap-3">
                        {items.map((item) => (
                            <SortableDockItem
                                key={item.id}
                                item={item}
                                onEdit={openEditDialog}
                                onDelete={handleDeleteItem}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {items.length === 0 && (
                <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground">
                    No dock items found. Add one to get started.
                </div>
            )}

            {/* Edit/Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentItem.id ? 'Edit Dock Item' : 'Add Dock Item'}</DialogTitle>
                        <DialogDescription>
                            Configure the appearance and behavior of the dock button.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Label</Label>
                                <Input
                                    value={currentItem.label || ''}
                                    onChange={e => setCurrentItem({ ...currentItem, label: e.target.value })}
                                    placeholder="e.g. Library"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Icon Name (Lucide)</Label>
                                <Input
                                    value={currentItem.icon || ''}
                                    onChange={e => setCurrentItem({ ...currentItem, icon: e.target.value })}
                                    placeholder="e.g. Library, Sparkles"
                                />
                                <p className="text-[10px] text-muted-foreground text-right pt-1">
                                    Use <a href="https://lucide.dev/icons" target="_blank" className="underline hover:text-primary">Lucide icon names</a>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Main Link URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={currentItem.href || ''}
                                    onChange={e => setCurrentItem({ ...currentItem, href: e.target.value })}
                                    placeholder="e.g. /library or https://google.com"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Optional if using dropdown items.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label className="text-sm">Visible</Label>
                                    <p className="text-[10px] text-muted-foreground">Show in dock</p>
                                </div>
                                <Switch
                                    checked={currentItem.is_visible}
                                    onCheckedChange={c => setCurrentItem({ ...currentItem, is_visible: c })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Required Role</Label>
                                <Select
                                    value={currentItem.required_role || "all"}
                                    onValueChange={v => setCurrentItem({ ...currentItem, required_role: v === "all" ? undefined : v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="admin">Admin Only</SelectItem>
                                        <SelectItem value="user">User Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Dropdown Items Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <Label>Dropdown Menu Items</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addDropdownItem} className="h-8 gap-1">
                                    <Plus className="w-3 h-3" /> Add Sub-item
                                </Button>
                            </div>

                            {dropdownItems.length === 0 && (
                                <p className="text-sm text-muted-foreground italic text-center py-2">
                                    No dropdown items. The dock button will act as a direct link.
                                </p>
                            )}

                            <div className="space-y-3">
                                {dropdownItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-start p-3 bg-muted/30 rounded-lg border">
                                        <div className="grid gap-2 flex-1">
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    value={item.label}
                                                    onChange={e => updateDropdownItem(idx, 'label', e.target.value)}
                                                    placeholder="Label"
                                                    className="h-8 text-sm"
                                                />
                                                <Input
                                                    value={item.icon || ''}
                                                    onChange={e => updateDropdownItem(idx, 'icon', e.target.value)}
                                                    placeholder="Icon"
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <Input
                                                value={item.href}
                                                onChange={e => updateDropdownItem(idx, 'href', e.target.value)}
                                                placeholder="URL"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                            onClick={() => removeDropdownItem(idx)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveItem} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
