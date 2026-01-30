"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Library, Sparkles, Beaker, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImagine } from "@/components/imagine/imagine-context";

const NAV_ITEMS = [
    { icon: Home, id: "home", label: "Home", href: "/" },
    { icon: Library, id: "library", label: "Library", href: "/library" },
    { icon: Sparkles, id: "imagine", label: "Imagine", href: "/imagine" },
    { icon: Beaker, id: "labs", label: "Labs", href: "/labs" },
    { icon: User, id: "profile", label: "Profile", href: "/profile" },
];

export function SiteDock() {
    const pathname = usePathname();
    const router = useRouter();
    const { isInputVisible, toggleInputVisibility, setActiveTab } = useImagine();

    // On the imagine page, we have special behavior for the sparkles button
    const isImaginePage = pathname === "/imagine";

    const handleItemClick = (e: React.MouseEvent, item: typeof NAV_ITEMS[0]) => {
        if (item.id === "imagine" && isImaginePage) {
            e.preventDefault();
            toggleInputVisibility();
        } else if (item.id === "imagine") {
            // Just let the Link handle it or manually push
            setActiveTab("imagine");
        }
    };

    if (isInputVisible && isImaginePage) return null;

    return (
        <div className="flex items-center justify-center pointer-events-auto">
            <div className="flex items-center gap-1 p-1.5 rounded-full bg-background/80 border border-border shadow-xl backdrop-blur-2xl">
                {NAV_ITEMS.map((item) => {
                    const isImagine = item.id === "imagine";
                    const isActive = pathname === item.href || (isImagine && isImaginePage && isInputVisible);

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={(e) => handleItemClick(e, item)}
                            className={cn(
                                "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group",
                                isActive
                                    ? "bg-foreground text-background shadow-md scale-110"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                            aria-label={item.label}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="absolute -bottom-10 text-[10px] font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full border opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
                <div className="w-px h-6 bg-border mx-1" />
                <button className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group relative">
                    <Settings className="w-5 h-5" />
                    <span className="absolute -bottom-10 text-[10px] font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full border opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                        Settings
                    </span>
                </button>
            </div>
        </div>
    );
}
