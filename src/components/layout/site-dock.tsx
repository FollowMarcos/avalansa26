"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Library, Sparkles, FlaskConical, Settings, User, ExternalLink, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImagine } from "@/components/imagine/imagine-context";
import { createClient } from "@/utils/supabase/client";
import { motion, Reorder } from "motion/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DockType, DockIconPosition } from "@/types/database";
import { getDockPreferences, saveDockPreferences } from "@/utils/supabase/dock-preferences.client";

// Draggable items config (Home and Settings are fixed)
const DRAGGABLE_DOCK_ITEMS = ['library', 'imagine', 'labs', 'tools', 'profile'] as const;
type DockItemId = typeof DRAGGABLE_DOCK_ITEMS[number];

// Wavy lines SVG pattern for Milky Dream style
const WavyPattern = ({ dark = false }: { dark?: boolean }) => (
    <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id={`wavy-dock-${dark ? 'dark' : 'light'}`} x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                <path
                    d="M0 10 Q10 5, 20 10 T40 10"
                    fill="none"
                    stroke={dark ? '#3f3f46' : '#d1d5db'}
                    strokeWidth="0.5"
                />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#wavy-dock-${dark ? 'dark' : 'light'})`} />
    </svg>
);

export function SiteDock() {
    const pathname = usePathname();
    const { isInputVisible, toggleInputVisibility, setActiveTab } = useImagine();
    const [username, setUsername] = React.useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
    const [dockType, setDockType] = React.useState<DockType>('milky_dream_light');
    const [items, setItems] = React.useState<DockItemId[]>([...DRAGGABLE_DOCK_ITEMS]);

    React.useEffect(() => {
        async function fetchProfileAndPreferences() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsAuthenticated(true);
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", user.id)
                    .single();
                if (profile?.username) {
                    setUsername(profile.username);
                }

                // Load dock preferences
                const prefs = await getDockPreferences();
                if (prefs) {
                    if (prefs.dock_type) {
                        setDockType(prefs.dock_type);
                    }
                    if (prefs.icon_positions && prefs.icon_positions.length > 0) {
                        // Sort draggable items based on saved preferences
                        const sortedItems = [...DRAGGABLE_DOCK_ITEMS].sort((a, b) => {
                            const posA = prefs.icon_positions.find(p => p.id === a);
                            const posB = prefs.icon_positions.find(p => p.id === b);
                            const orderA = posA ? posA.order : DRAGGABLE_DOCK_ITEMS.indexOf(a);
                            const orderB = posB ? posB.order : DRAGGABLE_DOCK_ITEMS.indexOf(b);
                            return orderA - orderB;
                        });
                        setItems(sortedItems);
                    }
                }
            } else {
                setIsAuthenticated(false);
            }
        }
        fetchProfileAndPreferences();
    }, []);

    const handleReorder = (newOrder: DockItemId[]) => {
        setItems(newOrder);

        // Save to DB
        const positions: DockIconPosition[] = newOrder.map((id, index) => ({
            id,
            order: index
        }));
        // We include Home/Settings implicitly in the full list if needed, 
        // but for now we only store the draggable order relative to each other.
        // Or we could store indices shifted by 1 to account for Home.
        // Let's store direct order, but interpretation is "start of draggable section".
        saveDockPreferences({ icon_positions: positions });
    };

    const isImaginePage = pathname === "/imagine";
    const isDark = dockType.includes('dark');
    const isFloating = dockType.includes('floating'); // Simplified logic, assuming floating styles not requested for this specific draggable implementation right now or handled generically

    const handleImagineClick = (e: React.MouseEvent) => {
        if (isImaginePage) {
            e.preventDefault();
            toggleInputVisibility();
        } else {
            setActiveTab("imagine");
        }
    };

    // Don't render dock for unauthenticated users or while checking auth
    if (isAuthenticated === null || isAuthenticated === false) return null;
    if (isInputVisible && isImaginePage) return null;

    // Helper to render specific items by ID
    const renderDockItem = (id: DockItemId) => {
        switch (id) {
            case 'library':
                return (
                    <Link
                        href="/library"
                        className={cn(
                            "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-blue-400 to-blue-600",
                            pathname === "/library" ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                        )}
                        aria-label="Library"
                    >
                        <Library className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </Link>
                );
            case 'imagine':
                return (
                    <div className="relative group/imagine">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5856D6] to-[#AF52DE] blur-md opacity-40 group-hover/imagine:opacity-80 transition-opacity rounded-[12px]" />
                        <Link
                            href="/imagine"
                            onClick={handleImagineClick}
                            className={cn(
                                "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-[#5856D6] to-[#AF52DE]",
                                pathname === "/imagine" ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                            )}
                            aria-label="Imagine"
                        >
                            <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 rounded-[12px]"
                            />
                            <Sparkles className="w-6 h-6 text-white relative z-10" strokeWidth={1.5} />
                        </Link>
                    </div>
                );
            case 'labs':
                return (
                    <Link
                        href="/labs"
                        className={cn(
                            "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-orange-400 to-orange-600",
                            pathname === "/labs" ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                        )}
                        aria-label="Labs"
                    >
                        <FlaskConical className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </Link>
                );
            case 'tools':
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-pink-500 to-rose-600",
                                    pathname.startsWith("/tools") ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                                )}
                                aria-label="Tools"
                            >
                                <Hammer className="w-6 h-6 text-white" strokeWidth={1.5} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="center" className="mb-2 min-w-[170px] p-1.5 bg-background/80 backdrop-blur-3xl border-border rounded-2xl shadow-2xl">
                            <DropdownMenuItem asChild className="rounded-[12px] cursor-pointer focus:bg-primary/10">
                                <Link href="/tools/x-preview" className="flex items-center justify-between w-full group/item py-2 px-3">
                                    <span className="flex items-center gap-2.5 font-medium">
                                        <div className="w-6 h-6 rounded-[7px] bg-[#5856D6] flex items-center justify-center shadow-sm">
                                            <Sparkles className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        X Preview
                                    </span>
                                    <button
                                        onClick={(e) => { e.preventDefault(); window.open("/tools/x-preview", "_blank"); }}
                                        className="opacity-0 group-hover/item:opacity-100 hover:text-primary transition-opacity p-1"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            case 'profile':
                return (
                    <Link
                        href={username ? `/u/${username}` : "/onboarding"}
                        className={cn(
                            "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-green-400 to-green-600",
                            pathname === `/u/${username}` ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                        )}
                        aria-label="Profile"
                    >
                        <User className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </Link>
                );
            default:
                return null;
        }
    };

    // If floating layout is active, we just render the standard implementation for now 
    // but adapted to include draggable support if desired. 
    // For simplicity based on request, I'll focus on the main dock structure 
    // being customizable but support the floating islands style if selected.

    // NOTE: The user asked to enable draggable icons for the main dock. 
    // The previous implementation had a specific floating logic that split icons.
    // I will unify them into one Reorder list for simplicity, or handle style changes via CSS/container classes.

    const containerClass = isFloating
        ? isDark ? "bg-zinc-900/90 border-zinc-700/50" : "bg-white/90 border-zinc-200/50"
        : isDark ? "bg-[#111111]" : "bg-gradient-to-br from-[#fefefe] via-[#f8f8f8] to-[#fefefe]";

    const wrapperClass = isFloating
        ? "flex items-center gap-2 p-3 rounded-2xl backdrop-blur-xl border shadow-lg"
        : "relative flex items-center gap-2 p-3 rounded-[20px] overflow-hidden shadow-2xl";

    return (
        <div className="flex items-center justify-center pointer-events-auto">
            <div className={cn(wrapperClass, containerClass)}>
                {!isFloating && <WavyPattern dark={isDark} />}

                <div className="relative z-10 flex items-center gap-2">
                    {/* Fixed Home Button */}
                    <Link
                        href="/"
                        className={cn(
                            "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg",
                            "bg-white dark:bg-zinc-100",
                            pathname === "/" ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                        )}
                        aria-label="Home"
                    >
                        <div className="relative w-6 h-6">
                            <Image src="/ab.svg" alt="Logo" fill className="object-contain" />
                        </div>
                    </Link>

                    {/* Separator */}
                    <div className={cn("w-px h-10 mx-1", isDark ? "bg-zinc-700/50" : "bg-gray-200/50")} />

                    {/* Draggable Zone */}
                    <Reorder.Group axis="x" values={items} onReorder={handleReorder} className="flex items-center gap-2">
                        {items.map((id) => (
                            <Reorder.Item key={id} value={id}>
                                {renderDockItem(id)}
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    {/* Separator (Optional, keeping it symmetric or just rely on spacing? Request asked for separator between Home and rest. Settings is 'fixed' at end, so maybe separator there too?) */}
                    {/* <div className={cn("w-px h-10 mx-1", isDark ? "bg-zinc-700/50" : "bg-gray-200/50")} /> */}

                    {/* Fixed Settings Button */}
                    <Link
                        href={username ? `/u/${username}/settings` : "/onboarding"}
                        className={cn(
                            "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-gray-600 to-gray-800",
                            (username && pathname === `/u/${username}/settings`) ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                        )}
                        aria-label="Settings"
                    >
                        <Settings className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
