"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
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
import type { DockIconPosition, UserRole, DockItem, DockDropdownItem } from "@/types/database";
import { getDockPreferences, saveDockPreferences } from "@/utils/supabase/dock-preferences.client";
import { getDockItems } from "@/utils/supabase/dock-items.client";
import { useTheme } from "next-themes";
import { PortugalTopo } from "./portugal-topo";
import { DefaultAvatar } from "@/components/ui/default-avatar";

// Default icons to fallback if DB is empty or during loading
const DEFAULT_ITEMS: DockItem[] = [
    { id: 'library', label: 'Library', icon: 'Library', href: '/library', order: 0, is_visible: true, created_at: '', updated_at: '' },
    { id: 'imagine', label: 'Imagine', icon: 'Sparkles', href: '/imagine', order: 1, is_visible: true, created_at: '', updated_at: '' },
    { id: 'labs', label: 'Labs', icon: 'FlaskConical', href: '/labs', order: 2, is_visible: true, created_at: '', updated_at: '' },
    { id: 'tools', label: 'Tools', icon: 'Hammer', href: '/tools', dropdown_items: [{ label: 'X Preview', href: '/tools/x-preview', icon: 'Sparkles' }], order: 3, is_visible: true, created_at: '', updated_at: '' },
];

interface UserProfile {
    username: string | null;
    name: string | null;
    avatar_url: string | null;
    role: UserRole;
}

// Helper to dynamically get icon component
const IconComponent = ({ name, className, strokeWidth }: { name: string; className?: string; strokeWidth?: number }) => {
    // @ts-ignore - Dynamic access to Lucide icons
    const Icon = LucideIcons[name] || LucideIcons.HelpCircle;
    return <Icon className={className} strokeWidth={strokeWidth} />;
};

export function SiteDock() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { isInputVisible, toggleInputVisibility, setActiveTab } = useImagine();
    const [profile, setProfile] = React.useState<UserProfile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
    const [items, setItems] = React.useState<DockItem[]>(DEFAULT_ITEMS);
    const [isDragging, setIsDragging] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const [isInitialLoading, setIsInitialLoading] = React.useState(true);

    // Handle hydration mismatch for theme
    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        async function fetchProfileAndPreferences() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            // Load available dock items from DB (available to guests too)
            const dbItems = await getDockItems();
            const availableItems = dbItems.length > 0 ? dbItems : DEFAULT_ITEMS;

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

                // Filter items based on role visibility
                const authorizedItems = availableItems.filter(item => {
                    if (!item.is_visible) return false;
                    if (item.required_role && item.required_role !== profileData?.role) return false;
                    return true;
                });

                // Load user preferences for order
                const prefs = await getDockPreferences();
                if (prefs && prefs.icon_positions && prefs.icon_positions.length > 0) {
                    const sortedItems = [...authorizedItems].sort((a, b) => {
                        const posA = prefs.icon_positions.find(p => p.id === a.id);
                        const posB = prefs.icon_positions.find(p => p.id === b.id);
                        const orderA = posA ? posA.order : 999 + a.order;
                        const orderB = posB ? posB.order : 999 + b.order;
                        return orderA - orderB;
                    });
                    setItems(sortedItems);
                } else {
                    setItems(authorizedItems);
                }
            } else {
                setIsAuthenticated(false);
                // For guests, only show items with no required role
                const guestItems = availableItems.filter(item => !item.required_role && item.is_visible);
                setItems(guestItems);
            }
            setIsInitialLoading(false);
        }
        fetchProfileAndPreferences();
    }, []);

    const handleReorder = (newItems: DockItem[]) => {
        setItems(newItems);
        if (isAuthenticated) {
            const positions: DockIconPosition[] = newItems.map((item, index) => ({
                id: item.id,
                order: index
            }));
            saveDockPreferences({ icon_positions: positions });
        }
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

    // Before hydration, render nothing to avoid mismatch
    if (!mounted) return null;

    // Hide dock on imagine page during input boards
    if (isInputVisible && isImaginePage) return null;

    const containerClass = isDockDark
        ? "bg-zinc-900 border-zinc-700/50"
        : "bg-white border-zinc-200/50";

    const displayName = profile?.name || profile?.username || 'User';
    const avatarUrl = profile?.avatar_url;

    // Draggable icon component
    const DraggableIcon = ({ item, children }: { item: DockItem; children: React.ReactNode }) => (
        <Reorder.Item
            value={item}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
            whileDrag={{ scale: 1.15, zIndex: 100 }}
            className="cursor-grab active:cursor-grabbing"
            key={item.id}
        >
            {children}
        </Reorder.Item>
    );

    // Base icon styles
    const iconBase = "relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 shadow-md";
    const iconHover = "hover:scale-105 hover:shadow-lg active:scale-95";

    // Helper to determine style based on item id (keeping legacy styles for specific items if needed)
    const getItemStyle = (id: string, path: string) => {
        if (id === 'library') {
            return cn(
                iconBase,
                "bg-gradient-to-br from-blue-400 to-blue-600",
                pathname === path ? "ring-2 ring-blue-400/50 scale-105" : iconHover
            );
        }
        if (id === 'imagine') {
            return cn(
                iconBase,
                "bg-gradient-to-br from-[#5856D6] to-[#AF52DE]",
                pathname === path ? "ring-2 ring-purple-400/50 scale-105" : iconHover
            );
        }
        if (id === 'labs') {
            return cn(
                iconBase,
                "bg-gradient-to-br from-orange-400 to-orange-600",
                pathname === path ? "ring-2 ring-orange-400/50 scale-105" : iconHover
            );
        }
        // Default for dynamic items
        return cn(
            iconBase,
            "bg-gradient-to-br from-zinc-500 to-zinc-700",
            pathname.startsWith(path) ? "ring-2 ring-zinc-400/50 scale-105" : iconHover
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center justify-center pointer-events-auto"
        >
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
                        {items.map((item) => {
                            // Special case for Imagine to handle overlay
                            if (item.id === 'imagine') {
                                return (
                                    <DraggableIcon key={item.id} item={item}>
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
                                                className={getItemStyle(item.id, item.href || '/imagine')}
                                                role="button"
                                                aria-label={item.label}
                                            >
                                                <IconComponent name={item.icon} className="w-5 h-5 text-white pointer-events-none" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    </DraggableIcon>
                                );
                            }

                            // Items with dropdowns
                            if (item.dropdown_items && item.dropdown_items.length > 0) {
                                return (
                                    <DraggableIcon key={item.id} item={item}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild disabled={isDragging}>
                                                <div
                                                    className={getItemStyle(item.id, item.href || '/')}
                                                    role="button"
                                                    aria-label={item.label}
                                                >
                                                    <IconComponent name={item.icon} className="w-5 h-5 text-white pointer-events-none" strokeWidth={1.5} />
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
                                                {item.dropdown_items.map((dropdownItem, idx) => (
                                                    <DropdownMenuItem key={idx} asChild className={cn("rounded-lg cursor-pointer", isDockDark ? "focus:bg-zinc-800" : "focus:bg-zinc-100")}>
                                                        <Link href={dropdownItem.href} className="flex items-center gap-2 py-2 px-3">
                                                            {dropdownItem.icon ? (
                                                                <div className="w-5 h-5 rounded-md bg-opacity-20 flex items-center justify-center bg-primary/20 text-primary">
                                                                    <IconComponent name={dropdownItem.icon} className="w-3 h-3" />
                                                                </div>
                                                            ) : null}
                                                            <span className="text-sm font-medium">{dropdownItem.label}</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </DraggableIcon>
                                )
                            }

                            // Standard Link Items
                            return (
                                <DraggableIcon key={item.id} item={item}>
                                    <div
                                        onClick={() => handleNavigation(item.href || '/')}
                                        className={getItemStyle(item.id, item.href || '/')}
                                        role="button"
                                        aria-label={item.label}
                                    >
                                        <IconComponent name={item.icon} className="w-5 h-5 text-white pointer-events-none" strokeWidth={1.5} />
                                    </div>
                                </DraggableIcon>
                            );
                        })}
                    </Reorder.Group>
                </div>

                {/* Right Section - Dashboard (admin) + User */}
                <div className={cn("relative flex items-center gap-1 p-2 rounded-2xl border shadow-lg overflow-hidden h-14", containerClass)}>
                    <PortugalTopo dark={isDockDark} className="opacity-50" />

                    {isAuthenticated === null ? (
                        <div className="w-11 h-11 flex items-center justify-center">
                            <LucideIcons.Loader2 className="w-5 h-5 animate-spin opacity-20" />
                        </div>
                    ) : isAuthenticated === false ? (
                        <Link
                            href="/onboarding"
                            className={cn(
                                "relative z-10 px-4 h-10 flex items-center justify-center rounded-xl font-medium transition-all duration-200",
                                isDockDark ? "bg-white text-zinc-900" : "bg-zinc-900 text-white",
                                "hover:scale-105 active:scale-95"
                            )}
                        >
                            Get Started
                        </Link>
                    ) : (
                        <div className="flex items-center gap-1">
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
                                    <LucideIcons.LayoutDashboard className="w-5 h-5 text-white" strokeWidth={1.5} />
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
                                            <LucideIcons.User className={cn("w-4 h-4", isDockDark ? "text-zinc-400" : "text-zinc-500")} strokeWidth={1.5} />
                                            <span className="text-sm">Profile</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    {/* Settings */}
                                    <DropdownMenuItem asChild className={cn("rounded-lg cursor-pointer", isDockDark ? "focus:bg-zinc-800" : "focus:bg-zinc-100")}>
                                        <Link
                                            href={profile?.username ? `/u/${profile.username}/settings` : "/onboarding"}
                                            className="flex items-center gap-2.5 py-2 px-2"
                                        >
                                            <LucideIcons.Settings className={cn("w-4 h-4", isDockDark ? "text-zinc-400" : "text-zinc-500")} strokeWidth={1.5} />
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
                                                <LucideIcons.Sun className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                                            ) : (
                                                <LucideIcons.Moon className={cn("w-4 h-4", isDockDark ? "text-zinc-400" : "text-zinc-500")} strokeWidth={1.5} />
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
                                            <LucideIcons.LogOut className="w-4 h-4" strokeWidth={1.5} />
                                            <span className="text-sm">Log out</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
