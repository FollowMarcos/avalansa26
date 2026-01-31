"use client";

import { cn } from "@/lib/utils";

interface BananaIconProps {
  className?: string;
  size?: number;
}

export function BananaIcon({ className, size = 16 }: BananaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {/* 8-bit pixel art banana */}
      {/* Brown stem */}
      <rect x="10" y="1" width="1" height="1" fill="#8B4513" />
      <rect x="11" y="1" width="1" height="1" fill="#8B4513" />
      <rect x="11" y="2" width="1" height="1" fill="#8B4513" />
      <rect x="10" y="2" width="1" height="1" fill="#A0522D" />

      {/* Yellow banana body */}
      <rect x="8" y="3" width="1" height="1" fill="#FFD700" />
      <rect x="9" y="3" width="1" height="1" fill="#FFE135" />
      <rect x="10" y="3" width="1" height="1" fill="#FFE135" />

      <rect x="6" y="4" width="1" height="1" fill="#FFD700" />
      <rect x="7" y="4" width="1" height="1" fill="#FFE135" />
      <rect x="8" y="4" width="1" height="1" fill="#FFEC4D" />
      <rect x="9" y="4" width="1" height="1" fill="#FFEC4D" />
      <rect x="10" y="4" width="1" height="1" fill="#FFE135" />
      <rect x="11" y="4" width="1" height="1" fill="#FFD700" />

      <rect x="5" y="5" width="1" height="1" fill="#FFD700" />
      <rect x="6" y="5" width="1" height="1" fill="#FFE135" />
      <rect x="7" y="5" width="1" height="1" fill="#FFEC4D" />
      <rect x="8" y="5" width="1" height="1" fill="#FFF68F" />
      <rect x="9" y="5" width="1" height="1" fill="#FFEC4D" />
      <rect x="10" y="5" width="1" height="1" fill="#FFE135" />
      <rect x="11" y="5" width="1" height="1" fill="#FFD700" />

      <rect x="4" y="6" width="1" height="1" fill="#FFD700" />
      <rect x="5" y="6" width="1" height="1" fill="#FFE135" />
      <rect x="6" y="6" width="1" height="1" fill="#FFEC4D" />
      <rect x="7" y="6" width="1" height="1" fill="#FFF68F" />
      <rect x="8" y="6" width="1" height="1" fill="#FFEC4D" />
      <rect x="9" y="6" width="1" height="1" fill="#FFE135" />
      <rect x="10" y="6" width="1" height="1" fill="#FFD700" />

      <rect x="3" y="7" width="1" height="1" fill="#FFD700" />
      <rect x="4" y="7" width="1" height="1" fill="#FFE135" />
      <rect x="5" y="7" width="1" height="1" fill="#FFEC4D" />
      <rect x="6" y="7" width="1" height="1" fill="#FFF68F" />
      <rect x="7" y="7" width="1" height="1" fill="#FFEC4D" />
      <rect x="8" y="7" width="1" height="1" fill="#FFE135" />
      <rect x="9" y="7" width="1" height="1" fill="#FFD700" />

      <rect x="3" y="8" width="1" height="1" fill="#FFD700" />
      <rect x="4" y="8" width="1" height="1" fill="#FFE135" />
      <rect x="5" y="8" width="1" height="1" fill="#FFEC4D" />
      <rect x="6" y="8" width="1" height="1" fill="#FFEC4D" />
      <rect x="7" y="8" width="1" height="1" fill="#FFE135" />
      <rect x="8" y="8" width="1" height="1" fill="#FFD700" />

      <rect x="3" y="9" width="1" height="1" fill="#DAA520" />
      <rect x="4" y="9" width="1" height="1" fill="#FFD700" />
      <rect x="5" y="9" width="1" height="1" fill="#FFE135" />
      <rect x="6" y="9" width="1" height="1" fill="#FFE135" />
      <rect x="7" y="9" width="1" height="1" fill="#FFD700" />

      <rect x="4" y="10" width="1" height="1" fill="#DAA520" />
      <rect x="5" y="10" width="1" height="1" fill="#FFD700" />
      <rect x="6" y="10" width="1" height="1" fill="#FFD700" />

      {/* Tip */}
      <rect x="5" y="11" width="1" height="1" fill="#8B7355" />
      <rect x="6" y="11" width="1" height="1" fill="#A08060" />
    </svg>
  );
}
