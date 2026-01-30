'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Library, Sparkles, FlaskConical, Hammer, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DockType } from '@/types/database';
import { getDockPreferences, saveDockPreferences } from '@/utils/supabase/dock-preferences.client';

// Dock type configurations
const DOCK_CONFIGS: Record<DockType, {
    label: string;
    description: string;
}> = {
    floating_islands_light: {
        label: 'Light',
        description: 'Light theme with glass effect',
    },
    floating_islands_dark: {
        label: 'Dark',
        description: 'Dark theme with glass effect',
    },
};

// Preview icons that match the actual site dock
const PreviewIcon = ({ gradient, children }: { gradient: string; children: React.ReactNode }) => (
    <motion.div
        className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-md",
            gradient
        )}
        whileHover={{ scale: 1.05 }}
    >
        {children}
    </motion.div>
);

interface InteractiveDockProps {
    className?: string;
}

export function InteractiveDock({ className }: InteractiveDockProps) {
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [dockType, setDockType] = React.useState<DockType>('floating_islands_light');

    // Load preferences on mount
    React.useEffect(() => {
        async function loadPreferences() {
            try {
                const { createClient } = await import('@/utils/supabase/client');
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    setIsAuthenticated(true);
                    const prefs = await getDockPreferences();
                    if (prefs?.dock_type) {
                        setDockType(prefs.dock_type);
                    }
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadPreferences();
    }, []);

    const handleDockTypeChange = async (newType: DockType) => {
        setDockType(newType);
        if (!isAuthenticated) return;

        setIsSaving(true);
        try {
            await saveDockPreferences({ dock_type: newType });
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const isDark = dockType === 'floating_islands_dark';

    if (isLoading) {
        return (
            <div className={cn("flex flex-col items-center gap-8", className)}>
                <div className="h-20 w-96 rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
        );
    }

    // Show sign-in prompt for unauthenticated users
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

    // Render the dock preview based on current style
    const renderDockPreview = () => {
        const containerClass = isDark
            ? "bg-zinc-900/90 border-zinc-700/50"
            : "bg-white/90 border-zinc-200/50";

        return (
            <div className="flex items-center gap-2">
                <div className={cn("flex items-center gap-1.5 p-2 rounded-2xl backdrop-blur-xl border shadow-lg", containerClass)}>
                    <PreviewIcon gradient="bg-gradient-to-br from-blue-400 to-blue-600">
                        <Library className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </PreviewIcon>
                    <PreviewIcon gradient="bg-gradient-to-br from-[#5856D6] to-[#AF52DE]">
                        <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </PreviewIcon>
                    <PreviewIcon gradient="bg-gradient-to-br from-orange-400 to-orange-600">
                        <FlaskConical className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </PreviewIcon>
                    <PreviewIcon gradient="bg-gradient-to-br from-pink-500 to-rose-600">
                        <Hammer className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </PreviewIcon>
                </div>
                <div className={cn("flex items-center p-2 rounded-2xl backdrop-blur-xl border shadow-lg", containerClass)}>
                    <PreviewIcon gradient="bg-gradient-to-br from-gray-600 to-gray-800">
                        <Settings className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </PreviewIcon>
                </div>
            </div>
        );
    };

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

            {/* Dock Preview */}
            <div className="relative">
                {renderDockPreview()}
            </div>

            {/* Instructions */}
            <p className="text-xs text-muted-foreground/60 text-center max-w-md">
                Select a dock style above. You can reorder icons by dragging them directly on the dock at the bottom of the screen.
            </p>
        </div>
    );
}
