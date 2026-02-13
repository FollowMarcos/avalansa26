"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreate } from "@/components/create/create-context";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { PortugalTopo } from "./portugal-topo";
import { DefaultAvatar } from "@/components/ui/default-avatar";

// Default icons to fallback if DB is empty or during loading
const DEFAULT_ITEMS: DockItem[] = [
    { id: 'library', label: 'Library', icon: 'Library', href: '/library', order: 0, is_visible: true, created_at: '', updated_at: '', bg_color: 'bg-gradient-to-br from-blue-400 to-blue-600', text_color: 'text-white' },
    { id: 'create', label: 'Create', icon: 'Sparkles', href: '/create', order: 1, is_visible: true, created_at: '', updated_at: '', bg_color: 'bg-gradient-to-br from-[#5856D6] to-[#AF52DE]', text_color: 'text-white' },
    { id: 'labs', label: 'Labs', icon: 'FlaskConical', href: '/labs', order: 2, is_visible: true, created_at: '', updated_at: '', bg_color: 'bg-gradient-to-br from-orange-400 to-orange-600', text_color: 'text-white' },
    { id: 'tools', label: 'Tools', icon: 'Hammer', href: '/tools', dropdown_items: [{ label: 'X Multi-Image', href: '/tools/x-multi-image-preview-and-split', icon: 'Sparkles' }], order: 3, is_visible: true, created_at: '', updated_at: '', bg_color: 'bg-zinc-100 dark:bg-zinc-800', text_color: 'text-zinc-900 dark:text-zinc-100' },
    { id: 'assets', label: 'Assets', icon: 'Images', href: '/assets', order: 4, is_visible: true, created_at: '', updated_at: '', bg_color: 'bg-gradient-to-br from-emerald-400 to-emerald-600', text_color: 'text-white' },
];

interface UserProfile {
    username: string | null;
    name: string | null;
    avatar_url: string | null;
    role: UserRole;
}

import { IconDisplay } from "@/components/ui/icon-display";

// Helper to dynamically get icon component
const IconComponent = ({ name, className, strokeWidth }: { name: string; className?: string; strokeWidth?: number }) => {
    return <IconDisplay name={name} className={className} strokeWidth={strokeWidth} />;
};

interface DraggableIconProps {
    item: DockItem;
    children: React.ReactNode;
    isDragging: boolean;
    onDragStart: () => void;
    onDragEnd: () => void;
}

// Draggable icon component - Moved outside to prevent remounting on parent re-renders
const DraggableIcon = ({ item, children, onDragStart, onDragEnd }: DraggableIconProps) => (
    <Reorder.Item
        value={item}
        id={item.id}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        whileDrag={{ scale: 1.15, zIndex: 100 }}
        dragListener={true}
        style={{ touchAction: 'none' }}
        className="cursor-grab active:cursor-grabbing select-none"
    >
        {children}
    </Reorder.Item>
);

interface SiteDockProps {
    vertical?: boolean;
}

export function SiteDock({ vertical = false }: SiteDockProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { isInputVisible, toggleInputVisibility, setActiveTab, dockCollapsed, setDockCollapsed } = useCreate();
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
                // For guests, we don't show the dock at all anymore, so no need to set items
                setItems([]);
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

    const isCreatePage = pathname === "/create";
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

    // Hide dock on create page during input boards, or for logged out users/loading
    if ((isInputVisible && isCreatePage) || !isAuthenticated) return null;

    // Collapsed dock on create page — show minimal expand button
    if (isCreatePage && dockCollapsed) {
        return (
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="pointer-events-auto"
            >
                <button
                    type="button"
                    onClick={() => setDockCollapsed(false)}
                    className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-xl border shadow-lg transition-[transform,box-shadow,opacity] duration-200",
                        "hover:scale-105 hover:shadow-xl active:scale-95",
                        isDockDark
                            ? "bg-zinc-900/80 backdrop-blur-xl border-zinc-700/50 text-zinc-400 hover:text-zinc-200"
                            : "bg-white/80 backdrop-blur-xl border-zinc-200/50 text-zinc-500 hover:text-zinc-900"
                    )}
                    aria-label="Expand dock"
                >
                    <LucideIcons.ChevronsRight className="size-4" strokeWidth={1.5} />
                </button>
            </motion.div>
        );
    }

    const onDragStart = () => setIsDragging(true);
    const onDragEnd = () => setTimeout(() => setIsDragging(false), 100);

    const containerClass = isDockDark
        ? "bg-zinc-900/80 backdrop-blur-xl border-zinc-700/50"
        : "bg-white/80 backdrop-blur-xl border-zinc-200/50";

    const displayName = profile?.name || profile?.username || 'User';
    const avatarUrl = profile?.avatar_url;

    // Base icon styles
    const iconBase = "relative flex items-center justify-center w-11 h-11 rounded-xl transition-[transform,box-shadow,opacity] duration-200 shadow-md";
    const iconHover = "hover:scale-105 hover:shadow-lg active:scale-95";

    // Helper to determine style based on item properties
    const getItemStyle = (item: DockItem) => {
        const path = item.href || '/';
        const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));

        return cn(
            iconBase,
            item.bg_color || "bg-gradient-to-br from-zinc-500 to-zinc-700",
            item.text_color || "text-white",
            isActive ? "ring-2 ring-primary/50 scale-105" : iconHover
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: vertical ? -20 : 0, y: vertical ? 0 : 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
                "flex justify-center pointer-events-auto",
                vertical ? "flex-col items-center" : "items-center"
            )}
        >
            <div className={cn("flex gap-2", vertical ? "flex-col" : "items-center")}>
                {/* Home Button - Fixed */}
                <Link
                    href="/"
                    className={cn(
                        "relative flex items-center justify-center w-14 h-14 rounded-2xl border shadow-lg overflow-hidden transition-[transform,box-shadow,opacity] duration-200",
                        containerClass,
                        pathname === "/" ? "ring-2 ring-primary/50 scale-105" : "hover:scale-105 hover:shadow-xl active:scale-95"
                    )}
                    aria-label="Home"
                >
                    <PortugalTopo dark={isDockDark} className="opacity-50" />
                    <div className="relative z-10 w-7 h-7">
                        <Image src={isDockDark ? "/aw.svg" : "/ab.svg"} alt="Avalansa Logo" fill className="object-contain" />
                    </div>
                </Link>

                {/* Main Nav - Draggable */}
                <div className={cn(
                    "relative flex p-1.5 rounded-2xl border shadow-lg",
                    vertical ? "flex-col w-14" : "items-center h-14",
                    containerClass
                )}>
                    <PortugalTopo dark={isDockDark} className="opacity-50 rounded-2xl pointer-events-none" />
                    <TooltipProvider delayDuration={300}>
                    <Reorder.Group
                        axis={vertical ? "y" : "x"}
                        values={items}
                        onReorder={handleReorder}
                        className={cn(
                            "relative z-10 flex gap-1.5",
                            vertical ? "flex-col items-center" : "items-center"
                        )}
                        style={{ touchAction: vertical ? 'pan-x' : 'pan-y' }}
                    >
                        {items.map((item) => {
                            // Special case for Create to handle overlay
                            if (item.id === 'create') {
                                return (
                                    <DraggableIcon
                                        key={item.id}
                                        item={item}
                                        isDragging={isDragging}
                                        onDragStart={onDragStart}
                                        onDragEnd={onDragEnd}
                                    >
                                        <div className="relative group/create">
                                            <div className="absolute -inset-1 bg-gradient-to-br from-[#5856D6] to-[#AF52DE] blur-lg opacity-0 group-hover/create:opacity-60 transition-opacity rounded-xl pointer-events-none" />
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => {
                                                            if (isDragging) return;
                                                            if (isCreatePage) {
                                                                toggleInputVisibility();
                                                            } else {
                                                                setActiveTab("create");
                                                                router.push('/create');
                                                            }
                                                        }}
                                                        className={cn(getItemStyle(item), "cursor-pointer")}
                                                        aria-label={item.label}
                                                    >
                                                        <IconComponent name={item.icon} className={cn("w-5 h-5 pointer-events-none", item.text_color || "text-white")} strokeWidth={1.5} aria-hidden="true" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side={vertical ? "right" : "top"} sideOffset={8}>{item.label}</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </DraggableIcon>
                                );
                            }

                            // Items with dropdowns
                            if (item.dropdown_items && item.dropdown_items.length > 0) {
                                return (
                                    <DraggableIcon
                                        key={item.id}
                                        item={item}
                                        isDragging={isDragging}
                                        onDragStart={onDragStart}
                                        onDragEnd={onDragEnd}
                                    >
                                        <DropdownMenu>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <DropdownMenuTrigger asChild disabled={isDragging}>
                                                        <button
                                                            className={cn(getItemStyle(item), "cursor-pointer")}
                                                            aria-label={item.label}
                                                        >
                                                            <IconComponent name={item.icon} className={cn("w-5 h-5 pointer-events-none", item.text_color || "text-white")} strokeWidth={1.5} aria-hidden="true" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent side={vertical ? "right" : "top"} sideOffset={8}>{item.label}</TooltipContent>
                                            </Tooltip>
                                            <DropdownMenuContent
                                                side={vertical ? "right" : "top"}
                                                align="center"
                                                className={cn(
                                                    "min-w-[160px] p-1 backdrop-blur-xl rounded-xl shadow-2xl",
                                                    vertical ? "ml-2" : "mb-2",
                                                    isDockDark
                                                        ? "bg-zinc-900/95 border-zinc-700/50 text-zinc-100"
                                                        : "bg-white/95 border-zinc-200/50 text-zinc-900"
                                                )}
                                            >
                                                {item.dropdown_items.map((dropdownItem, idx) => (
                                                    <DropdownMenuItem key={idx} asChild className={cn("rounded-lg cursor-pointer group", isDockDark ? "focus:bg-white focus:text-zinc-900" : "focus:bg-zinc-900 focus:text-white")}>
                                                        <Link href={dropdownItem.href} className="flex items-center gap-2.5 py-2 px-2.5">
                                                            {dropdownItem.icon ? (
                                                                <div className={cn("w-5 h-5 rounded-md flex items-center justify-center transition-colors", isDockDark ? "bg-zinc-800 text-amber-400 group-focus:bg-zinc-100 group-focus:text-amber-600" : "bg-zinc-100 text-amber-500 group-focus:bg-zinc-800")}>
                                                                    <IconComponent name={dropdownItem.icon} className="w-3.5 h-3.5" />
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
                                <DraggableIcon
                                    key={item.id}
                                    item={item}
                                    isDragging={isDragging}
                                    onDragStart={onDragStart}
                                    onDragEnd={onDragEnd}
                                >
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => handleNavigation(item.href || '/')}
                                                className={cn(getItemStyle(item), "cursor-pointer")}
                                                aria-label={item.label}
                                            >
                                                <IconComponent name={item.icon} className={cn("w-5 h-5 pointer-events-none", item.text_color || "text-white")} strokeWidth={1.5} aria-hidden="true" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side={vertical ? "right" : "top"} sideOffset={8}>{item.label}</TooltipContent>
                                    </Tooltip>
                                </DraggableIcon>
                            );
                        })}
                    </Reorder.Group>
                    </TooltipProvider>
                </div>

                {/* User Section */}
                <div className={cn(
                    "relative flex gap-1.5 p-1.5 rounded-2xl border shadow-lg overflow-hidden",
                    vertical ? "flex-col w-14" : "items-center h-14",
                    containerClass
                )}>
                    <PortugalTopo dark={isDockDark} className="opacity-50" />

                    <div className="flex items-center gap-1">
                        {/* User Avatar with Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "relative z-10 flex items-center justify-center w-11 h-11 rounded-xl transition-[transform,box-shadow,opacity] duration-200 overflow-hidden",
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
                                side={vertical ? "right" : "top"}
                                align={vertical ? "center" : "end"}
                                className={cn(
                                    "w-60 p-1.5 backdrop-blur-xl rounded-xl shadow-2xl",
                                    vertical ? "ml-2" : "mb-2",
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

                                {/* Dashboard - Admin Only */}
                                {isAdmin && (
                                    <DropdownMenuItem asChild className={cn("rounded-lg cursor-pointer group", isDockDark ? "focus:bg-white focus:text-zinc-900" : "focus:bg-zinc-900 focus:text-white")}>
                                        <Link href="/dashboard" className="flex items-center gap-2.5 py-2 px-2.5">
                                            <LucideIcons.LayoutDashboard className={cn("w-4 h-4 transition-colors", isDockDark ? "text-amber-400 group-focus:text-zinc-900" : "text-amber-500 group-focus:text-white")} strokeWidth={1.5} />
                                            <span className="text-sm font-medium">Admin Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}

                                {/* Profile */}
                                <DropdownMenuItem asChild className={cn("rounded-lg cursor-pointer group", isDockDark ? "focus:bg-white focus:text-zinc-900" : "focus:bg-zinc-900 focus:text-white")}>
                                    <Link
                                        href={profile?.username ? `/u/${profile.username}` : "/onboarding"}
                                        className="flex items-center gap-2.5 py-2 px-2.5"
                                    >
                                        <LucideIcons.User className={cn("w-4 h-4 transition-colors", isDockDark ? "text-zinc-400 group-focus:text-zinc-900" : "text-zinc-500 group-focus:text-white")} strokeWidth={1.5} />
                                        <span className="text-sm font-medium">Profile</span>
                                    </Link>
                                </DropdownMenuItem>

                                {/* Settings */}
                                <DropdownMenuItem asChild className={cn("rounded-lg cursor-pointer group", isDockDark ? "focus:bg-white focus:text-zinc-900" : "focus:bg-zinc-900 focus:text-white")}>
                                    <Link
                                        href={profile?.username ? `/u/${profile.username}/settings` : "/onboarding"}
                                        className="flex items-center gap-2.5 py-2 px-2.5"
                                    >
                                        <LucideIcons.Settings className={cn("w-4 h-4 transition-colors", isDockDark ? "text-zinc-400 group-focus:text-zinc-900" : "text-zinc-500 group-focus:text-white")} strokeWidth={1.5} />
                                        <span className="text-sm font-medium">Settings</span>
                                    </Link>
                                </DropdownMenuItem>

                                {/* Theme Toggle */}
                                <DropdownMenuItem
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className={cn(
                                        "rounded-lg cursor-pointer group p-0",
                                        isDockDark ? "focus:bg-white focus:text-zinc-900" : "focus:bg-zinc-900 focus:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 py-2 px-2.5 w-full">
                                        {theme === 'dark' ? (
                                            <LucideIcons.Sun className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                                        ) : (
                                            <LucideIcons.Moon className={cn("w-4 h-4 transition-colors", isDockDark ? "text-zinc-400 group-focus:text-zinc-900" : "text-zinc-500 group-focus:text-white")} strokeWidth={1.5} />
                                        )}
                                        <span className="text-sm font-medium">
                                            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                                        </span>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className={cn("my-1", isDockDark ? "bg-zinc-700/50" : "bg-zinc-200/50")} />

                                {/* Logout */}
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="rounded-lg cursor-pointer text-red-500 focus:text-white focus:bg-red-500 transition-colors group"
                                >
                                    <div className="flex items-center gap-2.5 py-2 px-2.5">
                                        <LucideIcons.LogOut className="w-4 h-4 transition-colors group-focus:text-white" strokeWidth={1.5} />
                                        <span className="text-sm font-medium">Log out</span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Collapse button — only on Create page */}
                {isCreatePage && vertical && (
                    <button
                        type="button"
                        onClick={() => setDockCollapsed(true)}
                        className={cn(
                            "flex items-center justify-center w-10 h-7 rounded-xl border shadow-md transition-[transform,box-shadow,opacity] duration-200",
                            "hover:scale-105 active:scale-95",
                            isDockDark
                                ? "bg-zinc-900/80 backdrop-blur-xl border-zinc-700/50 text-zinc-400 hover:text-zinc-200"
                                : "bg-white/80 backdrop-blur-xl border-zinc-200/50 text-zinc-500 hover:text-zinc-900"
                        )}
                        aria-label="Collapse dock"
                    >
                        <LucideIcons.ChevronsLeft className="size-4" strokeWidth={1.5} />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
