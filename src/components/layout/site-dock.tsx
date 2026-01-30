"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Library, Sparkles, FlaskConical, Settings, User, Hammer, LayoutDashboard, LogOut, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImagine } from "@/components/imagine/imagine-context";
import { createClient } from "@/utils/supabase/client";
import { Reorder } from "motion/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DockIconPosition, UserRole } from "@/types/database";
import { getDockPreferences, saveDockPreferences } from "@/utils/supabase/dock-preferences.client";
import { useTheme } from "next-themes";
import { PortugalTopo } from "./portugal-topo";
import { DefaultAvatar } from "@/components/ui/default-avatar";

// Draggable items config (Home, Dashboard, and User Avatar are fixed)
const DRAGGABLE_DOCK_ITEMS = ['library', 'imagine', 'labs', 'tools'] as const;
type DockItemId = typeof DRAGGABLE_DOCK_ITEMS[number];

interface UserProfile {
    username: string | null;
    name: string | null;
    avatar_url: string | null;
    role: UserRole;
}

export function SiteDock() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { isInputVisible, toggleInputVisibility, setActiveTab } = useImagine();
    const [profile, setProfile] = React.useState<UserProfile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
    const [items, setItems] = React.useState<DockItemId[]>([...DRAGGABLE_DOCK_ITEMS]);
    const [isDragging, setIsDragging] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    // Handle hydration mismatch for theme
    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        async function fetchProfileAndPreferences() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsAuthenticated(true);
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("username, name, avatar_url, role")
                    .eq("id", user.id)
                    .single();
                if (profileData) {
                    setProfile(profileData as UserProfile);
                }

                // Load dock preferences
                const prefs = await getDockPreferences();
                if (prefs) {
                    if (prefs.icon_positions && prefs.icon_positions.length > 0) {
                        const validIconPositions = prefs.icon_positions.filter(p => DRAGGABLE_DOCK_ITEMS.includes(p.id as DockItemId));
                        const sortedItems = [...DRAGGABLE_DOCK_ITEMS].sort((a, b) => {
                            const posA = validIconPositions.find(p => p.id === a);
                            const posB = validIconPositions.find(p => p.id === b);
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
        const positions: DockIconPosition[] = newOrder.map((id, index) => ({
            id,
            order: index
        }));
        saveDockPreferences({ icon_positions: positions });
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const isImaginePage = pathname === "/imagine";
    // Invert: light mode = dark dock, dark mode = light dock
    const isDockDark = theme === 'light';
    const isAdmin = profile?.role === 'admin';

    // Navigation handler that respects drag state
    const handleNavigation = (path: string, callback?: () => void) => {
        if (isDragging) return;
        if (callback) callback();
        router.push(path);
    };

    // Don't render dock for unauthenticated users, while checking auth, or before hydration
    if (!mounted || isAuthenticated === null || isAuthenticated === false) return null;
    if (isInputVisible && isImaginePage) return null;

    const containerClass = isDockDark
        ? "bg-zinc-900 border-zinc-700/50"
        : "bg-white border-zinc-200/50";

    const displayName = profile?.name || profile?.username || 'User';
    const avatarUrl = profile?.avatar_url;

    // Draggable icon component
    const DraggableIcon = ({ id, children }: { id: DockItemId; children: React.ReactNode }) => (
        <Reorder.Item
            value={id}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
            whileDrag={{ scale: 1.15, zIndex: 100 }}
            className="cursor-grab active:cursor-grabbing"
        >
            {children}
        </Reorder.Item>
    );

    // Base icon styles
    const iconBase = "relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 shadow-md";
    const iconHover = "hover:scale-105 hover:shadow-lg active:scale-95";

    return (
        <div className="flex items-center justify-center pointer-events-auto">
            <div className="flex items-center gap-2">
                {/* Home Button - Fixed */}
                <Link
                    href="/"
                    className={cn(
                        "relative flex items-center justify-center w-14 h-14 rounded-2xl border shadow-lg overflow-hidden transition-all duration-200",
                        containerClass,
                        pathname === "/" ? "ring-2 ring-primary/50 scale-105" : "hover:scale-105 hover:shadow-xl active:scale-95"
                    )}
                    aria-label="Home"
                >
                    <PortugalTopo dark={isDockDark} className="opacity-50" />
                    <div className="relative z-10 w-7 h-7">
                        <Image src={isDockDark ? "/aw.svg" : "/ab.svg"} alt="Logo" fill className="object-contain" />
                    </div>
                </Link>

                {/* Main Nav - Draggable */}
                <div className={cn("relative flex items-center p-2 rounded-2xl border shadow-lg overflow-hidden", containerClass)}>
                    <PortugalTopo dark={isDockDark} className="opacity-50" />
                    <Reorder.Group
                        axis="x"
                        values={items}
                        onReorder={handleReorder}
                        className="relative z-10 flex items-center gap-1"
                    >
                        {items.map((id) => {
                            switch (id) {
                                case 'library':
                                    return (
                                        <DraggableIcon key={id} id={id}>
                                            <div
                                                onClick={() => handleNavigation('/library')}
                                                className={cn(
                                                    iconBase,
                                                    "bg-gradient-to-br from-blue-400 to-blue-600",
                                                    pathname === "/library" ? "ring-2 ring-blue-400/50 scale-105" : iconHover
                                                )}
                                                role="button"
                                                aria-label="Library"
                                            >
                                                <Library className="w-5 h-5 text-white pointer-events-none" strokeWidth={1.5} />
                                            </div>
                                        </DraggableIcon>
                                    );
                                case 'imagine':
                                    return (
                                        <DraggableIcon key={id} id={id}>
                                            <div className="relative group/imagine">
                                                <div className="absolute -inset-1 bg-gradient-to-br from-[#5856D6] to-[#AF52DE] blur-lg opacity-0 group-hover/imagine:opacity-60 transition-opacity rounded-xl pointer-events-none" />
                                                <div
                                                    onClick={() => {
                                                        if (isDragging) return;
                                                        if (isImaginePage) {
                                                            toggleInputVisibility();
                                                        } else {
                                                            setActiveTab("imagine");
                                                            router.push('/imagine');
                                                        }
                                                    }}
                                                    className={cn(
                                                        iconBase,
                                                        "bg-gradient-to-br from-[#5856D6] to-[#AF52DE]",
                                                        pathname === "/imagine" ? "ring-2 ring-purple-400/50 scale-105" : iconHover
                                                    )}
                                                    role="button"
                                                    aria-label="Imagine"
                                                >
                                                    <Sparkles className="w-5 h-5 text-white pointer-events-none" strokeWidth={1.5} />
                                                </div>
                                            </div>
                                        </DraggableIcon>
                                    );
                                case 'labs':
                                    return (
                                        <DraggableIcon key={id} id={id}>
                                            <div
                                                onClick={() => handleNavigation('/labs')}
                                                className={cn(
                                                    iconBase,
                                                    "bg-gradient-to-br from-orange-400 to-orange-600",
                                                    pathname === "/labs" ? "ring-2 ring-orange-400/50 scale-105" : iconHover
                                                )}
                                                role="button"
                                                aria-label="Labs"
                                            >
                                                <FlaskConical className="w-5 h-5 text-white pointer-events-none" strokeWidth={1.5} />
                                            </div>
                                        </DraggableIcon>
                                    );
                                case 'tools':
                                    return (
                                        <DraggableIcon key={id} id={id}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild disabled={isDragging}>
                                                    <div
                                                        className={cn(
                                                            iconBase,
                                                            "bg-gradient-to-br from-pink-500 to-rose-600",
                                                            pathname.startsWith("/tools") ? "ring-2 ring-pink-400/50 scale-105" : iconHover
                                                        )}
                                                        role="button"
                                                        aria-label="Tools"
                                                    >
                                                        <Hammer className="w-5 h-5 text-white pointer-events-none" strokeWidth={1.5} />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    side="top"
                                                    align="center"
                                                    className={cn(
                                                        "mb-2 min-w-[160px] p-1 backdrop-blur-xl rounded-xl shadow-2xl",
                                                        isDockDark
                                                            ? "bg-zinc-900/95 border-zinc-700/50 text-zinc-100"
                                                            : "bg-white/95 border-zinc-200/50 text-zinc-900"
                                                    )}
                                                >
                                                    <DropdownMenuItem asChild className={cn("rounded-lg cursor-pointer", isDockDark ? "focus:bg-zinc-800" : "focus:bg-zinc-100")}>
                                                        <Link href="/tools/x-preview" className="flex items-center gap-2 py-2 px-3">
                                                            <div className="w-5 h-5 rounded-md bg-[#5856D6] flex items-center justify-center">
                                                                <Sparkles className="w-3 h-3 text-white" />
                                                            </div>
                                                            <span className="text-sm font-medium">X Preview</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </DraggableIcon>
                                    );
                                default:
                                    return null;
                            }
                        })}
                    </Reorder.Group>
                </div>

                {/* Right Section - Dashboard (admin) + User */}
                <div className={cn("relative flex items-center gap-1 p-2 rounded-2xl border shadow-lg overflow-hidden", containerClass)}>
                    <PortugalTopo dark={isDockDark} className="opacity-50" />
                    {/* Dashboard - Admin Only */}
                    {isAdmin && (
                        <Link
                            href="/dashboard"
                            className={cn(
                                iconBase,
                                "relative z-10 bg-gradient-to-br from-amber-400 to-amber-600",
                                pathname === "/dashboard" ? "ring-2 ring-amber-400/50 scale-105" : iconHover
                            )}
                            aria-label="Dashboard"
                        >
                            <LayoutDashboard className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </Link>
                    )}

                    {/* User Avatar with Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    "relative z-10 flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 overflow-hidden",
                                    "ring-2 ring-transparent hover:ring-primary/30",
                                    iconHover
                                )}
                                aria-label="User menu"
                            >
                                {avatarUrl ? (
                                    <Image
                                        src={avatarUrl}
                                        alt={displayName}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <DefaultAvatar size={44} />
                                )}
                                {/* Online indicator */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-zinc-900 z-10" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side="top"
                            align="end"
                            className={cn(
                                "mb-2 w-56 p-1.5 backdrop-blur-xl rounded-xl shadow-2xl",
                                isDockDark
                                    ? "bg-zinc-900/95 border-zinc-700/50 text-zinc-100"
                                    : "bg-white/95 border-zinc-200/50 text-zinc-900"
                            )}
                        >
                            {/* User Header */}
                            <div className="flex items-center gap-3 px-2 py-2.5 mb-1">
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                    {avatarUrl ? (
                                        <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
                                    ) : (
                                        <DefaultAvatar size={40} className="rounded-lg" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{displayName}</p>
                                    {profile?.username && (
                                        <p className={cn("text-xs truncate", isDockDark ? "text-zinc-400" : "text-zinc-500")}>@{profile.username}</p>
                                    )}
                                </div>
                            </div>

                            <DropdownMenuSeparator className={cn("my-1", isDockDark ? "bg-zinc-700/50" : "bg-zinc-200/50")} />

                            {/* Profile */}
                            <DropdownMenuItem asChild className={cn("rounded-lg cursor-pointer", isDockDark ? "focus:bg-zinc-800" : "focus:bg-zinc-100")}>
                                <Link
                                    href={profile?.username ? `/u/${profile.username}` : "/onboarding"}
                                    className="flex items-center gap-2.5 py-2 px-2"
                                >
                                    <User className={cn("w-4 h-4", isDockDark ? "text-zinc-400" : "text-zinc-500")} strokeWidth={1.5} />
                                    <span className="text-sm">Profile</span>
                                </Link>
                            </DropdownMenuItem>

                            {/* Settings */}
                            <DropdownMenuItem asChild className={cn("rounded-lg cursor-pointer", isDockDark ? "focus:bg-zinc-800" : "focus:bg-zinc-100")}>
                                <Link
                                    href={profile?.username ? `/u/${profile.username}/settings` : "/onboarding"}
                                    className="flex items-center gap-2.5 py-2 px-2"
                                >
                                    <Settings className={cn("w-4 h-4", isDockDark ? "text-zinc-400" : "text-zinc-500")} strokeWidth={1.5} />
                                    <span className="text-sm">Settings</span>
                                </Link>
                            </DropdownMenuItem>

                            {/* Theme Toggle */}
                            <DropdownMenuItem
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className={cn("rounded-lg cursor-pointer", isDockDark ? "focus:bg-zinc-800" : "focus:bg-zinc-100")}
                            >
                                <div className="flex items-center gap-2.5 py-2 px-2">
                                    {theme === 'dark' ? (
                                        <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                                    ) : (
                                        <Moon className={cn("w-4 h-4", isDockDark ? "text-zinc-400" : "text-zinc-500")} strokeWidth={1.5} />
                                    )}
                                    <span className="text-sm">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className={cn("my-1", isDockDark ? "bg-zinc-700/50" : "bg-zinc-200/50")} />

                            {/* Logout */}
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="rounded-lg cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            >
                                <div className="flex items-center gap-2.5 py-2 px-2">
                                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                                    <span className="text-sm">Log out</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
