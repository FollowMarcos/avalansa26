'use client';

import * as React from 'react';
import {
    Sparkles, ImagePlus, Library, Layers, Wand2, Gem, Paperclip, Sliders, Hash, PaintBucket,
    Eraser, Grid3X3, Cloud, Wind, Leaf, Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';

// Shared Constants


// ============================================================================
// MOCKUP 13: Zen
// Nature-inspired, wood/paper textures, soft earth tones
// ============================================================================
export function ComposerZen() {


    return (
        <div className="relative overflow-hidden rounded-3xl bg-[#F5F2Eb] shadow-xl border border-[#D7D2C5]">
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />

            <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#E6E2D8] flex items-center justify-center text-[#8C867A]">
                            <Leaf className="w-4 h-4" />
                        </div>
                        <span className="font-serif italic text-[#8C867A] text-lg">Create</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#E6E2D8] text-[#8C867A]">
                            <Wind className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="relative bg-white/50 rounded-2xl p-4 border border-[#E6E2D8] shadow-sm mb-4">
                    <textarea
                        placeholder="A peaceful garden with flowing water..."
                        className="w-full bg-transparent border-none resize-none focus:ring-0 text-[#5C564A] placeholder:text-[#BBB6AA] font-serif text-lg min-h-[100px]"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <button className="px-3 py-1 rounded-full bg-[#E6E2D8] text-[#8C867A] text-xs font-medium hover:bg-[#D7D2C5] transition-colors">
                            v1.0
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E6E2D8] text-[#8C867A] text-sm hover:bg-white/50 transition-colors">
                            <Sliders className="w-4 h-4" />
                            <span>Adjust</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E6E2D8] text-[#8C867A] text-sm hover:bg-white/50 transition-colors">
                            <Library className="w-4 h-4" />
                            <span>Library</span>
                        </button>
                    </div>

                    <button className="px-6 py-2.5 rounded-full bg-[#8C867A] text-[#F5F2Eb] font-medium shadow-lg hover:bg-[#7A7469] transition-colors flex items-center gap-2">
                        <span>Manifest</span>
                        <Sparkles className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MOCKUP 14: Cyberpunk
// Glitch effects, aggressive contrast, yellow/black
// ============================================================================
export function ComposerCyberpunk() {


    return (
        <div className="relative bg-[#FCEE0A] p-1 [clip-path:polygon(0_0,100%_0,100%_90%,90%_100%,0_100%)]">
            <div className="bg-black p-6 relative overflow-hidden h-full">
                {/* Glitch elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[repeating-linear-gradient(45deg,#FCEE0A_0px,#FCEE0A_2px,transparent_2px,transparent_8px)] opacity-20 pointer-events-none" />

                <div className="flex justify-between items-end border-b-2 border-[#FCEE0A] pb-4 mb-6">
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                        Generate<span className="text-[#FCEE0A]">.exe</span>
                    </h2>
                    <div className="flex flex-col items-end">
                        <span className="bg-[#FCEE0A] text-black text-xs font-bold px-1">SYS.READY</span>
                        <span className="text-[#FCEE0A] text-xs font-mono mt-1">V.2077</span>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <div className="w-12 flex flex-col gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-full h-1 bg-[#333] hover:bg-[#00F0FF] transition-colors cursor-pointer" />
                        ))}
                    </div>
                    <textarea
                        className="flex-1 bg-[#111] border border-[#333] text-[#00F0FF] font-mono p-4 focus:ring-1 focus:ring-[#FCEE0A] focus:border-[#FCEE0A] outline-none placeholder:text-[#333] min-h-[120px]"
                        placeholder="INSERT_PROMPT_SEQUENCE..."
                    />
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex gap-4 text-[#FCEE0A] font-mono text-sm">
                        <button className="hover:underline hover:text-white">[ PARAMETERS ]</button>
                        <button className="hover:underline hover:text-white">[ OVERRIDE ]</button>
                    </div>

                    <button className="bg-[#00F0FF] text-black font-bold text-xl px-8 py-3 hover:bg-[#fff] hover:shadow-[4px_4px_0px_#FCEE0A] transition-all uppercase [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%,0_20%)]">
                        Run_Process
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MOCKUP 15: Architect
// Blueprint style, grid lines, technical font
// ============================================================================
export function ComposerArchitect() {
    return (
        <div className="bg-[#003366] p-8 relative overflow-hidden border-4 border-white shadow-2xl">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:100px_100px]" />

            <div className="relative border-2 border-white/30 p-1">
                <div className="border border-white/30 p-6 bg-[#003366]/90 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-8 border-b border-white py-2">
                        <div className="flex flex-col">
                            <span className="font-mono text-[10px] text-white/70 uppercase tracking-[0.2em]">Project No. 8291</span>
                            <h3 className="font-mono text-white text-xl uppercase tracking-widest">Schematic Gen</h3>
                        </div>
                        <div className="border border-white px-2 py-1">
                            <span className="font-mono text-xs text-white">SCALE: 1:1</span>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="w-16 border-r border-white/20 pr-4 flex flex-col gap-4">
                            <div className="w-full aspect-square border border-white/40 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors cursor-pointer">
                                <Grid3X3 className="w-5 h-5" />
                            </div>
                            <div className="w-full aspect-square border border-white/40 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors cursor-pointer">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div className="w-full aspect-square border border-white/40 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors cursor-pointer">
                                <Hash className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="block font-mono text-[10px] text-white/50 uppercase mb-2">Input Specification</label>
                            <textarea
                                className="w-full bg-white/5 border border-white/20 text-white font-mono text-sm p-3 focus:border-white focus:outline-none min-h-[100px]"
                                placeholder="// Enter design parameters..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t border-white/20">
                        <button className="flex items-center gap-3 px-6 py-2 bg-white text-[#003366] font-mono font-bold text-sm hover:bg-white/90 transition-colors uppercase">
                            <span className="w-2 h-2 bg-[#003366] rounded-full animate-pulse" />
                            Render Output
                        </button>
                    </div>
                </div>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white" />
        </div>
    );
}

// ============================================================================
// MOCKUP 16: Paper
// Paper aesthetic, rough edges, pencil feel
// ============================================================================
export function ComposerPaper() {
    return (
        <div className="bg-[#fcfbf9] p-8 rounded-sm shadow-md border border-gray-200 relative overflow-hidden">
            {/* Lined paper pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_23px,#e5e7eb_24px)] bg-[size:100%_24px] pointer-events-none" />
            {/* Margin line */}
            <div className="absolute top-0 bottom-0 left-12 w-px bg-red-200 pointer-events-none" />

            <div className="relative pl-8">
                <div className="flex items-center gap-3 mb-6 font-handwriting text-gray-800 -rotate-1">
                    <h2 className="text-3xl font-bold font-serif text-gray-800">Sketch & Dream</h2>
                    <span className="text-sm text-gray-500 font-sans mt-2">v.draft</span>
                </div>

                <div className="bg-white/80 p-6 shadow-[2px_2px_5px_rgba(0,0,0,0.05)] transform rotate-1 border border-gray-100 mb-6">
                    <textarea
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-700 font-serif text-lg leading-relaxed placeholder:text-gray-300 resize-none min-h-[120px]"
                        placeholder="Draw me a sheep..."
                    />
                </div>

                <div className="flex items-center justify-between pl-4">
                    <div className="flex gap-4">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors transform hover:-translate-y-1">
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors transform hover:-translate-y-1">
                            <Eraser className="w-5 h-5" />
                        </button>
                    </div>

                    <button className="px-6 py-2 bg-gray-900 text-white font-serif rounded-full shadow-lg hover:bg-gray-800 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2">
                        <span>Sketch It</span>
                        <PaintBucket className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MOCKUP 17: Holographic
// Iridescent textures, shifting colors
// ============================================================================
export function ComposerHolographic() {
    return (
        <div className="relative bg-black rounded-2xl overflow-hidden p-[1px]">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-cyan-500 to-violet-500 animate-pulse opacity-50" />

            <div className="relative bg-black/90 backdrop-blur-3xl rounded-2xl p-6 h-full border border-white/10">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Gem className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-cyan-400 to-violet-400 font-bold tracking-wide">HOLO.GEN</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 backdrop-blur-md">
                        Prism Core
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity blur" />
                    <div className="relative bg-black/50 rounded-xl p-4 border border-white/10">
                        <textarea
                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 text-lg font-light resize-none min-h-[100px]"
                            placeholder="Refract your reality..."
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <div className="flex gap-2">
                        {['1:1', '16:9', 'Custom'].map((ratio) => (
                            <button key={ratio} className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors border border-white/5">
                                {ratio}
                            </button>
                        ))}
                    </div>

                    <button className="relative px-8 py-3 rounded-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <span className="relative text-white font-bold tracking-wide flex items-center gap-2">
                            <Wand2 className="w-4 h-4" />
                            CRYSTALLIZE
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MOCKUP 18: Monochrome
// Strictly black and white, high contrast
// ============================================================================
export function ComposerMonochrome() {
    return (
        <div className="bg-white text-black border-4 border-black p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-6xl font-black uppercase leading-none tracking-tighter">Create</h2>
                <h2 className="text-6xl font-black uppercase leading-none tracking-tighter text-transparent stroke-black stroke-2" style={{ WebkitTextStroke: '2px black' }}>Visuals</h2>
            </div>

            <div className="border-t-4 border-b-4 border-black py-6 mb-6">
                <input
                    type="text"
                    className="w-full text-2xl font-bold placeholder:text-black/20 outline-none uppercase bg-transparent"
                    placeholder="Type something bold..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="border-2 border-black p-3 hover:bg-black hover:text-white transition-colors cursor-pointer flex items-center justify-between group">
                    <span className="font-bold uppercase text-sm">Quality</span>
                    <span className="font-mono text-xs group-hover:text-white/70">HIGH_DEF</span>
                </div>
                <div className="border-2 border-black p-3 hover:bg-black hover:text-white transition-colors cursor-pointer flex items-center justify-between group">
                    <span className="font-bold uppercase text-sm">Ratio</span>
                    <span className="font-mono text-xs group-hover:text-white/70">16:9</span>
                </div>
            </div>

            <button className="w-full bg-black text-white py-5 text-xl font-black uppercase tracking-widest hover:bg-white hover:text-black border-4 border-black transition-all flex items-center justify-center gap-4">
                Execute
                <div className="w-4 h-4 bg-white hover:bg-black" />
            </button>
        </div>
    );
}

// ============================================================================
// MOCKUP 19: Playful
// Rounded, bouncy, pastel colors
// ============================================================================
export function ComposerPlayful() {
    return (
        <div className="bg-[#FFF0F5] p-6 rounded-[2rem] border-4 border-[#FFB6C1] shadow-[0_10px_0_0_#FFB6C1]">
            <div className="bg-white rounded-[1.5rem] p-6 border-4 border-[#E0F0FF] mb-4 shadow-inner">
                <div className="flex gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-[#FFB6C1]" />
                    <div className="w-3 h-3 rounded-full bg-[#B6FFC1]" />
                    <div className="w-3 h-3 rounded-full bg-[#B6E0FF]" />
                </div>
                <textarea
                    className="w-full bg-transparent border-none focus:ring-0 text-[#6B7280] text-lg font-medium resize-none h-[100px] placeholder:text-[#D1D5DB]"
                    placeholder="Imagine something fun!"
                />
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 mb-2">
                {['🌈 Colorful', '🦄 Magical', '🍭 Sweet', '🚀 Fast'].map((tag) => (
                    <button key={tag} className="px-4 py-2 rounded-full bg-[#E0F0FF] text-[#5C8AB8] text-sm font-bold border-2 border-[#B6E0FF] hover:scale-105 transition-transform whitespace-nowrap">
                        {tag}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between mt-4">
                <button className="w-12 h-12 rounded-full bg-[#F0FFE0] border-4 border-[#B6FFC1] flex items-center justify-center text-[#5CB875] hover:rotate-12 transition-transform">
                    <ImagePlus className="w-6 h-6" />
                </button>

                <button className="px-8 py-3 bg-[#FFB6C1] rounded-full text-white font-black text-lg border-b-4 border-[#FF69B4] active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 hover:brightness-105">
                    <Sparkles className="w-5 h-5" />
                    Spark It!
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// MOCKUP 20: Industrial
// Brushed metal, screws, heavy utility look
// ============================================================================
export function ComposerIndustrial() {
    return (
        <div className="relative bg-[#2A2A2A] p-2 rounded-lg shadow-2xl">
            {/* Metal texture */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] rounded-lg pointer-events-none opacity-50" />

            {/* Screws */}
            <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-[#111] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center"><div className="w-full h-[1px] bg-[#444] rotate-45" /></div>
            <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#111] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center"><div className="w-full h-[1px] bg-[#444] rotate-45" /></div>
            <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-[#111] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center"><div className="w-full h-[1px] bg-[#444] rotate-45" /></div>
            <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-[#111] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center"><div className="w-full h-[1px] bg-[#444] rotate-45" /></div>

            <div className="bg-[#1A1A1A] m-4 p-6 border-2 border-[#333] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] rounded relative">
                <div className="flex items-center justify-between mb-4 border-b border-[#333] pb-2">
                    <span className="text-[#555] font-mono text-xs uppercase tracking-widest">Unit-01 // Input</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-900" />
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                </div>

                <textarea
                    className="w-full bg-[#111] border border-[#333] text-amber-500 font-mono text-sm p-4 focus:border-amber-700 outline-none shadow-inner min-h-[100px]"
                    placeholder="> INITIALIZE SEQUENCE..."
                />

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-[#222] p-2 border border-[#333]">
                        <label className="block text-[#444] text-[10px] uppercase mb-1">Power Output</label>
                        <div className="w-full h-2 bg-[#111] rounded-full overflow-hidden">
                            <div className="w-[70%] h-full bg-amber-600" />
                        </div>
                    </div>
                    <div className="bg-[#222] p-2 border border-[#333] flex items-center justify-between">
                        <label className="block text-[#444] text-[10px] uppercase">Safety Lock</label>
                        <div className="w-8 h-4 bg-green-900 rounded-sm relative cursor-pointer">
                            <div className="absolute right-0 top-0 bottom-0 w-4 bg-green-600 rounded-sm" />
                        </div>
                    </div>
                </div>

                <button className="w-full mt-6 bg-[#333] hover:bg-[#444] text-[#888] hover:text-[#AAA] font-bold uppercase py-3 border-t border-white/5 border-b border-black shadow-lg active:translate-y-[1px] transition-all">
                    Engage
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// MOCKUP 21: Ethereal
// Soft blurs, white-on-white, dreamy
// ============================================================================
export function ComposerEthereal() {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.05)]">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-60" />

            <div className="relative p-8 backdrop-blur-sm bg-white/30 h-full">
                <div className="flex justify-center mb-8">
                    <div className="px-4 py-1 rounded-full bg-white/50 border border-white text-xs text-gray-500 tracking-wider uppercase font-light">
                        Dream State
                    </div>
                </div>

                <div className="text-center mb-8">
                    <input
                        type="text"
                        placeholder="What do you see?"
                        className="w-full bg-transparent text-center text-3xl font-light text-gray-800 placeholder:text-gray-300 outline-none"
                    />
                </div>

                <div className="flex justify-center gap-6 mb-8">
                    <button className="w-12 h-12 rounded-full bg-white border border-gray-50 text-gray-400 hover:text-gray-600 hover:shadow-lg transition-all flex items-center justify-center">
                        <Cloud className="w-5 h-5" />
                    </button>
                    <button className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-50 to-purple-50 border border-white text-gray-600 shadow-xl hover:scale-105 transition-all flex items-center justify-center -mt-2">
                        <Sparkles className="w-6 h-6 stroke-1" />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-white border border-gray-50 text-gray-400 hover:text-gray-600 hover:shadow-lg transition-all flex items-center justify-center">
                        <Settings className="w-5 h-5 stroke-1" />
                    </button>
                </div>

                <div className="text-center text-xs text-gray-300 font-light">
                    Press the center to begin
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MOCKUP 22: Bauhaus
// Geometric shapes, primary colors, minimalist
// ============================================================================
export function ComposerBauhaus() {
    return (
        <div className="bg-[#F0F0F0] p-8 border-4 border-black relative overflow-hidden">
            {/* Geometric shapes */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-600 rounded-tr-full" />
            <div className="absolute top-1/2 left-8 w-8 h-8 bg-yellow-400 rounded-full" />

            <div className="relative z-10 bg-white border-2 border-black p-6 shadow-[8px_8px_0px_black]">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-4 h-4 bg-black" />
                    <div className="w-4 h-4 bg-black rounded-full" />
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[16px] border-b-black border-r-[8px] border-r-transparent" />
                    <h2 className="ml-auto font-black text-xl tracking-tighter uppercase">Gestalt</h2>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold uppercase mb-2 bg-yellow-400 inline-block px-1">Concept</label>
                    <input
                        className="w-full border-b-2 border-black py-2 outline-none font-bold text-lg placeholder:text-gray-300"
                        placeholder="Form follows function..."
                    />
                </div>

                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button className="w-8 h-8 border-2 border-black bg-blue-600 hover:bg-blue-700 transition-colors" />
                            <button className="w-8 h-8 border-2 border-black bg-red-600 hover:bg-red-700 transition-colors rounded-full" />
                            <button className="w-8 h-8 border-2 border-black bg-yellow-400 hover:bg-yellow-500 transition-colors" />
                        </div>
                    </div>

                    <button className="bg-black text-white px-8 py-3 font-bold uppercase hover:bg-white hover:text-black border-2 border-black transition-colors">
                        Construct
                    </button>
                </div>
            </div>
        </div>
    );
}


