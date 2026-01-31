"use client";

import * as React from "react";

export type GenerationMode =
  | "text2img"        // Text to image (Nano Banana Pro optimized)
  | "img2img"         // Image to image / Variations
  | "upscale"         // High-fidelity upscaling
  | "inpainting"      // Editing / Masking
  | "outpainting"     // Expansion
  | "text-fidelity";  // Specialized text rendering focus

export type Resolution = "1024" | "2048" | "4096" | "custom";
export type AspectRatio = "1:1" | "16:9" | "9:16" | "21:9" | "4:5" | "custom";
export type Quality = "draft" | "standard" | "high" | "4k";

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  mode: GenerationMode;
  timestamp: number;
  settings: CreateSettings;
}

export interface ThinkingStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface CreateSettings {
  resolution: Resolution;
  customWidth: number;
  customHeight: number;
  aspectRatio: AspectRatio;
  quality: Quality;
  outputCount: number;
  negativePrompt: string;
  seed: string;
  thinking: boolean;
  styleStrength: number;
  promptFidelity: number;    // 0-100: How strictly to follow prompt
  spatialPrecision: number;  // 0-100: For complex compositions
  textFidelity: number;     // 0-100: For specialized text rendering
}

interface CreateContextType {
  // Prompt state
  prompt: string;
  setPrompt: (prompt: string) => void;

  // Generation mode
  mode: GenerationMode;
  setMode: (mode: GenerationMode) => void;

  // Settings
  settings: CreateSettings;
  updateSettings: (settings: Partial<CreateSettings>) => void;

  // Multi-image input
  inputImages: ImageFile[];
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;

  // Style reference
  styleReference: ImageFile | null;
  setStyleReference: (file: File | null) => void;

  // Generation history
  history: GeneratedImage[];
  selectedImage: GeneratedImage | null;
  selectImage: (image: GeneratedImage | null) => void;
  clearHistory: () => void;

  // UI state
  viewMode: "canvas" | "gallery";
  setViewMode: (mode: "canvas" | "gallery") => void;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  isInputVisible: boolean;
  toggleInputVisibility: () => void;

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

  // Active tab for compatibility
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const defaultSettings: CreateSettings = {
  resolution: "1024",
  customWidth: 1024,
  customHeight: 1024,
  aspectRatio: "1:1",
  quality: "high",
  outputCount: 1,
  negativePrompt: "",
  seed: "",
  thinking: true,
  styleStrength: 75,
  promptFidelity: 80,
  spatialPrecision: 50,
  textFidelity: 90,
};

const CreateContext = React.createContext<CreateContextType | undefined>(undefined);

// Maximum images for multi-image input (Gemini 3 Pro supports up to 14)
const MAX_INPUT_IMAGES = 14;

export function CreateProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = React.useState("");
  const [mode, setMode] = React.useState<GenerationMode>("text2img");
  const [settings, setSettings] = React.useState<CreateSettings>(defaultSettings);
  const [inputImages, setInputImages] = React.useState<ImageFile[]>([]);
  const [styleReference, setStyleReferenceState] = React.useState<ImageFile | null>(null);
  const [history, setHistory] = React.useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = React.useState<GeneratedImage | null>(null);
  const [viewMode, setViewMode] = React.useState<"canvas" | "gallery">("canvas");
  const [leftSidebarOpen, setLeftSidebarOpen] = React.useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = React.useState(true);
  const [isInputVisible, setIsInputVisible] = React.useState(false);
  const [zoom, setZoom] = React.useState(100);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [thinkingSteps, setThinkingSteps] = React.useState<ThinkingStep[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [historyStack, setHistoryStack] = React.useState<GeneratedImage[][]>([]);
  const [activeTab, setActiveTab] = React.useState("create");
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const updateSettings = React.useCallback((newSettings: Partial<CreateSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const addImages = React.useCallback((files: File[]) => {
    const newImages: ImageFile[] = files.slice(0, MAX_INPUT_IMAGES - inputImages.length).map(file => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setInputImages(prev => [...prev, ...newImages].slice(0, MAX_INPUT_IMAGES));
  }, [inputImages.length]);

  const removeImage = React.useCallback((id: string) => {
    setInputImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const clearImages = React.useCallback(() => {
    inputImages.forEach(img => URL.revokeObjectURL(img.preview));
    setInputImages([]);
  }, [inputImages]);

  const setStyleReference = React.useCallback((file: File | null) => {
    if (styleReference) {
      URL.revokeObjectURL(styleReference.preview);
    }
    if (file) {
      setStyleReferenceState({
        id: `style-${Date.now()}`,
        file,
        preview: URL.createObjectURL(file),
      });
    } else {
      setStyleReferenceState(null);
    }
  }, [styleReference]);

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

  const toggleLeftSidebar = React.useCallback(() => {
    setLeftSidebarOpen(prev => !prev);
  }, []);

  const toggleRightSidebar = React.useCallback(() => {
    setRightSidebarOpen(prev => !prev);
  }, []);

  const toggleInputVisibility = React.useCallback(() => {
    setIsInputVisible(prev => !prev);
  }, []);

  // Mock thinking steps for visual reasoning
  const mockThinkingSteps: ThinkingStep[] = [
    { id: "1", text: "Analyzing multimodal prompt intent…", completed: false },
    { id: "2", text: "Nano-fast spatial mapping…", completed: false },
    { id: "3", text: "Banana Pro text fidelity alignment…", completed: false },
    { id: "4", text: "Synthesizing cross-attention layers…", completed: false },
    { id: "5", text: "Applying high-precision denoiser…", completed: false },
    { id: "6", text: "Finalizing 4K Banana Pro output…", completed: false },
  ];

  const generate = React.useCallback(async () => {
    if (!prompt.trim() && inputImages.length === 0) return;

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    // Initialize thinking steps if enabled
    if (settings.thinking) {
      setThinkingSteps(mockThinkingSteps);
    }

    try {
      // Simulate thinking process
      if (settings.thinking) {
        for (let i = 0; i < mockThinkingSteps.length; i++) {
          if (abortControllerRef.current?.signal.aborted) break;

          await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
          setThinkingSteps(prev =>
            prev.map((step, idx) =>
              idx === i ? { ...step, completed: true } : step
            )
          );
        }
      }

      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

      if (abortControllerRef.current?.signal.aborted) return;

      // Get dimensions based on settings
      const getDimensions = () => {
        const aspectRatios: Record<AspectRatio, [number, number]> = {
          "1:1": [1, 1],
          "16:9": [16, 9],
          "9:16": [9, 16],
          "21:9": [21, 9],
          "4:5": [4, 5],
          "custom": [settings.customWidth / settings.customHeight, 1],
        };

        const baseSize = parseInt(settings.resolution) || 1024;
        const [wRatio, hRatio] = aspectRatios[settings.aspectRatio];
        const scale = Math.sqrt((baseSize * baseSize) / (wRatio * hRatio));
        return {
          width: Math.round(wRatio * scale),
          height: Math.round(hRatio * scale),
        };
      };

      const { width, height } = getDimensions();

      // Generate mock images
      const newImages: GeneratedImage[] = [];
      for (let i = 0; i < settings.outputCount; i++) {
        const seed = settings.seed || Math.floor(Math.random() * 1000000);
        newImages.push({
          id: `gen-${Date.now()}-${i}`,
          url: `https://picsum.photos/seed/${seed}${i}/${width}/${height}`,
          prompt,
          mode,
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
  }, [prompt, inputImages.length, settings, mode, history, historyIndex]);

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
    mode,
    setMode,
    settings,
    updateSettings,
    inputImages,
    addImages,
    removeImage,
    clearImages,
    styleReference,
    setStyleReference,
    history,
    selectedImage,
    selectImage,
    clearHistory,
    viewMode,
    setViewMode,
    leftSidebarOpen,
    rightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    isInputVisible,
    toggleInputVisibility,
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
    activeTab,
    setActiveTab,
  }), [
    prompt, mode, settings, inputImages, styleReference, history, selectedImage,
    viewMode, leftSidebarOpen, rightSidebarOpen, isInputVisible, zoom,
    canUndo, canRedo, isGenerating, thinkingSteps, activeTab,
    updateSettings, addImages, removeImage, clearImages, setStyleReference,
    selectImage, clearHistory, toggleLeftSidebar, toggleRightSidebar,
    toggleInputVisibility, undo, redo, generate, cancelGeneration,
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
