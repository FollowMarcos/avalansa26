"use client";

import { Home, Library, Sparkles, Beaker, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImagine } from "./imagine-context";

const NAV_ITEMS = [
    { icon: Home, id: 'home', label: 'Home' },
    { icon: Library, id: 'library', label: 'Library' },
    { icon: Sparkles, id: 'imagine', label: 'Imagine' },
    { icon: Beaker, id: 'labs', label: 'Labs' },
    { icon: User, id: 'profile', label: 'Profile' },
];

export function ImagineDock() {
    const { isInputVisible, toggleInputVisibility, activeTab, setActiveTab } = useImagine();

    const handleItemClick = (id: string) => {
        if (id === 'imagine') {
            toggleInputVisibility();
        } else {
            setActiveTab(id);
        }
    };

    return (
        <div className="flex items-center justify-center pointer-events-auto">
            <div className="flex items-center gap-1 p-1.5 rounded-full bg-background border shadow-xl backdrop-blur-2xl">
                {NAV_ITEMS.map((item) => {
                    const isImagine = item.id === 'imagine';
                    // Highlight if active tab OR if it's the imagine button and input is visible
                    const isActive = activeTab === item.id || (isImagine && isInputVisible);

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            className={cn(
                                "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                                isActive
                                    ? "bg-foreground text-background shadow-md scale-110"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {isActive && !isImagine && (
                                <span className="absolute -bottom-8 text-[10px] font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full border opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
                <div className="w-px h-6 bg-border mx-1" />
                <button className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
