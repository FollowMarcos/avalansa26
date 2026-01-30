"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Library, Sparkles, FlaskConical, Settings, User, ExternalLink, Hammer, LayoutDashboard, LogOut, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImagine } from "@/components/imagine/imagine-context";
import { createClient } from "@/utils/supabase/client";
import { motion, Reorder } from "motion/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DockType, DockIconPosition, UserRole } from "@/types/database";
import { getDockPreferences, saveDockPreferences } from "@/utils/supabase/dock-preferences.client";

// Draggable items config (Home, Dashboard, and User Avatar are fixed)
const DRAGGABLE_DOCK_ITEMS = ['library', 'imagine', 'labs', 'tools'] as const;
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

interface UserProfile {
    username: string | null;
    name: string | null;
    avatar_url: string | null;
    role: UserRole;
}

export function SiteDock() {
    const pathname = usePathname();
    const router = useRouter();
    const { isInputVisible, toggleInputVisibility, setActiveTab } = useImagine();
    const [profile, setProfile] = React.useState<UserProfile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
    const [dockType, setDockType] = React.useState<DockType>('milky_dream_light');
    const [items, setItems] = React.useState<DockItemId[]>([...DRAGGABLE_DOCK_ITEMS]);

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
                    if (prefs.dock_type) {
                        setDockType(prefs.dock_type);
                    }
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
    const isDark = dockType.includes('dark');
    const isFloating = dockType.includes('floating');
    const isAdmin = profile?.role === 'admin';

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

    // Helper to render specific items by ID - returns both the visual element and its click handler
    const renderDockItem = (id: DockItemId) => {
        const baseIconClass = "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg";

        switch (id) {
            case 'library':
                return (
                    <div
                        onClick={() => router.push('/library')}
                        className={cn(
                            baseIconClass,
                            "bg-gradient-to-br from-blue-400 to-blue-600 cursor-pointer",
                            pathname === "/library" ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                        )}
                        role="link"
                        aria-label="Library"
                    >
                        <Library className="w-6 h-6 text-white pointer-events-none" strokeWidth={1.5} />
                    </div>
                );
            case 'imagine':
                return (
                    <div className="relative group/imagine">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5856D6] to-[#AF52DE] blur-md opacity-40 group-hover/imagine:opacity-80 transition-opacity rounded-[12px] pointer-events-none" />
                        <div
                            onClick={(e) => {
                                if (isImaginePage) {
                                    toggleInputVisibility();
                                } else {
                                    setActiveTab("imagine");
                                    router.push('/imagine');
                                }
                            }}
                            className={cn(
                                baseIconClass,
                                "bg-gradient-to-br from-[#5856D6] to-[#AF52DE] cursor-pointer",
                                pathname === "/imagine" ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                            )}
                            role="link"
                            aria-label="Imagine"
                        >
                            <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 rounded-[12px] pointer-events-none"
                            />
                            <Sparkles className="w-6 h-6 text-white relative z-10 pointer-events-none" strokeWidth={1.5} />
                        </div>
                    </div>
                );
            case 'labs':
                return (
                    <div
                        onClick={() => router.push('/labs')}
                        className={cn(
                            baseIconClass,
                            "bg-gradient-to-br from-orange-400 to-orange-600 cursor-pointer",
                            pathname === "/labs" ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                        )}
                        role="link"
                        aria-label="Labs"
                    >
                        <FlaskConical className="w-6 h-6 text-white pointer-events-none" strokeWidth={1.5} />
                    </div>
                );
            case 'tools':
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div
                                className={cn(
                                    baseIconClass,
                                    "bg-gradient-to-br from-pink-500 to-rose-600 cursor-pointer",
                                    pathname.startsWith("/tools") ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                                )}
                                role="button"
                                aria-label="Tools"
                            >
                                <Hammer className="w-6 h-6 text-white pointer-events-none" strokeWidth={1.5} />
                            </div>
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
            default:
                return null;
        }
    };

    const containerClass = isFloating
        ? isDark ? "bg-zinc-900/90 border-zinc-700/50" : "bg-white/90 border-zinc-200/50"
        : isDark ? "bg-[#111111]" : "bg-gradient-to-br from-[#fefefe] via-[#f8f8f8] to-[#fefefe]";

    const wrapperClass = isFloating
        ? "flex items-center gap-2 p-3 rounded-2xl backdrop-blur-xl border shadow-lg"
        : "relative flex items-center gap-2 p-3 rounded-[20px] overflow-hidden shadow-2xl";

    // Display name for the user
    const displayName = profile?.name || profile?.username || 'User';
    const avatarUrl = profile?.avatar_url;

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

                    {/* Separator 1 */}
                    <div className={cn("w-px h-10 mx-1", isDark ? "bg-zinc-700/50" : "bg-gray-200/50")} />

                    {/* Draggable Zone */}
                    <Reorder.Group axis="x" values={items} onReorder={handleReorder} className="flex items-center gap-2">
                        {items.map((id) => (
                            <Reorder.Item
                                key={id}
                                value={id}
                                className="cursor-grab active:cursor-grabbing"
                                whileDrag={{ scale: 1.1, zIndex: 50 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                {renderDockItem(id)}
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    {/* Separator 2 */}
                    <div className={cn("w-px h-10 mx-1", isDark ? "bg-zinc-700/50" : "bg-gray-200/50")} />

                    {/* Fixed End Group */}
                    <div className="flex items-center gap-2">
                        {/* Dashboard - Admin Only */}
                        {isAdmin && (
                            <Link
                                href="/dashboard"
                                className={cn(
                                    "relative flex items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 shadow-lg bg-gradient-to-br from-amber-400 to-amber-600",
                                    pathname === "/dashboard" ? "scale-110 shadow-xl" : "hover:scale-105 active:scale-95"
                                )}
                                aria-label="Dashboard"
                            >
                                <LayoutDashboard className="w-6 h-6 text-white" strokeWidth={1.5} />
                            </Link>
                        )}

                        {/* User Avatar with Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "relative flex items-center gap-2 h-12 pl-2 pr-3 rounded-[12px] transition-all duration-300 shadow-lg",
                                        "bg-gradient-to-br from-green-400 to-green-600",
                                        "hover:scale-105 active:scale-95"
                                    )}
                                    aria-label="User menu"
                                >
                                    {/* Avatar */}
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                                        {avatarUrl ? (
                                            <Image
                                                src={avatarUrl}
                                                alt={displayName}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <User className="w-4 h-4 text-white" strokeWidth={1.5} />
                                        )}
                                    </div>
                                    {/* Username */}
                                    <span className="text-sm font-medium text-white max-w-[80px] truncate">
                                        {displayName}
                                    </span>
                                    <ChevronUp className="w-3.5 h-3.5 text-white/70" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="end"
                                className="mb-2 min-w-[200px] p-1.5 bg-background/80 backdrop-blur-3xl border-border rounded-2xl shadow-2xl"
                            >
                                {/* User Info Header */}
                                <div className="px-3 py-2 mb-1">
                                    <p className="text-sm font-medium truncate">{displayName}</p>
                                    {profile?.username && (
                                        <p className="text-xs text-muted-foreground">@{profile.username}</p>
                                    )}
                                </div>
                                <DropdownMenuSeparator />

                                {/* Profile Link */}
                                <DropdownMenuItem asChild className="rounded-[12px] cursor-pointer focus:bg-primary/10">
                                    <Link
                                        href={profile?.username ? `/u/${profile.username}` : "/onboarding"}
                                        className="flex items-center gap-2.5 py-2 px-3"
                                    >
                                        <div className="w-6 h-6 rounded-[7px] bg-green-500 flex items-center justify-center shadow-sm">
                                            <User className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="font-medium">Profile</span>
                                    </Link>
                                </DropdownMenuItem>

                                {/* Settings Link */}
                                <DropdownMenuItem asChild className="rounded-[12px] cursor-pointer focus:bg-primary/10">
                                    <Link
                                        href={profile?.username ? `/u/${profile.username}/settings` : "/onboarding"}
                                        className="flex items-center gap-2.5 py-2 px-3"
                                    >
                                        <div className="w-6 h-6 rounded-[7px] bg-gray-500 flex items-center justify-center shadow-sm">
                                            <Settings className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="font-medium">Settings</span>
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {/* Logout */}
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="rounded-[12px] cursor-pointer focus:bg-red-500/10 text-red-500 focus:text-red-500"
                                >
                                    <div className="flex items-center gap-2.5 py-2 px-3">
                                        <div className="w-6 h-6 rounded-[7px] bg-red-500 flex items-center justify-center shadow-sm">
                                            <LogOut className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="font-medium">Log out</span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
}
