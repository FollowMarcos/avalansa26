'use client';

import * as React from 'react';
import { Reorder, motion } from 'motion/react';
import { Folder, Compass, MessageCircle, Mail, Image, Music, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DockType, DockIconPosition } from '@/types/database';
import {
    getDockPreferences,
    saveDockPreferences,
    DEFAULT_ICON_ORDER,
    getDefaultDockPreferences,
} from '@/utils/supabase/dock-preferences.client';

// Icon definitions with macOS-style gradients
const DOCK_ICONS = {
    finder: {
        id: 'finder',
        icon: Folder,
        label: 'Finder',
        gradient: 'from-blue-400 to-blue-600',
        color: '#3b82f6',
    },
    safari: {
        id: 'safari',
        icon: Compass,
        label: 'Safari',
        gradient: 'from-blue-500 to-cyan-500',
        color: '#0ea5e9',
    },
    messages: {
        id: 'messages',
        icon: MessageCircle,
        label: 'Messages',
        gradient: 'from-green-400 to-green-600',
        color: '#22c55e',
    },
    mail: {
        id: 'mail',
        icon: Mail,
        label: 'Mail',
        gradient: 'from-blue-400 to-blue-600',
        color: '#3b82f6',
    },
    photos: {
        id: 'photos',
        icon: Image,
        label: 'Photos',
        gradient: 'from-pink-400 via-purple-400 to-orange-400',
        color: '#a855f7',
    },
    music: {
        id: 'music',
        icon: Music,
        label: 'Music',
        gradient: 'from-red-500 to-pink-500',
        color: '#f43f5e',
    },
    settings: {
        id: 'settings',
        icon: Settings,
        label: 'Settings',
        gradient: 'from-gray-600 to-gray-800',
        color: '#6b7280',
    },
} as const;

type IconId = keyof typeof DOCK_ICONS;

// Wavy lines SVG pattern
const WavyPattern = ({ dark = false }: { dark?: boolean }) => (
    <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`wavy-lines-${dark ? 'dark' : 'light'}`} x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                <path
                    d="M0 10 Q10 5, 20 10 T40 10"
                    fill="none"
                    stroke={dark ? '#3f3f46' : '#d1d5db'}
                    strokeWidth="0.5"
                />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#wavy-lines-${dark ? 'dark' : 'light'})`} />
    </svg>
);

interface DockIconProps {
    iconId: IconId;
    isDark: boolean;
    isFloating?: boolean;
}

const DockIcon = ({ iconId, isDark, isFloating = false }: DockIconProps) => {
    const iconData = DOCK_ICONS[iconId];
    const Icon = iconData.icon;

    return (
        <motion.div
            className={cn(
                "w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing transition-shadow",
                `bg-gradient-to-br ${iconData.gradient}`,
                "hover:shadow-xl"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            layout
        >
            <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
        </motion.div>
    );
};

// Dock type configurations
const DOCK_CONFIGS: Record<DockType, {
    label: string;
    description: string;
}> = {
    milky_dream_light: {
        label: 'Milky Dream (Light)',
        description: 'Milky white with wavy lines',
    },
    milky_dream_dark: {
        label: 'Milky Dream (Dark)',
        description: 'Dark with subtle wavy lines',
    },
    floating_islands_light: {
        label: 'Floating Islands (Light)',
        description: 'Separated groups, light theme',
    },
    floating_islands_dark: {
        label: 'Floating Islands (Dark)',
        description: 'Separated groups, dark theme',
    },
};

interface InteractiveDockProps {
    className?: string;
}

export function InteractiveDock({ className }: InteractiveDockProps) {
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [dockType, setDockType] = React.useState<DockType>('milky_dream_light');
    const [iconOrder, setIconOrder] = React.useState<IconId[]>(
        DEFAULT_ICON_ORDER.map(p => p.id as IconId)
    );

    // Load preferences on mount
    React.useEffect(() => {
        async function loadPreferences() {
            try {
                const prefs = await getDockPreferences();
                if (prefs) {
                    setIsAuthenticated(true);
                    setDockType(prefs.dock_type);
                    if (prefs.icon_positions && prefs.icon_positions.length > 0) {
                        const sortedPositions = [...prefs.icon_positions].sort((a, b) => a.order - b.order);
                        setIconOrder(sortedPositions.map(p => p.id as IconId));
                    }
                } else {
                    // Check if user is authenticated but has no preferences yet
                    const { createClient } = await import('@/utils/supabase/client');
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    setIsAuthenticated(!!user);
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadPreferences();
    }, []);

    // Save preferences when they change (debounced)
    const savePreferences = React.useCallback(async (newDockType: DockType, newOrder: IconId[]) => {
        if (!isAuthenticated) return;

        setIsSaving(true);
        try {
            const positions: DockIconPosition[] = newOrder.map((id, index) => ({
                id,
                order: index,
            }));
            await saveDockPreferences({
                dock_type: newDockType,
                icon_positions: positions,
            });
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setIsSaving(false);
        }
    }, [isAuthenticated]);

    const handleDockTypeChange = (newType: DockType) => {
        setDockType(newType);
        savePreferences(newType, iconOrder);
    };

    const handleReorder = (newOrder: IconId[]) => {
        setIconOrder(newOrder);
        savePreferences(dockType, newOrder);
    };

    const isDark = dockType.includes('dark');
    const isFloating = dockType.includes('floating');

    // Separate icons into groups for floating islands
    const mainIcons = iconOrder.slice(0, -1);
    const settingsIcon = iconOrder[iconOrder.length - 1];

    if (isLoading) {
        return (
            <div className={cn("flex flex-col items-center gap-8", className)}>
                <div className="h-20 w-96 rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
        );
    }

    // Only show dock to authenticated users
    if (!isAuthenticated) {
        return (
            <div className={cn("flex flex-col items-center gap-8", className)}>
                <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Settings className="w-8 h-8 text-zinc-400" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-medium mb-1">Sign in to customize</h3>
                        <p className="text-sm text-muted-foreground/60 max-w-xs">
                            Create an account or sign in to customize your dock and save your preferences.
                        </p>
                    </div>
                    <a
                        href="/sign-in"
                        className="mt-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Sign in
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col items-center gap-8", className)}>
            {/* Dock Type Selector */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {(Object.entries(DOCK_CONFIGS) as [DockType, typeof DOCK_CONFIGS[DockType]][]).map(([type, config]) => (
                    <button
                        key={type}
                        onClick={() => handleDockTypeChange(type)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            dockType === type
                                ? "bg-primary text-primary-foreground shadow-lg"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        )}
                    >
                        {config.label}
                    </button>
                ))}
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isSaving ? (
                    <>
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span>Saving...</span>
                    </>
                ) : (
                    <>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Changes saved automatically</span>
                    </>
                )}
            </div>

            {/* Interactive Dock */}
            <div className="relative">
                {isFloating ? (
                    // Floating Islands Layout
                    <div className="flex items-center gap-4">
                        <Reorder.Group
                            axis="x"
                            values={mainIcons}
                            onReorder={(newMain) => {
                                handleReorder([...newMain, settingsIcon]);
                            }}
                            className={cn(
                                "flex items-center gap-2 p-3 rounded-2xl backdrop-blur-xl border shadow-lg",
                                isDark
                                    ? "bg-zinc-900/90 border-zinc-700/50"
                                    : "bg-white/90 border-zinc-200/50"
                            )}
                        >
                            {mainIcons.map((iconId) => (
                                <Reorder.Item key={iconId} value={iconId}>
                                    <DockIcon iconId={iconId} isDark={isDark} isFloating />
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                        <div
                            className={cn(
                                "flex items-center p-3 rounded-2xl backdrop-blur-xl border shadow-lg",
                                isDark
                                    ? "bg-zinc-900/90 border-zinc-700/50"
                                    : "bg-white/90 border-zinc-200/50"
                            )}
                        >
                            <DockIcon iconId={settingsIcon} isDark={isDark} isFloating />
                        </div>
                    </div>
                ) : (
                    // Milky Dream Layout
                    <div
                        className={cn(
                            "relative flex items-center gap-2 p-3 rounded-[28px] overflow-hidden shadow-2xl",
                            isDark
                                ? "bg-[#111111]"
                                : "bg-gradient-to-br from-[#fefefe] via-[#f8f8f8] to-[#fefefe]"
                        )}
                    >
                        <WavyPattern dark={isDark} />
                        <Reorder.Group
                            axis="x"
                            values={iconOrder}
                            onReorder={handleReorder}
                            className="relative z-10 flex items-center gap-2"
                        >
                            {iconOrder.map((iconId, index) => (
                                <React.Fragment key={iconId}>
                                    {index === iconOrder.length - 1 && (
                                        <div className={cn(
                                            "w-px h-10 mx-1",
                                            isDark ? "bg-zinc-700/50" : "bg-gray-200/50"
                                        )} />
                                    )}
                                    <Reorder.Item value={iconId}>
                                        <DockIcon iconId={iconId} isDark={isDark} />
                                    </Reorder.Item>
                                </React.Fragment>
                            ))}
                        </Reorder.Group>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <p className="text-xs text-muted-foreground/60 text-center max-w-md">
                Drag icons to reorder them. Select a dock style above. Your preferences are saved automatically.
            </p>
        </div>
    );
}
