'use client';

import { cn } from '@/lib/utils';

interface DefaultAvatarProps {
    className?: string;
    size?: number;
}

/**
 * 8-bit pixel art style black and white cat avatar
 */
export function DefaultAvatar({ className, size = 44 }: DefaultAvatarProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            className={cn("rounded-xl", className)}
            xmlns="http://www.w3.org/2000/svg"
            style={{ imageRendering: 'pixelated' }}
        >
            {/* Background */}
            <rect width="16" height="16" fill="#f4f4f5" />

            {/* Ears - black */}
            <rect x="2" y="1" width="2" height="3" fill="#18181b" />
            <rect x="3" y="1" width="1" height="1" fill="#18181b" />
            <rect x="12" y="1" width="2" height="3" fill="#18181b" />
            <rect x="12" y="1" width="1" height="1" fill="#18181b" />

            {/* Inner ears - pink */}
            <rect x="3" y="2" width="1" height="1" fill="#fda4af" />
            <rect x="12" y="2" width="1" height="1" fill="#fda4af" />

            {/* Head outline - black */}
            <rect x="1" y="4" width="1" height="6" fill="#18181b" />
            <rect x="14" y="4" width="1" height="6" fill="#18181b" />
            <rect x="2" y="3" width="1" height="1" fill="#18181b" />
            <rect x="13" y="3" width="1" height="1" fill="#18181b" />
            <rect x="2" y="10" width="1" height="1" fill="#18181b" />
            <rect x="13" y="10" width="1" height="1" fill="#18181b" />
            <rect x="3" y="11" width="2" height="1" fill="#18181b" />
            <rect x="11" y="11" width="2" height="1" fill="#18181b" />
            <rect x="5" y="12" width="6" height="1" fill="#18181b" />

            {/* Face - white */}
            <rect x="2" y="4" width="12" height="6" fill="#fafafa" />
            <rect x="3" y="10" width="10" height="1" fill="#fafafa" />
            <rect x="5" y="11" width="6" height="1" fill="#fafafa" />

            {/* Black patches */}
            <rect x="2" y="4" width="3" height="2" fill="#18181b" />
            <rect x="11" y="4" width="3" height="2" fill="#18181b" />
            <rect x="6" y="3" width="4" height="2" fill="#18181b" />

            {/* Eyes - green with black pupils */}
            <rect x="4" y="6" width="2" height="2" fill="#22c55e" />
            <rect x="10" y="6" width="2" height="2" fill="#22c55e" />
            <rect x="5" y="6" width="1" height="1" fill="#18181b" />
            <rect x="10" y="6" width="1" height="1" fill="#18181b" />

            {/* Eye shine */}
            <rect x="4" y="6" width="1" height="1" fill="#bbf7d0" />
            <rect x="11" y="7" width="1" height="1" fill="#bbf7d0" />

            {/* Nose - pink */}
            <rect x="7" y="8" width="2" height="1" fill="#fda4af" />

            {/* Mouth */}
            <rect x="7" y="9" width="1" height="1" fill="#18181b" />
            <rect x="8" y="9" width="1" height="1" fill="#18181b" />
            <rect x="6" y="10" width="1" height="1" fill="#18181b" />
            <rect x="9" y="10" width="1" height="1" fill="#18181b" />

            {/* Whiskers */}
            <rect x="1" y="7" width="2" height="1" fill="#a1a1aa" />
            <rect x="1" y="9" width="2" height="1" fill="#a1a1aa" />
            <rect x="13" y="7" width="2" height="1" fill="#a1a1aa" />
            <rect x="13" y="9" width="2" height="1" fill="#a1a1aa" />
        </svg>
    );
}
