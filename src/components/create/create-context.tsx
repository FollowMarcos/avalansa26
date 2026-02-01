"use client";

import * as React from "react";
import type { ApiConfig } from "@/types/api-config";
import type { Generation } from "@/types/generation";
import type { Canvas, CanvasViewport, ImageNodeData } from "@/types/canvas";
import type { SessionWithCount } from "@/types/session";
import { uploadReferenceImage as uploadToStorage, deleteReferenceImages } from "@/utils/supabase/storage";
import { createClient } from "@/utils/supabase/client";
import type { ReferenceImageWithUrl } from "@/types/reference-image";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";

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
  storagePath?: string; // Path in Supabase Storage
  isUploading?: boolean;
}

// Re-export the database-backed type for components that need it
export type SavedReferenceImage = ReferenceImageWithUrl;

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

// Generation slot states for concurrent image generation (max 4)
export type SlotStatus = "idle" | "generating" | "success" | "failed";

export interface GenerationSlot {
  id: string;
  status: SlotStatus;
  imageUrl?: string;
  error?: string;
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
  addReferenceImageFromUrl: (url: string) => Promise<void>;
  removeReferenceImage: (id: string) => void;
  clearReferenceImages: () => void;

  // Saved reference images library (auto-saved to database)
  savedReferences: SavedReferenceImage[];
  loadSavedReferences: () => Promise<void>;
  removeSavedReference: (id: string) => Promise<void>;
  renameSavedReference: (id: string, name: string) => Promise<void>;
  addSavedReferenceToActive: (saved: SavedReferenceImage) => void;

  // Generation history
  history: GeneratedImage[];
  selectedImage: GeneratedImage | null;
  selectImage: (image: GeneratedImage | null) => void;
  clearHistory: () => void;

  // React Flow nodes and edges
  nodes: Node<ImageNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<ImageNodeData>>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  addImageNode: (image: GeneratedImage) => void;
  deleteNode: (nodeId: string) => void;
  selectImageByNodeId: (nodeId: string) => void;

  // Canvas management
  currentCanvasId: string | null;
  canvasList: Canvas[];
  isSaving: boolean;
  lastSaved: Date | null;
  createNewCanvas: () => Promise<void>;
  switchCanvas: (id: string) => Promise<void>;
  renameCanvas: (id: string, name: string) => Promise<void>;
  deleteCanvas: (id: string) => Promise<void>;

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

  // Generation slots for concurrent image generation (max 4)
  generationSlots: GenerationSlot[];
  selectGeneratedImage: (slotId: string) => void;
  clearGenerationSlots: () => void;

  // Session management
  currentSessionId: string | null;
  currentSessionName: string | null;
  sessions: SessionWithCount[];
  historyGroupedBySession: boolean;
  setHistoryGroupedBySession: (grouped: boolean) => void;
  startNewSession: (name?: string) => void;
  renameCurrentSession: (name: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;

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

// Hoisted RegExp for text content detection (performance optimization)
const TEXT_CONTENT_REGEX = /["']|say|text|sign|label|title|headline|word/i;

// localStorage key prefix for persisting state (user ID will be appended)
const STORAGE_KEY_PREFIX = "create-studio-state";

// Get storage key for a specific user
function getStorageKey(userId: string | null): string {
  return userId ? `${STORAGE_KEY_PREFIX}-${userId}` : STORAGE_KEY_PREFIX;
}

// Interface for persisted state (subset of full state)
interface PersistedState {
  prompt: string;
  settings: CreateSettings;
  currentCanvasId: string | null;
  selectedApiId: string | null;
  nodes: Node<ImageNodeData>[];
  edges: Edge[];
  viewport: CanvasViewport;
  viewMode: "canvas" | "gallery";
  historyPanelOpen: boolean;
  timestamp: number; // For cache invalidation
}

// Load persisted state from localStorage
function loadPersistedState(userId: string | null): Partial<PersistedState> | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedState;
    // Invalidate cache after 24 hours
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// Save state to localStorage (call this with debounce)
function savePersistedState(state: PersistedState, userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    // localStorage might be full or disabled
    console.warn("Failed to save state to localStorage:", error);
  }
}

export function CreateProvider({ children }: { children: React.ReactNode }) {
  // Current user ID for scoping localStorage
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const userIdLoadedRef = React.useRef(false);
  const isInitialLoadRef = React.useRef(true);

  // Fetch current user ID and listen for auth state changes
  React.useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
      userIdLoadedRef.current = true;
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null;

      // Only handle actual user changes after initial load
      if (userIdLoadedRef.current && newUserId !== currentUserId) {
        // Clear in-memory state when user changes
        setPrompt("");
        setSettings(defaultSettings);
        setNodes([]);
        setEdges([]);
        setViewport({ x: 0, y: 0, zoom: 1 });
        setSavedReferences([]);
        setCurrentCanvasId(null);
        hasLoadedPersistedState.current = false;
        isInitialLoadRef.current = true;
      }

      setCurrentUserId(newUserId);
      userIdLoadedRef.current = true;
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId]);

  // API selection state
  const [availableApis, setAvailableApis] = React.useState<ApiConfig[]>([]);
  const [selectedApiId, setSelectedApiId] = React.useState<string | null>(null);
  const [isLoadingApis, setIsLoadingApis] = React.useState(true);

  const [prompt, setPrompt] = React.useState("");
  const [isPromptExpanded, setIsPromptExpanded] = React.useState(false);
  const [settings, setSettings] = React.useState<CreateSettings>(defaultSettings);
  const [referenceImages, setReferenceImages] = React.useState<ImageFile[]>([]);
  const [savedReferences, setSavedReferences] = React.useState<SavedReferenceImage[]>([]);
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

  // Generation slots for tracking concurrent image generation (max 4)
  const [generationSlots, setGenerationSlots] = React.useState<GenerationSlot[]>([
    { id: "slot-0", status: "idle" },
    { id: "slot-1", status: "idle" },
    { id: "slot-2", status: "idle" },
    { id: "slot-3", status: "idle" },
  ]);

  // React Flow state
  const [nodes, setNodes] = React.useState<Node<ImageNodeData>[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);
  const [viewport, setViewport] = React.useState<CanvasViewport>({ x: 0, y: 0, zoom: 1 });

  // Canvas management state
  const [currentCanvasId, setCurrentCanvasId] = React.useState<string | null>(null);
  const [canvasList, setCanvasList] = React.useState<Canvas[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Session management state
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);
  const [currentSessionName, setCurrentSessionName] = React.useState<string | null>(null);
  const [sessions, setSessions] = React.useState<SessionWithCount[]>([]);
  const [historyGroupedBySession, setHistoryGroupedBySession] = React.useState(true);
  // Pending session name - set when user clicks "New Session" but no generation yet
  const [pendingSessionName, setPendingSessionName] = React.useState<string | null>(null);

  // localStorage persistence refs
  const persistTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const hasLoadedPersistedState = React.useRef(false);

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

  // Fetch available APIs, generation history, and sessions in parallel on mount
  React.useEffect(() => {
    async function loadInitialData() {
      // Start all fetches in parallel (async-parallel optimization)
      const apisPromise = import("@/utils/supabase/api-configs.server")
        .then(({ getAccessibleApiConfigs }) => getAccessibleApiConfigs())
        .catch((error) => {
          console.error("Failed to fetch APIs:", error);
          return [] as ApiConfig[];
        });

      const historyPromise = import("@/utils/supabase/generations.server")
        .then(({ getGenerationHistory }) => getGenerationHistory(50))
        .catch((error) => {
          console.error("Failed to load generation history:", error);
          return [] as Generation[];
        });

      const sessionsPromise = import("@/utils/supabase/sessions.server")
        .then(({ getUserSessions }) => getUserSessions())
        .catch((error) => {
          console.error("Failed to load sessions:", error);
          return [] as SessionWithCount[];
        });

      const referencesPromise = import("@/utils/supabase/reference-images.server")
        .then(({ getUserReferenceImages }) => getUserReferenceImages())
        .catch((error) => {
          console.error("Failed to load reference images:", error);
          return [] as ReferenceImageWithUrl[];
        });

      // Wait for all to complete in parallel
      const [apis, generations, userSessions, savedRefs] = await Promise.all([
        apisPromise,
        historyPromise,
        sessionsPromise,
        referencesPromise,
      ]);

      // Process APIs
      setAvailableApis(apis);
      if (apis.length > 0 && !selectedApiId) {
        setSelectedApiId(apis[0].id);
      }
      setIsLoadingApis(false);

      // Process history - convert Generation to GeneratedImage format
      const historyImages: GeneratedImage[] = generations.map((gen: Generation) => ({
        id: gen.id,
        url: gen.image_url,
        prompt: gen.prompt,
        timestamp: new Date(gen.created_at).getTime(),
        settings: {
          model: "nano-banana-pro" as ModelId,
          imageSize: (gen.settings.imageSize as ImageSize) || "2K",
          aspectRatio: (gen.settings.aspectRatio as AspectRatio) || "1:1",
          outputCount: gen.settings.outputCount || 1,
          generationSpeed: (gen.settings.generationSpeed as GenerationSpeed) || "fast",
          styleStrength: 75,
          negativePrompt: gen.negative_prompt || "",
        },
      }));

      setHistory(historyImages);
      // Select the most recent image if available
      if (historyImages.length > 0) {
        setSelectedImage(historyImages[0]);
      }

      // Process sessions
      setSessions(userSessions);
      // Find and set the active session (one without ended_at)
      const activeSession = userSessions.find(s => s.ended_at === null);
      if (activeSession) {
        setCurrentSessionId(activeSession.id);
        setCurrentSessionName(activeSession.name);
      }

      // Process saved reference images from database
      setSavedReferences(savedRefs);

      // Check if we need to backfill sessions for existing generations
      // This runs once per user to migrate existing data
      if (userSessions.length === 0 && generations.length > 0) {
        try {
          const { backfillSessions, getUserSessions: refreshSessions } = await import(
            "@/utils/supabase/sessions.server"
          );
          const sessionsCreated = await backfillSessions();
          if (sessionsCreated > 0) {
            console.log(`Backfilled ${sessionsCreated} sessions for existing generations`);
            // Refresh sessions after backfill
            const refreshedSessions = await refreshSessions();
            setSessions(refreshedSessions);
          }
        } catch (error) {
          console.error("Failed to backfill sessions:", error);
        }
      }

      // Opportunistic cleanup of old empty sessions (once per browser session)
      const cleanupKey = "sessions-cleanup-ran";
      if (typeof window !== "undefined" && !sessionStorage.getItem(cleanupKey)) {
        sessionStorage.setItem(cleanupKey, "true");
        import("@/utils/supabase/sessions.server")
          .then(({ cleanupEmptySessions }) => cleanupEmptySessions())
          .catch((error) => console.error("Failed to cleanup empty sessions:", error));
      }
    }

    loadInitialData();
  }, []);

  const updateSettings = React.useCallback((newSettings: Partial<CreateSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const addReferenceImages = React.useCallback(async (files: File[]) => {
    // Get current user for storage path
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const filesToAdd = files.slice(0, MAX_REFERENCE_IMAGES - referenceImages.length);

    // Add images immediately with uploading state
    const newImages: ImageFile[] = filesToAdd.map(file => ({
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      file,
      preview: URL.createObjectURL(file),
      isUploading: true,
    }));

    setReferenceImages(prev => [...prev, ...newImages].slice(0, MAX_REFERENCE_IMAGES));

    // Upload each image to storage AND save to database (auto-save)
    const { uploadReferenceImage: uploadAndSave } = await import("@/utils/supabase/reference-images.server");

    for (const img of newImages) {
      const savedRef = await uploadAndSave(img.file);

      if (!savedRef) {
        console.error('Failed to upload image');
        // Remove failed upload from state
        setReferenceImages(prev => prev.filter(i => i.id !== img.id));
        URL.revokeObjectURL(img.preview);
      } else {
        // Update active reference with storage path
        setReferenceImages(prev =>
          prev.map(i =>
            i.id === img.id
              ? { ...i, storagePath: savedRef.storage_path, isUploading: false }
              : i
          )
        );
        // Also add to saved references library (auto-save)
        setSavedReferences(prev => [savedRef, ...prev]);
      }
    }
  }, [referenceImages.length]);

  const removeReferenceImage = React.useCallback((id: string) => {
    setReferenceImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.preview);
        // Note: We don't delete from storage/database here since the image
        // is auto-saved to the library. User can delete from library separately.
      }
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const clearReferenceImages = React.useCallback(() => {
    // Just clear from active state, don't delete from library
    referenceImages.forEach(img => URL.revokeObjectURL(img.preview));
    setReferenceImages([]);
  }, [referenceImages]);

  /**
   * Add a reference image from a URL (for using generated images as references)
   */
  const addReferenceImageFromUrl = React.useCallback(async (url: string) => {
    if (referenceImages.length >= MAX_REFERENCE_IMAGES) {
      console.warn('Maximum reference images reached');
      return;
    }

    try {
      // Get current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Use proxy endpoint to bypass CORS restrictions for cross-origin images
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();

      // Create a File object from the blob
      const filename = `reference-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
      const file = new File([blob], filename, { type: blob.type });

      // Create preview URL
      const preview = URL.createObjectURL(blob);
      const id = `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Add to state with loading indicator
      const newImage: ImageFile = {
        id,
        file,
        preview,
        isUploading: true,
      };
      setReferenceImages(prev => [...prev, newImage].slice(0, MAX_REFERENCE_IMAGES));

      // Upload to storage AND save to database (auto-save)
      const { uploadReferenceImage: uploadAndSave } = await import("@/utils/supabase/reference-images.server");
      const savedRef = await uploadAndSave(file);

      if (!savedRef) {
        console.error('Failed to upload reference image');
        setReferenceImages(prev => prev.filter(i => i.id !== id));
        URL.revokeObjectURL(preview);
        return;
      }

      // Update active reference with storage path
      setReferenceImages(prev =>
        prev.map(img =>
          img.id === id ? { ...img, storagePath: savedRef.storage_path, isUploading: false } : img
        )
      );
      // Also add to saved references library (auto-save)
      setSavedReferences(prev => [savedRef, ...prev]);
    } catch (error) {
      console.error('Failed to add reference image from URL:', error);
    }
  }, [referenceImages.length]);

  /**
   * Load saved reference images from database
   */
  const loadSavedReferences = React.useCallback(async () => {
    try {
      const { getUserReferenceImages } = await import("@/utils/supabase/reference-images.server");
      const refs = await getUserReferenceImages();
      setSavedReferences(refs);
    } catch (error) {
      console.error("Failed to load saved references:", error);
    }
  }, []);

  /**
   * Remove a saved reference from the library (and storage)
   */
  const removeSavedReference = React.useCallback(async (id: string) => {
    try {
      const { deleteReferenceImage } = await import("@/utils/supabase/reference-images.server");
      const success = await deleteReferenceImage(id);
      if (success) {
        setSavedReferences(prev => prev.filter(ref => ref.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete reference image:", error);
    }
  }, []);

  /**
   * Rename a saved reference image
   */
  const renameSavedReference = React.useCallback(async (id: string, name: string) => {
    try {
      const { updateReferenceImage } = await import("@/utils/supabase/reference-images.server");
      const updated = await updateReferenceImage(id, { name });
      if (updated) {
        setSavedReferences(prev =>
          prev.map(ref => ref.id === id ? { ...ref, name } : ref)
        );
      }
    } catch (error) {
      console.error("Failed to rename reference image:", error);
    }
  }, []);

  /**
   * Add a saved reference image to the active references (no re-upload needed)
   */
  const addSavedReferenceToActive = React.useCallback((saved: SavedReferenceImage) => {
    if (referenceImages.length >= MAX_REFERENCE_IMAGES) {
      console.warn('Maximum reference images reached');
      return;
    }

    // Create a local reference pointing to the already-saved image
    const newImage: ImageFile = {
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: new File([], saved.name || 'reference'), // Placeholder file
      preview: saved.url,
      storagePath: saved.storage_path,
      isUploading: false,
    };
    setReferenceImages(prev => [...prev, newImage].slice(0, MAX_REFERENCE_IMAGES));
  }, [referenceImages.length]);

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

  // Session management functions

  // Load user's sessions
  const loadSessions = React.useCallback(async () => {
    try {
      const { getUserSessions } = await import("@/utils/supabase/sessions.server");
      const userSessions = await getUserSessions();
      setSessions(userSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }, []);

  // Start a new named session (lazy - session created on first generation)
  const startNewSession = React.useCallback((name?: string) => {
    // Set pending session name - the actual session will be created
    // by the API route when the user generates their first image
    const sessionName = name || `Session ${sessions.length + 1}`;
    setPendingSessionName(sessionName);
    setCurrentSessionName(sessionName);
    // Clear current session so next generation starts a new one
    setCurrentSessionId(null);
  }, [sessions.length]);

  // Rename current session
  const renameCurrentSession = React.useCallback(async (name: string) => {
    if (!currentSessionId) return;
    try {
      const { renameSession } = await import("@/utils/supabase/sessions.server");
      const session = await renameSession(currentSessionId, name);
      if (session) {
        setCurrentSessionName(session.name);
        // Refresh sessions list
        loadSessions();
      }
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  }, [currentSessionId, loadSessions]);

  // Delete a session
  const deleteSessionById = React.useCallback(async (sessionId: string) => {
    try {
      const { deleteSession } = await import("@/utils/supabase/sessions.server");
      const success = await deleteSession(sessionId, true); // Delete generations too
      if (success) {
        // Clear current session if it was deleted
        if (sessionId === currentSessionId) {
          setCurrentSessionId(null);
          setCurrentSessionName(null);
        }
        // Refresh sessions list and history
        loadSessions();
        // Also reload history since generations were deleted
        const { getGenerationHistory } = await import("@/utils/supabase/generations.server");
        const generations = await getGenerationHistory(50);
        const historyImages: GeneratedImage[] = generations.map((gen: Generation) => ({
          id: gen.id,
          url: gen.image_url,
          prompt: gen.prompt,
          timestamp: new Date(gen.created_at).getTime(),
          settings: {
            model: "nano-banana-pro" as ModelId,
            imageSize: (gen.settings.imageSize as ImageSize) || "2K",
            aspectRatio: (gen.settings.aspectRatio as AspectRatio) || "1:1",
            outputCount: gen.settings.outputCount || 1,
            generationSpeed: (gen.settings.generationSpeed as GenerationSpeed) || "fast",
            styleStrength: 75,
            negativePrompt: "",
          },
        }));
        setHistory(historyImages);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  }, [currentSessionId, loadSessions]);

  // Dynamic thinking steps based on context
  const getThinkingSteps = React.useCallback((): ThinkingStep[] => {
    const steps: ThinkingStep[] = [
      { id: "1", text: "Analyzing prompt intent...", completed: false },
      { id: "2", text: "Planning scene composition...", completed: false },
    ];

    if (referenceImages.length > 0) {
      steps.push({ id: "3", text: `Processing ${referenceImages.length} reference image${referenceImages.length > 1 ? 's' : ''}...`, completed: false });
    }

    // Check if prompt likely contains text to render (uses hoisted regex for performance)
    const hasTextContent = TEXT_CONTENT_REGEX.test(prompt);
    if (hasTextContent) {
      steps.push({ id: "4", text: "Aligning text elements...", completed: false });
    }

    if (settings.generationSpeed === "relaxed") {
      steps.push({ id: "5", text: "Queuing batch job...", completed: false });
    }

    steps.push({ id: "6", text: `Generating ${settings.imageSize} output...`, completed: false });

    return steps;
  }, [referenceImages.length, prompt, settings.imageSize, settings.generationSpeed]);

  // Track which slot indices are being used in the current generation batch
  const activeSlotIndicesRef = React.useRef<number[]>([]);

  const generate = React.useCallback(async () => {
    if (!prompt.trim() && referenceImages.length === 0) return;
    if (!selectedApiId) {
      console.error("No API selected");
      return;
    }

    // Determine how many images to generate (max 4 for Google API)
    const outputCount = Math.min(settings.outputCount, 4);

    // Find available (idle) slots to use for this batch
    let currentSlots = generationSlots;
    let availableIndices: number[] = [];
    for (let i = 0; i < currentSlots.length && availableIndices.length < outputCount; i++) {
      if (currentSlots[i].status === "idle") {
        availableIndices.push(i);
      }
    }

    // If no idle slots available, auto-clear all slots to make room for new generation
    if (availableIndices.length === 0) {
      // Reset all slots to idle
      const freshSlots: GenerationSlot[] = [
        { id: "slot-0", status: "idle" },
        { id: "slot-1", status: "idle" },
        { id: "slot-2", status: "idle" },
        { id: "slot-3", status: "idle" },
      ];
      setGenerationSlots(freshSlots);
      currentSlots = freshSlots;

      // Now all slots are available
      availableIndices = [];
      for (let i = 0; i < outputCount; i++) {
        availableIndices.push(i);
      }
    }

    // Store which slots we're using for this batch
    activeSlotIndicesRef.current = availableIndices;
    const actualOutputCount = availableIndices.length;

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    // Initialize thinking steps
    const steps = getThinkingSteps();
    setThinkingSteps(steps);

    // Mark only the selected idle slots as generating (preserve other slots)
    setGenerationSlots(prev => prev.map((slot, idx) => {
      if (availableIndices.includes(idx)) {
        return {
          ...slot,
          status: "generating" as SlotStatus,
          imageUrl: undefined,
          error: undefined,
        };
      }
      return slot;
    }));

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

      // Wait for any uploading images to complete
      const uploadingImages = referenceImages.filter(img => img.isUploading);
      if (uploadingImages.length > 0) {
        // Wait a bit for uploads to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Get storage paths for reference images (skip any still uploading)
      const referenceImagePaths = referenceImages
        .filter(img => img.storagePath && !img.isUploading)
        .map(img => img.storagePath!);

      // Build the final prompt
      const finalPrompt = buildFinalPrompt();

      // Session is now created server-side AFTER successful generation (lazy creation)
      // We pass canvasId and pendingSessionName so the API can create the session

      // Debug: Log the exact parameters being sent
      const requestParams: {
        apiId: string;
        prompt: string;
        negativePrompt: string;
        aspectRatio: AspectRatio;
        imageSize: ImageSize;
        outputCount: number;
        referenceImagePaths: string[];
        mode: GenerationSpeed;
        canvasId: string | null;
        pendingSessionName: string | null;
      } = {
        apiId: selectedApiId,
        prompt: finalPrompt,
        negativePrompt: settings.negativePrompt,
        aspectRatio: settings.aspectRatio,
        imageSize: settings.imageSize,
        outputCount: settings.outputCount,
        referenceImagePaths, // Storage paths instead of base64
        mode: settings.generationSpeed, // 'fast' or 'relaxed'
        canvasId: currentCanvasId, // Canvas for session association
        pendingSessionName, // User-requested new session name (if any)
      };
      console.log('[Generate] Sending request with params:', {
        ...requestParams,
        prompt: requestParams.prompt.slice(0, 100) + '...', // Truncate for readability
      });

      // Update request params to use actual available slot count
      requestParams.outputCount = actualOutputCount;

      // Call the generation API with storage paths (not base64)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
        signal: abortControllerRef.current.signal,
      });

      // Mark final step as completed
      setThinkingSteps(prev =>
        prev.map((step, idx) =>
          idx === prev.length - 1 ? { ...step, completed: true } : step
        )
      );

      if (!response.ok) {
        // Try to parse error message from JSON, fallback to status text
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response wasn't JSON (e.g., HTML error page)
          if (response.status === 413) {
            errorMessage = 'Images are too large. Try using fewer or smaller reference images.';
          }
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid response from server. Please try again.');
      }

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
        // Mark only our batch slots as failed (not all generating slots)
        const batchIndices = activeSlotIndicesRef.current;
        setGenerationSlots(prev => prev.map((slot, idx) =>
          batchIndices.includes(idx) && slot.status === "generating"
            ? { ...slot, status: "failed" as SlotStatus, error: data.error || 'No images generated' }
            : slot
        ));
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

      // Update only our batch slots with results (using tracked indices)
      const batchIndices = activeSlotIndicesRef.current;
      setGenerationSlots(prev => prev.map((slot, idx) => {
        const batchPosition = batchIndices.indexOf(idx);
        if (batchPosition !== -1) {
          // This slot is part of our current batch
          if (batchPosition < newImages.length) {
            return {
              ...slot,
              status: "success" as SlotStatus,
              imageUrl: newImages[batchPosition].url,
            };
          } else {
            // Fewer images returned than expected
            return { ...slot, status: "failed" as SlotStatus, error: "No image generated" };
          }
        }
        // Not part of our batch, preserve existing state
        return slot;
      }));

      // Update session state from API response (lazy session creation)
      if (data.sessionId) {
        setCurrentSessionId(data.sessionId);
        // Clear pending session name since it's now created
        setPendingSessionName(null);
        // Refresh sessions list to include the new session
        loadSessions();
      }

      // Save to history for undo
      setHistoryStack(prev => [...prev.slice(0, historyIndex + 1), history]);
      setHistoryIndex(prev => prev + 1);

      // Add to history and select first
      setHistory(prev => [...newImages, ...prev]);
      setSelectedImage(newImages[0]);
      setViewMode("canvas");

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Generation was cancelled - slots already reset by cancelGeneration
        return;
      }
      console.error("Generation error:", error);
      // Mark only our batch slots as failed (using tracked indices)
      const batchIndices = activeSlotIndicesRef.current;
      setGenerationSlots(prev => prev.map((slot, idx) =>
        batchIndices.includes(idx) && slot.status === "generating"
          ? { ...slot, status: "failed" as SlotStatus, error: error instanceof Error ? error.message : "Generation failed" }
          : slot
      ));
    } finally {
      setIsGenerating(false);
      setThinkingSteps([]);
      // Note: Don't reset slots here - let user see results and select images
    }
  }, [prompt, referenceImages, settings, history, historyIndex, selectedApiId, getThinkingSteps, buildFinalPrompt, generationSlots, currentCanvasId, pendingSessionName, loadSessions]);

  const cancelGeneration = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setThinkingSteps([]);
    // Reset all slots to idle
    setGenerationSlots([
      { id: "slot-0", status: "idle" },
      { id: "slot-1", status: "idle" },
      { id: "slot-2", status: "idle" },
      { id: "slot-3", status: "idle" },
    ]);
  }, []);

  // Select a generated image from a slot and add to history
  const selectGeneratedImage = React.useCallback((slotId: string) => {
    const slot = generationSlots.find(s => s.id === slotId);
    if (slot?.status === "success" && slot.imageUrl) {
      // Find the corresponding image in history by URL
      const image = history.find(h => h.url === slot.imageUrl);
      if (image) {
        setSelectedImage(image);
        setViewMode("canvas");
      }
    }
    // Reset slots after selection
    setGenerationSlots([
      { id: "slot-0", status: "idle" },
      { id: "slot-1", status: "idle" },
      { id: "slot-2", status: "idle" },
      { id: "slot-3", status: "idle" },
    ]);
  }, [generationSlots, history]);

  // Clear all generation slots (dismiss progress UI)
  const clearGenerationSlots = React.useCallback(() => {
    setGenerationSlots([
      { id: "slot-0", status: "idle" },
      { id: "slot-1", status: "idle" },
      { id: "slot-2", status: "idle" },
      { id: "slot-3", status: "idle" },
    ]);
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

  // React Flow handlers
  const onNodesChange: OnNodesChange<Node<ImageNodeData>> = React.useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      setHasUnsavedChanges(true);
    },
    []
  );

  const onEdgesChange: OnEdgesChange<Edge> = React.useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      setHasUnsavedChanges(true);
    },
    []
  );

  const onConnect: OnConnect = React.useCallback(
    (connection) => {
      setEdges((eds) => addEdge(connection, eds));
      setHasUnsavedChanges(true);
    },
    []
  );

  // Calculate position for new node (grid layout)
  const getNextNodePosition = React.useCallback(() => {
    const COLS = 4;
    const SPACING_X = 300;
    const SPACING_Y = 380;
    const nodeCount = nodes.length;
    const row = Math.floor(nodeCount / COLS);
    const col = nodeCount % COLS;
    return {
      x: col * SPACING_X + 50,
      y: row * SPACING_Y + 50,
    };
  }, [nodes.length]);

  // Add a new image node from a generated image
  const addImageNode = React.useCallback((image: GeneratedImage) => {
    const position = getNextNodePosition();
    const newNode: Node<ImageNodeData> = {
      id: `node-${image.id}`,
      type: 'imageNode',
      position,
      data: {
        generationId: image.id,
        imageUrl: image.url,
        prompt: image.prompt,
        negativePrompt: image.settings.negativePrompt,
        timestamp: image.timestamp,
        settings: {
          aspectRatio: image.settings.aspectRatio,
          imageSize: image.settings.imageSize,
          outputCount: image.settings.outputCount,
          generationSpeed: image.settings.generationSpeed,
        },
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  }, [getNextNodePosition]);

  // Delete a node from the canvas
  const deleteNode = React.useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    // Also remove any edges connected to this node
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    // Clear selection if the deleted node was selected
    setSelectedImage((prev) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node && prev?.id === node.data.generationId) {
        return null;
      }
      return prev;
    });
    setHasUnsavedChanges(true);
  }, [nodes]);

  // Select image by node ID
  const selectImageByNodeId = React.useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const image = history.find((h) => h.id === node.data.generationId);
      if (image) {
        setSelectedImage(image);
      }
    }
  }, [nodes, history]);

  // Auto-save canvas with debounce
  const autoSaveCanvas = React.useCallback(async () => {
    if (!currentCanvasId || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      const { updateCanvas } = await import("@/utils/supabase/canvases.server");
      await updateCanvas(currentCanvasId, {
        nodes,
        edges,
        viewport,
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to auto-save canvas:", error);
    } finally {
      setIsSaving(false);
    }
  }, [currentCanvasId, hasUnsavedChanges, nodes, edges, viewport]);

  // Debounced auto-save effect
  React.useEffect(() => {
    if (hasUnsavedChanges && currentCanvasId) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        autoSaveCanvas();
      }, 2000); // 2 second debounce
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, currentCanvasId, autoSaveCanvas]);

  // Create a new canvas
  const createNewCanvas = React.useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { createCanvas } = await import("@/utils/supabase/canvases.server");
      const canvas = await createCanvas({
        user_id: user.id,
        name: `Canvas ${canvasList.length + 1}`,
      });

      if (canvas) {
        setCanvasList((prev) => [canvas, ...prev]);
        setCurrentCanvasId(canvas.id);
        setNodes([]);
        setEdges([]);
        setViewport({ x: 0, y: 0, zoom: 1 });
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to create canvas:", error);
    }
  }, [canvasList.length]);

  // Switch to a different canvas
  const switchCanvas = React.useCallback(async (id: string) => {
    // Save current canvas first if there are unsaved changes
    if (currentCanvasId && hasUnsavedChanges) {
      await autoSaveCanvas();
    }

    try {
      const { getCanvas } = await import("@/utils/supabase/canvases.server");
      const canvas = await getCanvas(id);

      if (canvas) {
        setCurrentCanvasId(canvas.id);
        setNodes(canvas.nodes || []);
        setEdges(canvas.edges || []);
        setViewport(canvas.viewport || { x: 0, y: 0, zoom: 1 });
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to switch canvas:", error);
    }
  }, [currentCanvasId, hasUnsavedChanges, autoSaveCanvas]);

  // Rename a canvas
  const renameCanvas = React.useCallback(async (id: string, name: string) => {
    try {
      const { updateCanvas } = await import("@/utils/supabase/canvases.server");
      await updateCanvas(id, { name });
      setCanvasList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name } : c))
      );
    } catch (error) {
      console.error("Failed to rename canvas:", error);
    }
  }, []);

  // Delete a canvas
  const deleteCanvasById = React.useCallback(async (id: string) => {
    try {
      const { deleteCanvas } = await import("@/utils/supabase/canvases.server");
      await deleteCanvas(id);
      setCanvasList((prev) => prev.filter((c) => c.id !== id));

      // If deleting current canvas, switch to another or create new
      if (currentCanvasId === id) {
        const remaining = canvasList.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          await switchCanvas(remaining[0].id);
        } else {
          await createNewCanvas();
        }
      }
    } catch (error) {
      console.error("Failed to delete canvas:", error);
    }
  }, [currentCanvasId, canvasList, switchCanvas, createNewCanvas]);

  // Load canvases and initialize on mount (after userId is known)
  React.useEffect(() => {
    // Wait for user ID to be loaded before loading canvases
    if (!userIdLoadedRef.current) return;

    async function loadCanvases() {
      try {
        const { getUserCanvases, getLatestCanvas, getCanvas, createCanvas } = await import(
          "@/utils/supabase/canvases.server"
        );

        const canvases = await getUserCanvases();
        setCanvasList(canvases);

        // Check if we have a persisted canvas ID to restore
        const persisted = loadPersistedState(currentUserId);
        const persistedCanvasId = persisted?.currentCanvasId;

        if (canvases.length > 0) {
          let canvasToLoad = null;

          // Try to load the persisted canvas if it exists
          if (persistedCanvasId) {
            const matchingCanvas = canvases.find(c => c.id === persistedCanvasId);
            if (matchingCanvas) {
              canvasToLoad = await getCanvas(persistedCanvasId);
            }
          }

          // Fall back to most recent canvas
          if (!canvasToLoad) {
            canvasToLoad = await getLatestCanvas();
          }

          if (canvasToLoad) {
            setCurrentCanvasId(canvasToLoad.id);
            setNodes(canvasToLoad.nodes || []);
            setEdges(canvasToLoad.edges || []);
            setViewport(canvasToLoad.viewport || { x: 0, y: 0, zoom: 1 });

            // Check for pending nodes from localStorage (unsaved before refresh)
            const pendingNodesStr = sessionStorage.getItem("pending-nodes");
            const pendingEdgesStr = sessionStorage.getItem("pending-edges");

            if (pendingNodesStr && persistedCanvasId === canvasToLoad.id) {
              try {
                const pendingNodes = JSON.parse(pendingNodesStr) as Node<ImageNodeData>[];
                const pendingEdges = pendingEdgesStr ? JSON.parse(pendingEdgesStr) as Edge[] : [];

                // Merge pending nodes that don't exist in loaded canvas
                const existingNodeIds = new Set((canvasToLoad.nodes || []).map((n: Node) => n.id));
                const newNodes = pendingNodes.filter(n => !existingNodeIds.has(n.id));

                if (newNodes.length > 0) {
                  setNodes(prev => [...prev, ...newNodes]);
                  setEdges(prev => [...prev, ...pendingEdges.filter(e =>
                    !prev.some(existing => existing.id === e.id)
                  )]);
                  setHasUnsavedChanges(true);
                }
              } catch {
                // Invalid JSON, ignore
              }

              // Clear pending data
              sessionStorage.removeItem("pending-nodes");
              sessionStorage.removeItem("pending-edges");
            }
          }
        } else {
          // Create a new canvas if none exist
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const newCanvas = await createCanvas({
              user_id: user.id,
              name: "Canvas 1",
            });
            if (newCanvas) {
              setCanvasList([newCanvas]);
              setCurrentCanvasId(newCanvas.id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load canvases:", error);
      }
    }
    loadCanvases();
  }, [currentUserId]);

  // Convert history to nodes when history changes (for new generations)
  const prevHistoryLength = React.useRef(history.length);
  React.useEffect(() => {
    // Only add nodes for new history items
    if (history.length > prevHistoryLength.current) {
      const newItems = history.slice(0, history.length - prevHistoryLength.current);
      for (const item of newItems) {
        // Check if node already exists
        const exists = nodes.some((n) => n.data.generationId === item.id);
        if (!exists && item.url) {
          addImageNode(item);
        }
      }
    }
    prevHistoryLength.current = history.length;
  }, [history, nodes, addImageNode]);

  // Load persisted state from localStorage on mount (after userId is known)
  React.useEffect(() => {
    // Wait for user ID to be loaded before loading persisted state
    if (!userIdLoadedRef.current) return;
    if (hasLoadedPersistedState.current) return;
    hasLoadedPersistedState.current = true;
    isInitialLoadRef.current = false;

    const persisted = loadPersistedState(currentUserId);
    if (persisted) {
      // Restore prompt and settings
      if (persisted.prompt) setPrompt(persisted.prompt);
      if (persisted.settings) setSettings(persisted.settings);
      if (persisted.selectedApiId) setSelectedApiId(persisted.selectedApiId);
      if (persisted.viewMode) setViewMode(persisted.viewMode);
      if (persisted.historyPanelOpen !== undefined) setHistoryPanelOpen(persisted.historyPanelOpen);

      // Note: nodes/edges/viewport are loaded from the database via loadCanvases
      // but we keep the persisted currentCanvasId to ensure we load the right canvas
      if (persisted.currentCanvasId) {
        // This will be used by loadCanvases if it matches
        setCurrentCanvasId(persisted.currentCanvasId);
      }

      // If there are unsaved nodes in localStorage (user closed before auto-save)
      // we'll merge them after canvas loads
      if (persisted.nodes && persisted.nodes.length > 0) {
        // Store for potential merge after canvas load
        sessionStorage.setItem("pending-nodes", JSON.stringify(persisted.nodes));
        sessionStorage.setItem("pending-edges", JSON.stringify(persisted.edges || []));
      }
    }

    // Saved references are now loaded from database in loadInitialData()
  }, [currentUserId]);

  // Persist state to localStorage on changes (debounced)
  React.useEffect(() => {
    // Skip during initial load or if user ID not yet loaded
    if (!hasLoadedPersistedState.current) return;
    if (!userIdLoadedRef.current) return;

    // Clear existing timeout
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    // Debounce the save (1 second)
    persistTimeoutRef.current = setTimeout(() => {
      const stateToSave: PersistedState = {
        prompt,
        settings,
        currentCanvasId,
        selectedApiId,
        nodes,
        edges,
        viewport,
        viewMode,
        historyPanelOpen,
        timestamp: Date.now(),
      };
      savePersistedState(stateToSave, currentUserId);
    }, 1000);

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [prompt, settings, currentCanvasId, selectedApiId, nodes, edges, viewport, viewMode, historyPanelOpen, currentUserId]);

  // Save state immediately before page unload
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (!userIdLoadedRef.current) return;
      const stateToSave: PersistedState = {
        prompt,
        settings,
        currentCanvasId,
        selectedApiId,
        nodes,
        edges,
        viewport,
        viewMode,
        historyPanelOpen,
        timestamp: Date.now(),
      };
      savePersistedState(stateToSave, currentUserId);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [prompt, settings, currentCanvasId, selectedApiId, nodes, edges, viewport, viewMode, historyPanelOpen, currentUserId]);

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
    addReferenceImageFromUrl,
    removeReferenceImage,
    clearReferenceImages,
    // Saved references (database-backed)
    savedReferences,
    loadSavedReferences,
    removeSavedReference,
    renameSavedReference,
    addSavedReferenceToActive,
    history,
    selectedImage,
    selectImage,
    clearHistory,
    // React Flow
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addImageNode,
    deleteNode,
    selectImageByNodeId,
    // Canvas management
    currentCanvasId,
    canvasList,
    isSaving,
    lastSaved,
    createNewCanvas,
    switchCanvas,
    renameCanvas,
    deleteCanvas: deleteCanvasById,
    // UI state
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
    generationSlots,
    selectGeneratedImage,
    clearGenerationSlots,
    // Session management
    currentSessionId,
    currentSessionName,
    sessions,
    historyGroupedBySession,
    setHistoryGroupedBySession,
    startNewSession,
    renameCurrentSession,
    loadSessions,
    deleteSession: deleteSessionById,
    buildFinalPrompt,
  }), [
    availableApis, selectedApiId, isLoadingApis, pendingBatchJobs,
    prompt, isPromptExpanded, settings, referenceImages, history, selectedImage,
    nodes, edges, onNodesChange, onEdgesChange, onConnect, addImageNode, deleteNode, selectImageByNodeId,
    currentCanvasId, canvasList, isSaving, lastSaved, createNewCanvas, switchCanvas, renameCanvas, deleteCanvasById,
    viewMode, historyPanelOpen, isInputVisible, activeTab, zoom, canUndo, canRedo,
    isGenerating, thinkingSteps, generationSlots,
    currentSessionId, currentSessionName, sessions, historyGroupedBySession,
    updateSettings, addReferenceImages, addReferenceImageFromUrl, removeReferenceImage, clearReferenceImages,
    savedReferences, loadSavedReferences, removeSavedReference, renameSavedReference, addSavedReferenceToActive,
    selectImage, clearHistory, toggleHistoryPanel, toggleInputVisibility, undo, redo, generate, cancelGeneration, selectGeneratedImage, clearGenerationSlots,
    startNewSession, renameCurrentSession, loadSessions, deleteSessionById, buildFinalPrompt,
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
