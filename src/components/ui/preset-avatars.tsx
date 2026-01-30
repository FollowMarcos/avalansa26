'use client';

import { cn } from '@/lib/utils';

export interface PresetAvatar {
    id: string;
    label: string;
    svg: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
    {
        id: 'cat',
        label: 'Black & White Cat',
        svg: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated"><rect x="2" y="1" width="2" height="3" fill="#18181b" /><rect x="3" y="1" width="1" height="1" fill="#18181b" /><rect x="12" y="1" width="2" height="3" fill="#18181b" /><rect x="12" y="1" width="1" height="1" fill="#18181b" /><rect x="3" y="2" width="1" height="1" fill="#fda4af" /><rect x="12" y="2" width="1" height="1" fill="#fda4af" /><rect x="1" y="4" width="1" height="6" fill="#18181b" /><rect x="14" y="4" width="1" height="6" fill="#18181b" /><rect x="2" y="3" width="1" height="1" fill="#18181b" /><rect x="13" y="3" width="1" height="1" fill="#18181b" /><rect x="2" y="10" width="1" height="1" fill="#18181b" /><rect x="13" y="10" width="1" height="1" fill="#18181b" /><rect x="3" y="11" width="2" height="1" fill="#18181b" /><rect x="11" y="11" width="2" height="1" fill="#18181b" /><rect x="5" y="12" width="6" height="1" fill="#18181b" /><rect x="2" y="4" width="12" height="6" fill="#fafafa" /><rect x="3" y="10" width="10" height="1" fill="#fafafa" /><rect x="5" y="11" width="6" height="1" fill="#fafafa" /><rect x="2" y="4" width="3" height="2" fill="#18181b" /><rect x="11" y="4" width="3" height="2" fill="#18181b" /><rect x="6" y="3" width="4" height="2" fill="#18181b" /><rect x="4" y="6" width="2" height="2" fill="#22c55e" /><rect x="10" y="6" width="2" height="2" fill="#22c55e" /><rect x="5" y="6" width="1" height="1" fill="#18181b" /><rect x="10" y="6" width="1" height="1" fill="#18181b" /><rect x="4" y="6" width="1" height="1" fill="#bbf7d0" /><rect x="11" y="7" width="1" height="1" fill="#bbf7d0" /><rect x="7" y="8" width="2" height="1" fill="#fda4af" /><rect x="7" y="9" width="1" height="1" fill="#18181b" /><rect x="8" y="9" width="1" height="1" fill="#18181b" /><rect x="6" y="10" width="1" height="1" fill="#18181b" /><rect x="9" y="10" width="1" height="1" fill="#18181b" /><rect x="1" y="7" width="2" height="1" fill="#a1a1aa" /><rect x="1" y="9" width="2" height="1" fill="#a1a1aa" /><rect x="13" y="7" width="2" height="1" fill="#a1a1aa" /><rect x="13" y="9" width="2" height="1" fill="#a1a1aa" /></svg>`
    },
    {
        id: 'panda',
        label: 'Lazy Panda',
        svg: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated"><rect x="2" y="2" width="3" height="3" fill="#18181b" /><rect x="11" y="2" width="3" height="3" fill="#18181b" /><rect x="2" y="5" width="12" height="8" fill="#ffffff" /><rect x="1" y="6" width="14" height="6" fill="#ffffff" /><rect x="3" y="7" width="3" height="3" fill="#18181b" /><rect x="10" y="7" width="3" height="3" fill="#18181b" /><rect x="4" y="8" width="1" height="1" fill="#ffffff" /><rect x="11" y="8" width="1" height="1" fill="#ffffff" /><rect x="7" y="10" width="2" height="1" fill="#18181b" /></svg>`
    },
    {
        id: 'shiba',
        label: 'Happy Shiba',
        svg: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated"><rect x="2" y="3" width="3" height="3" fill="#d97706" /><rect x="11" y="3" width="3" height="3" fill="#d97706" /><rect x="3" y="4" width="10" height="9" fill="#f59e0b" /><rect x="5" y="8" width="6" height="5" fill="#ffffff" /><rect x="4" y="7" width="2" height="2" fill="#18181b" /><rect x="10" y="7" width="2" height="2" fill="#18181b" /><rect x="7" y="9" width="2" height="1" fill="#18181b" /><rect x="3" y="10" width="2" height="2" fill="#fcd34d" /><rect x="11" y="10" width="2" height="2" fill="#fcd34d" /></svg>`
    },
    {
        id: 'frog',
        label: 'Cool Frog',
        svg: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated"><rect x="2" y="4" width="3" height="3" fill="#22c55e" /><rect x="11" y="4" width="3" height="3" fill="#22c55e" /><rect x="2" y="6" width="12" height="6" fill="#4ade80" /><rect x="3" y="5" width="2" height="2" fill="#18181b" /><rect x="11" y="5" width="2" height="2" fill="#18181b" /><rect x="4" y="9" width="8" height="1" fill="#15803d" /><rect x="3" y="8" width="2" height="2" fill="#f472b6" opacity="0.4" /><rect x="11" y="8" width="2" height="2" fill="#f472b6" opacity="0.4" /></svg>`
    },
    {
        id: 'ghost',
        label: 'Byte Ghost',
        svg: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated"><rect x="4" y="3" width="8" height="10" fill="#e2e8f0" /><rect x="3" y="5" width="10" height="7" fill="#e2e8f0" /><rect x="5" y="6" width="2" height="2" fill="#64748b" /><rect x="9" y="6" width="2" height="2" fill="#64748b" /><rect x="4" y="12" width="2" height="2" fill="#e2e8f0" /><rect x="7" y="12" width="2" height="2" fill="#e2e8f0" /><rect x="10" y="12" width="2" height="2" fill="#e2e8f0" /></svg>`
    },
    {
        id: 'dog',
        label: 'Pixel Dog',
        svg: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated"><rect x="3" y="4" width="10" height="8" fill="#a16207" /><rect x="4" y="3" width="3" height="3" fill="#a16207" /><rect x="9" y="3" width="3" height="3" fill="#a16207" /><rect x="5" y="7" width="2" height="2" fill="#18181b" /><rect x="9" y="7" width="2" height="2" fill="#18181b" /><rect x="7" y="9" width="2" height="2" fill="#18181b" /><rect x="4" y="10" width="8" height="3" fill="#ca8a04" /></svg>`
    },
    {
        id: 'bird',
        label: 'Blue Bird',
        svg: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated"><rect x="4" y="5" width="8" height="7" fill="#60a5fa" /><rect x="11" y="6" width="3" height="2" fill="#fbbf24" /><rect x="5" y="7" width="2" height="2" fill="#18181b" /><rect x="6" y="7" width="1" height="1" fill="#ffffff" /><rect x="3" y="8" width="3" height="3" fill="#3b82f6" /></svg>`
    },
    {
        id: 'robot',
        label: 'Tiny Bot',
        svg: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated"><rect x="4" y="3" width="8" height="9" fill="#94a3b8" /><rect x="3" y="6" width="10" height="5" fill="#64748b" /><rect x="5" y="5" width="2" height="2" fill="#22d3ee" /><rect x="9" y="5" width="2" height="2" fill="#22d3ee" /><rect x="6" y="9" width="4" height="1" fill="#1e293b" /><rect x="2" y="7" width="2" height="3" fill="#475569" /><rect x="12" y="7" width="2" height="3" fill="#475569" /></svg>`
    }
];

export function getPresetAsDataUri(svg: string): string {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}
