import * as React from "react";
import * as LucideIcons from "lucide-react";
import * as HugeIcons from "@hugeicons/react";
import * as FaIcons from "react-icons/fa6";
import * as SiIcons from "react-icons/si";
import { cn } from "@/lib/utils";

interface IconDisplayProps extends React.ComponentProps<"svg"> {
    name: string | undefined;
    className?: string;
}

export function IconDisplay({ name, className, ...props }: IconDisplayProps) {
    if (!name) return null;

    let Icon: React.ComponentType<{ className?: string }> | null = null;

    // Determine provider
    if (name.startsWith("hugeicons:")) {
        const iconName = name.replace("hugeicons:", "");
        // @ts-ignore
        Icon = HugeIcons[iconName];
    } else if (name.startsWith("fa:")) {
        const iconName = name.replace("fa:", "");
        // @ts-ignore
        Icon = FaIcons[iconName];
    } else if (name.startsWith("si:")) {
        const iconName = name.replace("si:", "");
        // @ts-ignore
        Icon = SiIcons[iconName];
    } else {
        // Default to Lucide
        // @ts-ignore
        Icon = LucideIcons[name];
    }

    // Safety fallback
    if (!Icon) {
        // Render a placeholder or return null
        // For dock items, a fallback icon is better than nothing
        return <LucideIcons.HelpCircle className={cn("w-6 h-6 opacity-50", className)} {...props} />;
    }

    try {
        return <Icon className={cn("w-6 h-6", className)} {...props} />;
    } catch (e) {
        console.error(`Failed to render icon: ${name}`, e);
        return <LucideIcons.AlertCircle className={cn("w-6 h-6 text-destructive", className)} {...props} />;
    }
}
