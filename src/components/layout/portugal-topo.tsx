'use client';

import { cn } from '@/lib/utils';

interface PortugalTopoProps {
    dark?: boolean;
    className?: string;
}

/**
 * Stylized topographic map pattern inspired by Portugal's terrain
 * Features contour lines suggesting mountains in the north and coastal features
 */
export function PortugalTopo({ dark = false, className }: PortugalTopoProps) {
    const strokeColor = dark ? '#3f3f46' : '#d4d4d8';
    const strokeColorLight = dark ? '#27272a' : '#e4e4e7';

    return (
        <svg
            className={cn("absolute inset-0 w-full h-full", className)}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
        >
            <defs>
                {/* Main topographic pattern */}
                <pattern
                    id={`topo-pattern-${dark ? 'dark' : 'light'}`}
                    x="0"
                    y="0"
                    width="120"
                    height="80"
                    patternUnits="userSpaceOnUse"
                >
                    {/* Mountain contours - Serra da Estrela inspired */}
                    <path
                        d="M0 40 Q15 35, 30 38 T60 32 T90 36 T120 40"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="0.5"
                    />
                    <path
                        d="M0 45 Q20 38, 40 42 T80 35 T120 45"
                        fill="none"
                        stroke={strokeColorLight}
                        strokeWidth="0.4"
                    />
                    <path
                        d="M0 35 Q25 28, 50 33 T100 28 T120 35"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="0.5"
                    />

                    {/* Coastal curves - Atlantic inspired */}
                    <path
                        d="M0 55 Q30 50, 60 55 T120 52"
                        fill="none"
                        stroke={strokeColorLight}
                        strokeWidth="0.4"
                    />
                    <path
                        d="M0 25 Q40 20, 80 25 T120 22"
                        fill="none"
                        stroke={strokeColorLight}
                        strokeWidth="0.4"
                    />

                    {/* Valley contours - Tagus/Douro inspired */}
                    <path
                        d="M0 60 Q20 58, 40 62 T80 58 T120 62"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="0.5"
                    />
                    <path
                        d="M0 20 Q30 15, 60 20 T120 18"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="0.5"
                    />

                    {/* Southern hills - Algarve inspired */}
                    <path
                        d="M0 70 Q25 65, 50 70 T100 68 T120 72"
                        fill="none"
                        stroke={strokeColorLight}
                        strokeWidth="0.4"
                    />
                    <path
                        d="M0 10 Q35 5, 70 10 T120 8"
                        fill="none"
                        stroke={strokeColorLight}
                        strokeWidth="0.4"
                    />

                    {/* Elevation rings - mountain peaks */}
                    <ellipse
                        cx="45"
                        cy="40"
                        rx="8"
                        ry="4"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="0.4"
                    />
                    <ellipse
                        cx="85"
                        cy="35"
                        rx="6"
                        ry="3"
                        fill="none"
                        stroke={strokeColorLight}
                        strokeWidth="0.3"
                    />
                    <ellipse
                        cx="20"
                        cy="50"
                        rx="5"
                        ry="2.5"
                        fill="none"
                        stroke={strokeColorLight}
                        strokeWidth="0.3"
                    />

                    {/* Additional terrain detail */}
                    <path
                        d="M10 30 Q25 25, 40 30"
                        fill="none"
                        stroke={strokeColorLight}
                        strokeWidth="0.3"
                    />
                    <path
                        d="M70 45 Q85 40, 100 45"
                        fill="none"
                        stroke={strokeColorLight}
                        strokeWidth="0.3"
                    />
                    <path
                        d="M30 65 Q45 60, 60 65"
                        fill="none"
                        stroke={strokeColorLight}
                        strokeWidth="0.3"
                    />
                </pattern>
            </defs>
            <rect
                width="100%"
                height="100%"
                fill={`url(#topo-pattern-${dark ? 'dark' : 'light'})`}
            />
        </svg>
    );
}
