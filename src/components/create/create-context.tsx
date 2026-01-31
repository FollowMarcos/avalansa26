"use client";

import * as React from "react";

// Gemini 3 Pro Image Preview API types
export type ImageSize = "1K" | "2K" | "4K";
export type AspectRatio =
  | "1:1"
  | "2:3" | "3:2"
  | "3:4" | "4:3"
  | "4:5" | "5:4"
  | "9:16" | "16:9"
  | "21:9";

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  settings: CreateSettings;
}

export interface ThinkingStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface CreateSettings {
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  outputCount: number;
  styleStrength: number;
  negativePrompt: string;
  seed: string;
}

interface CreateContextType {
  // Prompt state
  prompt: string;
  setPrompt: (prompt: string) => void;

  // Settings
  settings: CreateSettings;
  updateSettings: (settings: Partial<CreateSettings>) => void;

  // Reference images (up to 14, 6 objects max, 5 human faces)
  referenceImages: ImageFile[];
  addReferenceImages: (files: File[]) => void;
  removeReferenceImage: (id: string) => void;
  clearReferenceImages: () => void;

  // Generation history
  history: GeneratedImage[];
  selectedImage: GeneratedImage | null;
  selectImage: (image: GeneratedImage | null) => void;
  clearHistory: () => void;

  // UI state
  viewMode: "canvas" | "gallery";
  setViewMode: (mode: "canvas" | "gallery") => void;
  settingsPanelOpen: boolean;
  toggleSettingsPanel: () => void;
  isInputVisible: boolean;
  toggleInputVisibility: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Zoom
  zoom: number;
  setZoom: (zoom: number) => void;

  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Generation
  isGenerating: boolean;
  thinkingSteps: ThinkingStep[];
  generate: () => Promise<void>;
  cancelGeneration: () => void;
}

const defaultSettings: CreateSettings = {
  imageSize: "2K",
  aspectRatio: "1:1",
  outputCount: 1,
  styleStrength: 75,
  negativePrompt: "",
  seed: "",
};

const CreateContext = React.createContext<CreateContextType | undefined>(undefined);

// Maximum images for reference input (Gemini 3 Pro supports up to 14)
const MAX_REFERENCE_IMAGES = 14;

export function CreateProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = React.useState("");
  const [settings, setSettings] = React.useState<CreateSettings>(defaultSettings);
  const [referenceImages, setReferenceImages] = React.useState<ImageFile[]>([]);
  const [history, setHistory] = React.useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = React.useState<GeneratedImage | null>(null);
  const [viewMode, setViewMode] = React.useState<"canvas" | "gallery">("canvas");
  const [settingsPanelOpen, setSettingsPanelOpen] = React.useState(true);
  const [isInputVisible, setIsInputVisible] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("create");
  const [zoom, setZoom] = React.useState(100);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [thinkingSteps, setThinkingSteps] = React.useState<ThinkingStep[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [historyStack, setHistoryStack] = React.useState<GeneratedImage[][]>([]);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const updateSettings = React.useCallback((newSettings: Partial<CreateSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const addReferenceImages = React.useCallback((files: File[]) => {
    const newImages: ImageFile[] = files.slice(0, MAX_REFERENCE_IMAGES - referenceImages.length).map(file => ({
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setReferenceImages(prev => [...prev, ...newImages].slice(0, MAX_REFERENCE_IMAGES));
  }, [referenceImages.length]);

  const removeReferenceImage = React.useCallback((id: string) => {
    setReferenceImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const clearReferenceImages = React.useCallback(() => {
    referenceImages.forEach(img => URL.revokeObjectURL(img.preview));
    setReferenceImages([]);
  }, [referenceImages]);

  const selectImage = React.useCallback((image: GeneratedImage | null) => {
    setSelectedImage(image);
    if (image) setViewMode("canvas");
  }, []);

  const clearHistory = React.useCallback(() => {
    setHistory([]);
    setSelectedImage(null);
    setHistoryStack([]);
    setHistoryIndex(-1);
  }, []);

  const toggleSettingsPanel = React.useCallback(() => {
    setSettingsPanelOpen(prev => !prev);
  }, []);

  const toggleInputVisibility = React.useCallback(() => {
    setIsInputVisible(prev => !prev);
  }, []);

  // Dynamic thinking steps based on context
  const getThinkingSteps = React.useCallback((): ThinkingStep[] => {
    const steps: ThinkingStep[] = [
      { id: "1", text: "Analyzing prompt intent...", completed: false },
      { id: "2", text: "Planning scene composition...", completed: false },
    ];

    if (referenceImages.length > 0) {
      steps.push({ id: "3", text: `Processing ${referenceImages.length} reference image${referenceImages.length > 1 ? 's' : ''}...`, completed: false });
    }

    // Check if prompt likely contains text to render
    const hasTextContent = /["']|say|text|sign|label|title|headline|word/i.test(prompt);
    if (hasTextContent) {
      steps.push({ id: "4", text: "Aligning text elements...", completed: false });
    }

    steps.push({ id: "5", text: `Generating ${settings.imageSize} output...`, completed: false });

    return steps;
  }, [referenceImages.length, prompt, settings.imageSize]);

  const generate = React.useCallback(async () => {
    if (!prompt.trim() && referenceImages.length === 0) return;

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    // Initialize thinking steps (always enabled for Gemini 3 Pro)
    const steps = getThinkingSteps();
    setThinkingSteps(steps);

    try {
      // Simulate thinking process
      for (let i = 0; i < steps.length; i++) {
        if (abortControllerRef.current?.signal.aborted) break;

        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
        setThinkingSteps(prev =>
          prev.map((step, idx) =>
            idx === i ? { ...step, completed: true } : step
          )
        );
      }

      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

      if (abortControllerRef.current?.signal.aborted) return;

      // Get dimensions based on settings
      const getDimensions = () => {
        const sizeMap: Record<ImageSize, number> = {
          "1K": 1024,
          "2K": 2048,
          "4K": 4096,
        };

        const aspectRatios: Record<AspectRatio, [number, number]> = {
          "1:1": [1, 1],
          "2:3": [2, 3],
          "3:2": [3, 2],
          "3:4": [3, 4],
          "4:3": [4, 3],
          "4:5": [4, 5],
          "5:4": [5, 4],
          "9:16": [9, 16],
          "16:9": [16, 9],
          "21:9": [21, 9],
        };

        const baseSize = sizeMap[settings.imageSize];
        const [wRatio, hRatio] = aspectRatios[settings.aspectRatio];
        const scale = Math.sqrt((baseSize * baseSize) / (wRatio * hRatio));
        return {
          width: Math.round(wRatio * scale),
          height: Math.round(hRatio * scale),
        };
      };

      const { width, height } = getDimensions();

      // Generate mock images (will be replaced with actual API call)
      const newImages: GeneratedImage[] = [];
      for (let i = 0; i < settings.outputCount; i++) {
        const seed = settings.seed || Math.floor(Math.random() * 1000000);
        newImages.push({
          id: `gen-${Date.now()}-${i}`,
          url: `https://picsum.photos/seed/${seed}${i}/${Math.min(width, 800)}/${Math.min(height, 800)}`,
          prompt,
          timestamp: Date.now(),
          settings: { ...settings },
        });
      }

      // Save to history for undo
      setHistoryStack(prev => [...prev.slice(0, historyIndex + 1), history]);
      setHistoryIndex(prev => prev + 1);

      // Add to history and select first
      setHistory(prev => [...newImages, ...prev]);
      setSelectedImage(newImages[0]);
      setViewMode("canvas");

    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
      setThinkingSteps([]);
    }
  }, [prompt, referenceImages.length, settings, history, historyIndex, getThinkingSteps]);

  const cancelGeneration = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setThinkingSteps([]);
  }, []);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < historyStack.length - 1;

  const undo = React.useCallback(() => {
    if (!canUndo) return;
    const prevHistory = historyStack[historyIndex];
    setHistory(prevHistory);
    setHistoryIndex(prev => prev - 1);
    setSelectedImage(prevHistory[0] || null);
  }, [canUndo, historyIndex, historyStack]);

  const redo = React.useCallback(() => {
    if (!canRedo) return;
    const nextHistory = historyStack[historyIndex + 2];
    if (nextHistory) {
      setHistory(nextHistory);
      setHistoryIndex(prev => prev + 1);
      setSelectedImage(nextHistory[0] || null);
    }
  }, [canRedo, historyIndex, historyStack]);

  const value = React.useMemo(() => ({
    prompt,
    setPrompt,
    settings,
    updateSettings,
    referenceImages,
    addReferenceImages,
    removeReferenceImage,
    clearReferenceImages,
    history,
    selectedImage,
    selectImage,
    clearHistory,
    viewMode,
    setViewMode,
    settingsPanelOpen,
    toggleSettingsPanel,
    isInputVisible,
    toggleInputVisibility,
    activeTab,
    setActiveTab,
    zoom,
    setZoom,
    canUndo,
    canRedo,
    undo,
    redo,
    isGenerating,
    thinkingSteps,
    generate,
    cancelGeneration,
  }), [
    prompt, settings, referenceImages, history, selectedImage,
    viewMode, settingsPanelOpen, isInputVisible, activeTab, zoom, canUndo, canRedo,
    isGenerating, thinkingSteps,
    updateSettings, addReferenceImages, removeReferenceImage, clearReferenceImages,
    selectImage, clearHistory, toggleSettingsPanel, toggleInputVisibility, undo, redo, generate, cancelGeneration,
  ]);

  return (
    <CreateContext.Provider value={value}>
      {children}
    </CreateContext.Provider>
  );
}

export function useCreate() {
  const context = React.useContext(CreateContext);
  if (context === undefined) {
    throw new Error("useCreate must be used within a CreateProvider");
  }
  return context;
}
