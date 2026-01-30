import * as React from "react";
import * as LucideIcons from "lucide-react";
import * as HugeIcons from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface IconDisplayProps extends React.ComponentProps<"svg"> {
    name: string;
    className?: string;
}

export function IconDisplay({ name, className, ...props }: IconDisplayProps) {
    // Determine provider and icon name
    const isHugeIcon = name.startsWith("hugeicons:");
    const iconName = isHugeIcon ? name.replace("hugeicons:", "") : name;

    if (isHugeIcon) {
        // HugeIcons
        // @ts-ignore
        const Icon = HugeIcons[iconName] || HugeIcons.HelpCircleIcon;
        return <Icon className={cn("w-6 h-6", className)} {...props} />;
    } else {
        // Lucide (Default)
        // @ts-ignore
        const Icon = LucideIcons[iconName] || LucideIcons.HelpCircle;
        return <Icon className={cn("w-6 h-6", className)} {...props} />;
    }
}
