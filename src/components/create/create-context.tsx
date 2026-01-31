"use client";

import * as React from "react";
import type { ApiConfig } from "@/types/api-config";

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Gemini 3 Pro Image Preview API types
export type ImageSize = "1K" | "2K" | "4K";
export type AspectRatio =
  | "1:1"
  | "2:3" | "3:2"
  | "3:4" | "4:3"
  | "4:5" | "5:4"
  | "9:16" | "16:9"
  | "21:9";
export type GenerationSpeed = "fast" | "relaxed";
export type ModelId = "nano-banana-pro";

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
  model: ModelId;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  outputCount: number;
  generationSpeed: GenerationSpeed;
  styleStrength: number;
  negativePrompt: string;
}

interface CreateContextType {
  // API selection
  availableApis: ApiConfig[];
  selectedApiId: string | null;
  setSelectedApiId: (id: string | null) => void;
  isLoadingApis: boolean;

  // Prompt state
  prompt: string;
  setPrompt: (prompt: string) => void;
  isPromptExpanded: boolean;
  setIsPromptExpanded: (expanded: boolean) => void;

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
  historyPanelOpen: boolean;
  toggleHistoryPanel: () => void;
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
  pendingBatchJobs: string[];

  // Helper to build final prompt with negative injection
  buildFinalPrompt: () => string;
}

const defaultSettings: CreateSettings = {
  model: "nano-banana-pro",
  imageSize: "2K",
  aspectRatio: "1:1",
  outputCount: 1,
  generationSpeed: "fast",
  styleStrength: 75,
  negativePrompt: "",
};

const CreateContext = React.createContext<CreateContextType | undefined>(undefined);

// Maximum images for reference input (Gemini 3 Pro supports up to 14)
const MAX_REFERENCE_IMAGES = 14;

export function CreateProvider({ children }: { children: React.ReactNode }) {
  // API selection state
  const [availableApis, setAvailableApis] = React.useState<ApiConfig[]>([]);
  const [selectedApiId, setSelectedApiId] = React.useState<string | null>(null);
  const [isLoadingApis, setIsLoadingApis] = React.useState(true);

  const [prompt, setPrompt] = React.useState("");
  const [isPromptExpanded, setIsPromptExpanded] = React.useState(false);
  const [settings, setSettings] = React.useState<CreateSettings>(defaultSettings);
  const [referenceImages, setReferenceImages] = React.useState<ImageFile[]>([]);
  const [history, setHistory] = React.useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = React.useState<GeneratedImage | null>(null);
  const [viewMode, setViewMode] = React.useState<"canvas" | "gallery">("canvas");
  const [historyPanelOpen, setHistoryPanelOpen] = React.useState(true);
  const [isInputVisible, setIsInputVisible] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("create");
  const [zoom, setZoom] = React.useState(100);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [thinkingSteps, setThinkingSteps] = React.useState<ThinkingStep[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [historyStack, setHistoryStack] = React.useState<GeneratedImage[][]>([]);
  const [pendingBatchJobs, setPendingBatchJobs] = React.useState<string[]>([]);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Poll for batch job completion
  const pollBatchJob = React.useCallback(async (
    batchJobId: string,
    originalPrompt: string,
    originalSettings: CreateSettings
  ) => {
    setPendingBatchJobs(prev => [...prev, batchJobId]);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/batch-status?id=${batchJobId}`);
        const data = await response.json();

        if (!data.success || !data.job) {
          clearInterval(pollInterval);
          setPendingBatchJobs(prev => prev.filter(id => id !== batchJobId));
          return;
        }

        const { status, results } = data.job;

        if (status === 'completed' && results) {
          clearInterval(pollInterval);
          setPendingBatchJobs(prev => prev.filter(id => id !== batchJobId));

          // Convert results to GeneratedImage format
          const completedImages: GeneratedImage[] = results
            .filter((r: { success: boolean }) => r.success)
            .map((r: { imageUrl?: string }, i: number) => ({
              id: `batch-result-${batchJobId}-${i}`,
              url: r.imageUrl || '',
              prompt: originalPrompt,
              timestamp: Date.now(),
              settings: originalSettings,
            }));

          if (completedImages.length > 0) {
            // Replace the placeholder with actual images
            setHistory(prev => {
              const filtered = prev.filter(img => img.id !== `batch-${batchJobId}`);
              return [...completedImages, ...filtered];
            });
            setSelectedImage(completedImages[0]);
            setViewMode("canvas");
          }
        } else if (status === 'failed') {
          clearInterval(pollInterval);
          setPendingBatchJobs(prev => prev.filter(id => id !== batchJobId));
          // Remove placeholder from history
          setHistory(prev => prev.filter(img => img.id !== `batch-${batchJobId}`));
          console.error('Batch job failed:', data.job.error);
        } else if (status === 'cancelled') {
          clearInterval(pollInterval);
          setPendingBatchJobs(prev => prev.filter(id => id !== batchJobId));
          setHistory(prev => prev.filter(img => img.id !== `batch-${batchJobId}`));
        }
      } catch (error) {
        console.error('Error polling batch job:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Clean up after 4 hours (max batch time)
    setTimeout(() => {
      clearInterval(pollInterval);
      setPendingBatchJobs(prev => prev.filter(id => id !== batchJobId));
    }, 4 * 60 * 60 * 1000);
  }, []);

  // Fetch available APIs on mount
  React.useEffect(() => {
    async function fetchApis() {
      try {
        const { getAccessibleApiConfigs } = await import("@/utils/supabase/api-configs.server");
        const apis = await getAccessibleApiConfigs();
        setAvailableApis(apis);
        // Auto-select the first API if available
        if (apis.length > 0 && !selectedApiId) {
          setSelectedApiId(apis[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch APIs:", error);
      } finally {
        setIsLoadingApis(false);
      }
    }
    fetchApis();
  }, []);

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

  const toggleHistoryPanel = React.useCallback(() => {
    setHistoryPanelOpen(prev => !prev);
  }, []);

  const toggleInputVisibility = React.useCallback(() => {
    setIsInputVisible(prev => !prev);
  }, []);

  // Build final prompt with negative injection
  const buildFinalPrompt = React.useCallback(() => {
    let finalPrompt = prompt.trim();
    if (settings.negativePrompt.trim()) {
      finalPrompt += `\n\nNegative: ${settings.negativePrompt.trim()}`;
    }
    return finalPrompt;
  }, [prompt, settings.negativePrompt]);

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

    if (settings.generationSpeed === "relaxed") {
      steps.push({ id: "5", text: "Queuing batch job...", completed: false });
    }

    steps.push({ id: "6", text: `Generating ${settings.imageSize} output...`, completed: false });

    return steps;
  }, [referenceImages.length, prompt, settings.imageSize, settings.generationSpeed]);

  const generate = React.useCallback(async () => {
    if (!prompt.trim() && referenceImages.length === 0) return;
    if (!selectedApiId) {
      console.error("No API selected");
      return;
    }

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    // Initialize thinking steps
    const steps = getThinkingSteps();
    setThinkingSteps(steps);

    try {
      // Show thinking steps animation
      for (let i = 0; i < steps.length - 1; i++) {
        if (abortControllerRef.current?.signal.aborted) break;

        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
        setThinkingSteps(prev =>
          prev.map((step, idx) =>
            idx === i ? { ...step, completed: true } : step
          )
        );
      }

      if (abortControllerRef.current?.signal.aborted) return;

      // Convert reference images to base64
      const referenceImagesBase64: string[] = [];
      for (const img of referenceImages) {
        const base64 = await fileToBase64(img.file);
        referenceImagesBase64.push(base64);
      }

      // Build the final prompt
      const finalPrompt = buildFinalPrompt();

      // Call the generation API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiId: selectedApiId,
          prompt: finalPrompt,
          negativePrompt: settings.negativePrompt,
          aspectRatio: settings.aspectRatio,
          imageSize: settings.imageSize,
          outputCount: settings.outputCount,
          referenceImages: referenceImagesBase64,
          mode: settings.generationSpeed, // 'fast' or 'relaxed'
        }),
        signal: abortControllerRef.current.signal,
      });

      // Mark final step as completed
      setThinkingSteps(prev =>
        prev.map((step, idx) =>
          idx === prev.length - 1 ? { ...step, completed: true } : step
        )
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      // Handle batch/relaxed mode
      if (data.mode === 'relaxed' && data.batchJobId) {
        // Start polling for batch job completion
        pollBatchJob(data.batchJobId, finalPrompt, { ...settings });
        // Show a placeholder in history indicating batch job is processing
        const pendingImage: GeneratedImage = {
          id: `batch-${data.batchJobId}`,
          url: '', // Will be filled when batch completes
          prompt: finalPrompt,
          timestamp: Date.now(),
          settings: { ...settings },
        };
        setHistory(prev => [pendingImage, ...prev]);
        return;
      }

      // Handle fast mode (immediate images)
      if (!data.images || data.images.length === 0) {
        throw new Error(data.error || 'No images generated');
      }

      // Convert API response to GeneratedImage format
      const newImages: GeneratedImage[] = data.images.map((img: { url: string }, i: number) => ({
        id: `gen-${Date.now()}-${i}`,
        url: img.url,
        prompt: finalPrompt,
        timestamp: Date.now(),
        settings: { ...settings },
      }));

      // Save to history for undo
      setHistoryStack(prev => [...prev.slice(0, historyIndex + 1), history]);
      setHistoryIndex(prev => prev + 1);

      // Add to history and select first
      setHistory(prev => [...newImages, ...prev]);
      setSelectedImage(newImages[0]);
      setViewMode("canvas");

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Generation was cancelled
        return;
      }
      console.error("Generation error:", error);
      // Could add toast notification here
    } finally {
      setIsGenerating(false);
      setThinkingSteps([]);
    }
  }, [prompt, referenceImages, settings, history, historyIndex, selectedApiId, getThinkingSteps, buildFinalPrompt]);

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
    // API selection
    availableApis,
    selectedApiId,
    setSelectedApiId,
    isLoadingApis,
    // Prompt state
    prompt,
    setPrompt,
    isPromptExpanded,
    setIsPromptExpanded,
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
    historyPanelOpen,
    toggleHistoryPanel,
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
    pendingBatchJobs,
    buildFinalPrompt,
  }), [
    availableApis, selectedApiId, isLoadingApis, pendingBatchJobs,
    prompt, isPromptExpanded, settings, referenceImages, history, selectedImage,
    viewMode, historyPanelOpen, isInputVisible, activeTab, zoom, canUndo, canRedo,
    isGenerating, thinkingSteps,
    updateSettings, addReferenceImages, removeReferenceImage, clearReferenceImages,
    selectImage, clearHistory, toggleHistoryPanel, toggleInputVisibility, undo, redo, generate, cancelGeneration, buildFinalPrompt,
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
