"use client";

import * as React from "react";

interface ImagineSettings {
    aspectRatio: string;
    outputCount: number;
    quality: string;
    negativePrompt: string;
    seed: string;
    sampler: string;
    speed: 'relaxed' | 'fast';
}

interface ImagineContextType {
    prompt: string;
    setPrompt: (prompt: string) => void;
    settings: ImagineSettings;
    updateSettings: (settings: Partial<ImagineSettings>) => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isInputVisible: boolean;
    toggleInputVisibility: () => void;
    galleryColumns: number;
    setGalleryColumns: (cols: number) => void;
}

const ImagineContext = React.createContext<ImagineContextType | undefined>(undefined);

export function ImagineProvider({ children }: { children: React.ReactNode }) {
    const [prompt, setPrompt] = React.useState("");
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [isInputVisible, setIsInputVisible] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState("imagine");
    const [galleryColumns, setGalleryColumns] = React.useState(4);
    const [settings, setSettings] = React.useState<ImagineSettings>({
        aspectRatio: "16:9",
        outputCount: 1,
        quality: "hd",
        negativePrompt: "",
        seed: "",
        sampler: "DPM++ 2M Karras",
        speed: "relaxed"
    });

    const updateSettings = React.useCallback((newSettings: Partial<ImagineSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    const toggleSidebar = React.useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const toggleInputVisibility = React.useCallback(() => {
        setIsInputVisible(prev => !prev);
    }, []);

    const value = React.useMemo(() => ({
        prompt,
        setPrompt,
        settings,
        updateSettings,
        isSidebarOpen,
        toggleSidebar,
        activeTab,
        setActiveTab,
        isInputVisible,
        toggleInputVisibility,
        galleryColumns,
        setGalleryColumns
    }), [prompt, settings, isSidebarOpen, activeTab, isInputVisible, galleryColumns, updateSettings, toggleSidebar, toggleInputVisibility]);

    return (
        <ImagineContext.Provider value={value}>
            {children}
        </ImagineContext.Provider>
    );
}

export function useImagine() {
    const context = React.useContext(ImagineContext);
    if (context === undefined) {
        throw new Error("useImagine must be used within an ImagineProvider");
    }
    return context;
}
