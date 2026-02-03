"use client";

import * as React from "react";
import type { ApiConfig } from "@/types/api-config";
import type { Generation, Collection, Tag } from "@/types/generation";
import type { Canvas, CanvasViewport, ImageNodeData } from "@/types/canvas";
import type { SessionWithCount } from "@/types/session";
import { uploadReferenceImage as uploadToStorage } from "@/utils/supabase/storage";
import { createClient } from "@/utils/supabase/client";
import type { ReferenceImageWithUrl } from "@/types/reference-image";
import type { CreateSettings as AdminCreateSettings } from "@/types/create-settings";
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

// Gallery filter types
export type GallerySortOption = "newest" | "oldest" | "prompt-asc" | "prompt-desc";

export interface GalleryFilters {
  aspectRatio: AspectRatio[];
  imageSize: ImageSize[];
  sessionId: string | null;
  showFavoritesOnly: boolean;
  tagIds: string[];
  collectionId: string | null;
}

export interface GalleryFilterState {
  searchQuery: string;
  sortBy: GallerySortOption;
  filters: GalleryFilters;
  bulkSelection: {
    enabled: boolean;
    selectedIds: Set<string>;
  };
}

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
  status?: "pending" | "completed" | "failed"; // For relax mode async generation
  isFavorite?: boolean;
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
  addReferenceImageFromUrl: (url: string) => Promise<void>;
  removeReferenceImage: (id: string) => void;
  clearReferenceImages: () => void;
  reuseImageSetup: (image: GeneratedImage) => Promise<void>;

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

  // Concurrent generation tracking (max 4)
  activeGenerations: number; // Number of currently active generations
  hasAvailableSlots: boolean; // True if can start new generation (< 4 active)
  retryGeneration: (nodeId: string) => Promise<void>;
  updateNodeData: (nodeId: string, updates: Partial<ImageNodeData>) => void;

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

  // Gallery filters
  galleryFilterState: GalleryFilterState;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: GallerySortOption) => void;
  setGalleryFilters: (filters: Partial<GalleryFilters>) => void;
  clearGalleryFilters: () => void;
  toggleBulkSelection: () => void;
  toggleImageSelection: (id: string) => void;
  selectAllImages: () => void;
  deselectAllImages: () => void;
  getFilteredHistory: () => GeneratedImage[];
  bulkDeleteImages: (ids: string[]) => Promise<void>;

  // Favorites
  toggleFavorite: (imageId: string) => Promise<void>;

  // Collections
  collections: Collection[];
  createCollection: (name: string, color?: string, icon?: string) => Promise<Collection | null>;
  updateCollection: (id: string, updates: { name?: string; color?: string; icon?: string }) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addToCollection: (imageId: string, collectionId: string) => Promise<void>;
  removeFromCollection: (imageId: string, collectionId: string) => Promise<void>;
  getImageCollections: (imageId: string) => Collection[];

  // Tags
  tags: Tag[];
  createTag: (name: string, color?: string) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<void>;
  addTagToImage: (imageId: string, tagId: string) => Promise<void>;
  removeTagFromImage: (imageId: string, tagId: string) => Promise<void>;
  createAndAddTag: (imageId: string, tagName: string, color?: string) => Promise<Tag | null>;
  getImageTags: (imageId: string) => Tag[];

  // Image organization data (cached per image)
  imageOrganization: Map<string, { tagIds: string[]; collectionIds: string[] }>;
  loadImageOrganization: (imageId: string) => Promise<void>;

  // Admin settings (for restricting features)
  adminSettings: AdminCreateSettings | null;
  isMaintenanceMode: boolean;
  allowedImageSizes: ImageSize[];
  allowedAspectRatios: AspectRatio[];
  maxOutputCount: number;
  allowFastMode: boolean;
  allowRelaxedMode: boolean;
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
  const [batchCompletedImages, setBatchCompletedImages] = React.useState<GeneratedImage[]>([]);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Track active generation node IDs for concurrency limit (max 4)
  const [activeGenerations, setActiveGenerations] = React.useState<Set<string>>(new Set());
  const activeGenerationNodesRef = React.useRef<Set<string>>(new Set());

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

  // Track which generation IDs have already been added as nodes to prevent duplicates
  // This is declared early so it's available for canvas loading functions
  const processedGenerationIds = React.useRef<Set<string>>(new Set());

  // Session management state
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);
  const [currentSessionName, setCurrentSessionName] = React.useState<string | null>(null);
  const [sessions, setSessions] = React.useState<SessionWithCount[]>([]);
  const [historyGroupedBySession, setHistoryGroupedBySession] = React.useState(true);
  // Pending session name - set when user clicks "New Session" but no generation yet
  const [pendingSessionName, setPendingSessionName] = React.useState<string | null>(null);

  // Admin settings for feature restrictions
  const [adminSettings, setAdminSettings] = React.useState<AdminCreateSettings | null>(null);

  // Gallery filter state
  const [galleryFilterState, setGalleryFilterState] = React.useState<GalleryFilterState>({
    searchQuery: "",
    sortBy: "newest",
    filters: {
      aspectRatio: [],
      imageSize: [],
      sessionId: null,
      showFavoritesOnly: false,
      tagIds: [],
      collectionId: null,
    },
    bulkSelection: {
      enabled: false,
      selectedIds: new Set(),
    },
  });

  // Collections and Tags state
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [imageOrganization, setImageOrganization] = React.useState<Map<string, { tagIds: string[]; collectionIds: string[] }>>(new Map());

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
              status: "completed" as const,
            }));

          if (completedImages.length > 0) {
            // Replace the placeholder with actual images
            setHistory(prev => {
              const filtered = prev.filter(img => img.id !== `batch-${batchJobId}`);
              return [...completedImages, ...filtered];
            });
            setSelectedImage(completedImages[0]);
            setViewMode("canvas");

            // Mark these as needing canvas addition
            setBatchCompletedImages(completedImages);
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
        .then(async ({ getUserReferenceImages, ensureReferenceImagesBucket }) => {
          // Ensure bucket is public before fetching (fixes images uploaded before bucket was made public)
          await ensureReferenceImagesBucket();
          return getUserReferenceImages();
        })
        .catch((error) => {
          console.error("Failed to load reference images:", error);
          return [] as ReferenceImageWithUrl[];
        });

      const adminSettingsPromise = import("@/utils/supabase/create-settings.server")
        .then(({ getCreateSettings }) => getCreateSettings())
        .catch((error) => {
          console.error("Failed to load admin settings:", error);
          return null as AdminCreateSettings | null;
        });

      // Wait for all to complete in parallel
      const [apis, generations, userSessions, savedRefs, loadedAdminSettings] = await Promise.all([
        apisPromise,
        historyPromise,
        sessionsPromise,
        referencesPromise,
        adminSettingsPromise,
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
        isFavorite: gen.is_favorite ?? false,
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

      // Process admin settings
      setAdminSettings(loadedAdminSettings);

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

    // Import client-side storage upload and server action for DB record
    const { uploadReferenceImage: uploadToStorage } = await import("@/utils/supabase/storage");
    const { createReferenceImageRecord } = await import("@/utils/supabase/reference-images.server");

    // Helper: Upload with timeout (60 seconds for large files)
    const uploadWithTimeout = async (file: File, userId: string): Promise<ReferenceImageWithUrl | null> => {
      const UPLOAD_TIMEOUT = 60000; // 60 seconds for large files with compression

      const uploadPromise = async (): Promise<ReferenceImageWithUrl | null> => {
        // Step 1: Upload to storage (client-side, bypasses Server Action limits)
        const { path, url, error } = await uploadToStorage(file, userId);
        if (error || !path) {
          console.error('Storage upload failed:', error);
          return null;
        }

        // Step 2: Create database record (lightweight server action)
        const savedRef = await createReferenceImageRecord(path, file.name);
        if (!savedRef) {
          console.error('Failed to create database record');
          return null;
        }

        return savedRef;
      };

      return Promise.race([
        uploadPromise(),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Upload timed out')), UPLOAD_TIMEOUT)
        ),
      ]).catch((error) => {
        console.error('Upload error:', error);
        return null;
      });
    };

    // Upload all images in parallel with timeout
    const uploadPromises = newImages.map(async (img) => {
      try {
        const savedRef = await uploadWithTimeout(img.file, user.id);

        if (!savedRef) {
          console.error('Failed to upload image:', img.id);
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
      } catch (error) {
        console.error('Upload error for image:', img.id, error);
        setReferenceImages(prev => prev.filter(i => i.id !== img.id));
        URL.revokeObjectURL(img.preview);
      }
    });

    await Promise.all(uploadPromises);
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

    const id = `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let preview: string | null = null;

    try {
      // Get current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Use proxy endpoint to bypass CORS restrictions for cross-origin images
      // Add timeout for fetch (15 seconds)
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 15000);

      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(fetchTimeout);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();

      // Create a File object from the blob
      const filename = `reference-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
      const file = new File([blob], filename, { type: blob.type });

      // Create preview URL
      preview = URL.createObjectURL(blob);

      // Add to state with loading indicator
      const newImage: ImageFile = {
        id,
        file,
        preview,
        isUploading: true,
      };
      setReferenceImages(prev => [...prev, newImage].slice(0, MAX_REFERENCE_IMAGES));

      // Import client-side storage upload and server action for DB record
      const { uploadReferenceImage: uploadToStorage } = await import("@/utils/supabase/storage");
      const { createReferenceImageRecord } = await import("@/utils/supabase/reference-images.server");

      const UPLOAD_TIMEOUT = 60000; // 60 seconds for large files

      const uploadPromise = async (): Promise<ReferenceImageWithUrl | null> => {
        // Step 1: Upload to storage (client-side)
        const { path, error } = await uploadToStorage(file, user.id);
        if (error || !path) {
          console.error('Storage upload failed:', error);
          return null;
        }

        // Step 2: Create database record (lightweight server action)
        const savedRef = await createReferenceImageRecord(path, file.name);
        return savedRef;
      };

      const savedRef = await Promise.race([
        uploadPromise(),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Upload timed out')), UPLOAD_TIMEOUT)
        ),
      ]).catch((error) => {
        console.error('Upload error:', error);
        return null;
      });

      if (!savedRef) {
        console.error('Failed to upload reference image');
        setReferenceImages(prev => prev.filter(i => i.id !== id));
        if (preview) URL.revokeObjectURL(preview);
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
      // Clean up on error
      setReferenceImages(prev => prev.filter(i => i.id !== id));
      if (preview) URL.revokeObjectURL(preview);
    }
  }, [referenceImages.length]);

  /**
   * Reuse a generated image's complete setup (image as reference + prompt + settings)
   */
  const reuseImageSetup = React.useCallback(async (image: GeneratedImage) => {
    // Add image as reference
    await addReferenceImageFromUrl(image.url);

    // Set prompt
    setPrompt(image.prompt);

    // Update settings
    updateSettings({
      aspectRatio: image.settings?.aspectRatio || settings.aspectRatio,
      negativePrompt: image.settings?.negativePrompt || '',
    });
  }, [addReferenceImageFromUrl, setPrompt, updateSettings, settings.aspectRatio]);

  /**
   * Load saved reference images from database
   */
  const loadSavedReferences = React.useCallback(async () => {
    try {
      const { getUserReferenceImages, ensureReferenceImagesBucket } = await import("@/utils/supabase/reference-images.server");
      // Ensure bucket is public (fixes images uploaded before bucket was made public)
      await ensureReferenceImagesBucket();
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
          isFavorite: gen.is_favorite ?? false,
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

  // Helper function to update node data
  const updateNodeData = React.useCallback((nodeId: string, updates: Partial<ImageNodeData>) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    ));
  }, []);

  // Retry a failed generation
  const retryGeneration = React.useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.data.status !== 'failed') return;

    // Add to active generations
    setActiveGenerations(prev => new Set([...prev, nodeId]));
    activeGenerationNodesRef.current.add(nodeId);

    // Reset node to loading
    updateNodeData(nodeId, {
      status: 'loading',
      error: undefined,
      thinkingStep: 'Retrying generation...',
    });

    try {
      // Get the original settings from the node
      const finalPrompt = node.data.prompt + (node.data.negativePrompt ? `\n\nNegative: ${node.data.negativePrompt}` : '');

      // Call the generation API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiId: selectedApiId,
          prompt: finalPrompt,
          negativePrompt: node.data.negativePrompt || '',
          aspectRatio: node.data.settings.aspectRatio,
          imageSize: node.data.settings.imageSize,
          outputCount: 1,
          referenceImagePaths: [],
          mode: node.data.settings.generationSpeed,
          canvasId: currentCanvasId,
          pendingSessionName: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.images || data.images.length === 0) {
        throw new Error(data.error || 'No images generated');
      }

      // Update node with success
      updateNodeData(nodeId, {
        status: 'success',
        imageUrl: data.images[0].url,
        thinkingStep: undefined,
      });

    } catch (error) {
      console.error('Retry generation error:', error);
      updateNodeData(nodeId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Generation failed',
        thinkingStep: undefined,
      });
    } finally {
      // Remove from active generations
      setActiveGenerations(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
      activeGenerationNodesRef.current.delete(nodeId);
    }
  }, [nodes, activeGenerations, selectedApiId, currentCanvasId, updateNodeData]);

  const generate = React.useCallback(async () => {
    if (!prompt.trim() && referenceImages.length === 0) return;
    if (!selectedApiId) {
      console.error("No API selected");
      return;
    }

    // Check concurrency limit (max 4 concurrent generations)
    if (activeGenerations.size >= 4) {
      console.warn('Maximum concurrent generations reached (4)');
      return;
    }

    // Determine how many images to generate (max 4 per API call)
    const outputCount = Math.min(settings.outputCount, 4);

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    // Initialize thinking steps
    const steps = getThinkingSteps();
    setThinkingSteps(steps);

    // Create placeholder nodes immediately at viewport center
    const placeholderNodeIds: string[] = [];
    const centerX = -viewport.x / viewport.zoom + (typeof window !== 'undefined' ? window.innerWidth / 2 / viewport.zoom : 400);
    const centerY = -viewport.y / viewport.zoom + (typeof window !== 'undefined' ? window.innerHeight / 2 / viewport.zoom : 300);

    for (let i = 0; i < outputCount; i++) {
      const nodeId = `node-gen-${Date.now()}-${i}`;
      const generationId = `gen-${Date.now()}-${i}`;

      // Offset each node slightly to avoid overlap
      const offsetX = i * 20;
      const offsetY = i * 20;

      const placeholderNode: Node<ImageNodeData> = {
        id: nodeId,
        type: 'imageNode',
        position: {
          x: centerX + offsetX,
          y: centerY + offsetY,
        },
        data: {
          generationId,
          imageUrl: '', // Empty until generation completes
          prompt: prompt,
          negativePrompt: settings.negativePrompt,
          timestamp: Date.now(),
          settings: {
            aspectRatio: settings.aspectRatio,
            imageSize: settings.imageSize,
            outputCount: settings.outputCount,
            generationSpeed: settings.generationSpeed,
          },
          status: 'loading',
          thinkingStep: 'Initializing...',
        },
      };

      setNodes(prev => [...prev, placeholderNode]);
      placeholderNodeIds.push(nodeId);

      // Track this node in active generations
      setActiveGenerations(prev => new Set([...prev, nodeId]));
      activeGenerationNodesRef.current.add(nodeId);
      processedGenerationIds.current.add(generationId);
    }

    setHasUnsavedChanges(true);

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
      requestParams.outputCount = outputCount;

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
        // Update placeholder nodes with batch job info
        for (const nodeId of placeholderNodeIds) {
          updateNodeData(nodeId, {
            thinkingStep: 'Batch job queued...',
            batchJobId: data.batchJobId,
          });
        }

        // Start polling for batch job completion
        pollBatchJob(data.batchJobId, finalPrompt, { ...settings });

        // Show a placeholder in history indicating batch job is processing
        const pendingImage: GeneratedImage = {
          id: `batch-${data.batchJobId}`,
          url: '', // Will be filled when batch completes
          prompt: finalPrompt,
          timestamp: Date.now(),
          settings: { ...settings },
          status: "pending", // Mark as pending for UI to show loading state
        };
        setHistory(prev => [pendingImage, ...prev]);
        return;
      }

      // Handle fast mode (immediate images)
      if (!data.images || data.images.length === 0) {
        // Mark all placeholder nodes as failed
        for (const nodeId of placeholderNodeIds) {
          updateNodeData(nodeId, {
            status: 'failed',
            error: data.error || 'No images generated',
            thinkingStep: undefined,
          });
        }
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

      // Mark these IDs as processed BEFORE updating history to prevent
      // the history effect from creating duplicate nodes
      for (const img of newImages) {
        processedGenerationIds.current.add(img.id);
      }

      // Update placeholder nodes with actual images
      for (let i = 0; i < placeholderNodeIds.length; i++) {
        const nodeId = placeholderNodeIds[i];
        if (i < newImages.length) {
          // Success - update with image URL
          updateNodeData(nodeId, {
            status: 'success',
            imageUrl: newImages[i].url,
            thinkingStep: undefined,
          });
        } else {
          // Fewer images returned than expected
          updateNodeData(nodeId, {
            status: 'failed',
            error: 'No image generated',
            thinkingStep: undefined,
          });
        }
      }

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
        // Generation was cancelled - remove placeholder nodes
        setNodes(prev => prev.filter(n => !placeholderNodeIds.includes(n.id)));
        for (const nodeId of placeholderNodeIds) {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            processedGenerationIds.current.delete(node.data.generationId);
          }
        }
        return;
      }
      console.error("Generation error:", error);
      // Mark all placeholder nodes as failed
      for (const nodeId of placeholderNodeIds) {
        updateNodeData(nodeId, {
          status: 'failed',
          error: error instanceof Error ? error.message : "Generation failed",
          thinkingStep: undefined,
        });
      }
    } finally {
      setIsGenerating(false);
      setThinkingSteps([]);
      // Remove placeholder nodes from active generations
      for (const nodeId of placeholderNodeIds) {
        setActiveGenerations(prev => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
        activeGenerationNodesRef.current.delete(nodeId);
      }
    }
  }, [prompt, referenceImages, settings, history, historyIndex, selectedApiId, getThinkingSteps, buildFinalPrompt, currentCanvasId, pendingSessionName, loadSessions, viewport, nodes, updateNodeData, activeGenerations, pollBatchJob]);

  const cancelGeneration = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setThinkingSteps([]);
    // Clear all active generations
    activeGenerationNodesRef.current.clear();
    setActiveGenerations(new Set());
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
        status: 'success', // Images from history are already completed
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

        // Clear processedGenerationIds for the new empty canvas
        processedGenerationIds.current.clear();
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

        // Clear and repopulate processedGenerationIds for the new canvas
        processedGenerationIds.current.clear();
        for (const node of (canvas.nodes || []) as Node<ImageNodeData>[]) {
          if (node.data?.generationId) {
            processedGenerationIds.current.add(node.data.generationId);
          }
        }
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

            // Mark all existing nodes as processed to prevent history-to-nodes duplication
            for (const node of (canvasToLoad.nodes || []) as Node<ImageNodeData>[]) {
              if (node.data?.generationId) {
                processedGenerationIds.current.add(node.data.generationId);
              }
            }

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

                  // Also mark pending nodes as processed
                  for (const node of newNodes) {
                    if (node.data?.generationId) {
                      processedGenerationIds.current.add(node.data.generationId);
                    }
                  }
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

  // Stable ref for addImageNode to avoid triggering effect re-runs
  const addImageNodeRef = React.useRef(addImageNode);
  React.useEffect(() => {
    addImageNodeRef.current = addImageNode;
  }, [addImageNode]);

  // Convert history to nodes when history changes (for new generations)
  const prevHistoryLength = React.useRef(history.length);
  React.useEffect(() => {
    // Only add nodes for new history items
    if (history.length > prevHistoryLength.current) {
      const newCount = history.length - prevHistoryLength.current;
      const newItems = history.slice(0, newCount);
      for (const item of newItems) {
        // Check if this item has already been processed (prevents duplicates)
        if (!processedGenerationIds.current.has(item.id) && item.url) {
          processedGenerationIds.current.add(item.id);
          addImageNodeRef.current(item);
        }
      }
    }
    prevHistoryLength.current = history.length;
  }, [history]); // Removed nodes and addImageNode from deps to prevent re-runs when nodes change

  // Add batch-completed images to canvas when they arrive
  React.useEffect(() => {
    if (batchCompletedImages.length === 0) return;

    // Add each completed image to canvas
    for (const img of batchCompletedImages) {
      // Check if this item has already been processed (prevents duplicates)
      if (!processedGenerationIds.current.has(img.id) && img.url) {
        processedGenerationIds.current.add(img.id);
        addImageNodeRef.current(img);
      }
    }

    // Clear the batch completed images after processing
    setBatchCompletedImages([]);
  }, [batchCompletedImages]); // Removed nodes and addImageNode from deps

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

  // Compute whether there are available slots for new generations
  // Maximum 4 concurrent generations allowed
  const hasAvailableSlots = React.useMemo(() => {
    return true; // No global concurrency limit, only per-call limit of 4 images
  }, []);

  // Gallery filter actions
  const setSearchQuery = React.useCallback((query: string) => {
    setGalleryFilterState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setSortBy = React.useCallback((sort: GallerySortOption) => {
    setGalleryFilterState(prev => ({ ...prev, sortBy: sort }));
  }, []);

  const setGalleryFilters = React.useCallback((filters: Partial<GalleryFilters>) => {
    setGalleryFilterState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
  }, []);

  const clearGalleryFilters = React.useCallback(() => {
    setGalleryFilterState(prev => ({
      ...prev,
      searchQuery: "",
      filters: {
        aspectRatio: [],
        imageSize: [],
        sessionId: null,
        showFavoritesOnly: false,
        tagIds: [],
        collectionId: null,
      },
    }));
  }, []);

  const toggleBulkSelection = React.useCallback(() => {
    setGalleryFilterState(prev => ({
      ...prev,
      bulkSelection: {
        enabled: !prev.bulkSelection.enabled,
        selectedIds: new Set(), // Clear selections when toggling
      },
    }));
  }, []);

  const toggleImageSelection = React.useCallback((id: string) => {
    setGalleryFilterState(prev => {
      const newSelectedIds = new Set(prev.bulkSelection.selectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return {
        ...prev,
        bulkSelection: {
          ...prev.bulkSelection,
          selectedIds: newSelectedIds,
        },
      };
    });
  }, []);

  const selectAllImages = React.useCallback(() => {
    setGalleryFilterState(prev => ({
      ...prev,
      bulkSelection: {
        ...prev.bulkSelection,
        selectedIds: new Set(history.map(img => img.id)),
      },
    }));
  }, [history]);

  const deselectAllImages = React.useCallback(() => {
    setGalleryFilterState(prev => ({
      ...prev,
      bulkSelection: {
        ...prev.bulkSelection,
        selectedIds: new Set(),
      },
    }));
  }, []);

  // Get filtered and sorted history
  // Memoize filtered history to avoid recomputing on every render
  const filteredHistory = React.useMemo((): GeneratedImage[] => {
    let result = [...history];

    // Search filter
    if (galleryFilterState.searchQuery) {
      const query = galleryFilterState.searchQuery.toLowerCase();
      result = result.filter(img =>
        img.prompt?.toLowerCase().includes(query)
      );
    }

    // Aspect ratio filter
    if (galleryFilterState.filters.aspectRatio.length > 0) {
      result = result.filter(img =>
        galleryFilterState.filters.aspectRatio.includes(img.settings.aspectRatio)
      );
    }

    // Image size filter
    if (galleryFilterState.filters.imageSize.length > 0) {
      result = result.filter(img =>
        galleryFilterState.filters.imageSize.includes(img.settings.imageSize)
      );
    }

    // Favorites filter
    if (galleryFilterState.filters.showFavoritesOnly) {
      result = result.filter(img => img.isFavorite);
    }

    // Tags filter
    if (galleryFilterState.filters.tagIds.length > 0) {
      result = result.filter(img => {
        const org = imageOrganization.get(img.id);
        if (!org) return false;
        return galleryFilterState.filters.tagIds.some(tagId => org.tagIds.includes(tagId));
      });
    }

    // Collection filter
    if (galleryFilterState.filters.collectionId) {
      result = result.filter(img => {
        const org = imageOrganization.get(img.id);
        if (!org) return false;
        return org.collectionIds.includes(galleryFilterState.filters.collectionId!);
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (galleryFilterState.sortBy) {
        case "newest":
          return b.timestamp - a.timestamp;
        case "oldest":
          return a.timestamp - b.timestamp;
        case "prompt-asc":
          return (a.prompt || "").localeCompare(b.prompt || "");
        case "prompt-desc":
          return (b.prompt || "").localeCompare(a.prompt || "");
        default:
          return 0;
      }
    });

    return result;
  }, [history, galleryFilterState, imageOrganization]);

  // Getter function for backward compatibility
  const getFilteredHistory = React.useCallback(
    () => filteredHistory,
    [filteredHistory]
  );

  // Bulk delete images
  const bulkDeleteImages = React.useCallback(async (ids: string[]) => {
    try {
      const { deleteGeneration } = await import("@/utils/supabase/generations.server");

      // Delete each generation from database
      await Promise.all(ids.map(id => deleteGeneration(id)));

      // Remove from local history
      setHistory(prev => prev.filter(img => !ids.includes(img.id)));

      // Remove from nodes if they exist
      setNodes(prev => prev.filter(node => !ids.includes(node.data.generationId)));

      // Clear selection
      setGalleryFilterState(prev => ({
        ...prev,
        bulkSelection: {
          ...prev.bulkSelection,
          selectedIds: new Set(),
        },
      }));

      // Clear selected image if it was deleted
      if (selectedImage && ids.includes(selectedImage.id)) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error("Failed to delete images:", error);
      throw error;
    }
  }, [selectedImage]);

  // ============================================
  // FAVORITES
  // ============================================

  const toggleFavorite = React.useCallback(async (imageId: string) => {
    // Find current state
    const image = history.find(img => img.id === imageId);
    if (!image) return;

    const newFavoriteState = !image.isFavorite;

    // Optimistic update
    setHistory(prev =>
      prev.map(img =>
        img.id === imageId ? { ...img, isFavorite: newFavoriteState } : img
      )
    );

    // Update selected image if it's the one being toggled
    if (selectedImage?.id === imageId) {
      setSelectedImage(prev => prev ? { ...prev, isFavorite: newFavoriteState } : null);
    }

    try {
      const { toggleFavorite: toggleFavoriteServer } = await import("@/utils/supabase/generations.server");
      const success = await toggleFavoriteServer(imageId, newFavoriteState);

      if (!success) {
        // Revert on failure
        setHistory(prev =>
          prev.map(img =>
            img.id === imageId ? { ...img, isFavorite: !newFavoriteState } : img
          )
        );
        if (selectedImage?.id === imageId) {
          setSelectedImage(prev => prev ? { ...prev, isFavorite: !newFavoriteState } : null);
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      // Revert on error
      setHistory(prev =>
        prev.map(img =>
          img.id === imageId ? { ...img, isFavorite: !newFavoriteState } : img
        )
      );
    }
  }, [history, selectedImage]);

  // ============================================
  // COLLECTIONS
  // ============================================

  const loadCollections = React.useCallback(async () => {
    try {
      const { getCollections } = await import("@/utils/supabase/generations.server");
      const userCollections = await getCollections();
      setCollections(userCollections);
    } catch (error) {
      console.error("Failed to load collections:", error);
    }
  }, []);

  const createCollectionFn = React.useCallback(async (name: string, color?: string, icon?: string): Promise<Collection | null> => {
    try {
      const { createCollection } = await import("@/utils/supabase/generations.server");
      const collection = await createCollection({ name, color, icon });
      if (collection) {
        setCollections(prev => [...prev, collection]);
      }
      return collection;
    } catch (error) {
      console.error("Failed to create collection:", error);
      return null;
    }
  }, []);

  const updateCollectionFn = React.useCallback(async (id: string, updates: { name?: string; color?: string; icon?: string }) => {
    try {
      const { updateCollection } = await import("@/utils/supabase/generations.server");
      const updated = await updateCollection(id, updates);
      if (updated) {
        setCollections(prev => prev.map(c => c.id === id ? updated : c));
      }
    } catch (error) {
      console.error("Failed to update collection:", error);
    }
  }, []);

  const deleteCollectionFn = React.useCallback(async (id: string) => {
    try {
      const { deleteCollection } = await import("@/utils/supabase/generations.server");
      const success = await deleteCollection(id);
      if (success) {
        setCollections(prev => prev.filter(c => c.id !== id));
        // Remove from image organization cache
        setImageOrganization(prev => {
          const next = new Map(prev);
          next.forEach((org, imgId) => {
            if (org.collectionIds.includes(id)) {
              next.set(imgId, {
                ...org,
                collectionIds: org.collectionIds.filter(cId => cId !== id),
              });
            }
          });
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
    }
  }, []);

  const addToCollectionFn = React.useCallback(async (imageId: string, collectionId: string) => {
    try {
      const { addToCollection } = await import("@/utils/supabase/generations.server");
      const success = await addToCollection(imageId, collectionId);
      if (success) {
        setImageOrganization(prev => {
          const next = new Map(prev);
          const existing = next.get(imageId) || { tagIds: [], collectionIds: [] };
          if (!existing.collectionIds.includes(collectionId)) {
            next.set(imageId, {
              ...existing,
              collectionIds: [...existing.collectionIds, collectionId],
            });
          }
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to add to collection:", error);
    }
  }, []);

  const removeFromCollectionFn = React.useCallback(async (imageId: string, collectionId: string) => {
    try {
      const { removeFromCollection } = await import("@/utils/supabase/generations.server");
      const success = await removeFromCollection(imageId, collectionId);
      if (success) {
        setImageOrganization(prev => {
          const next = new Map(prev);
          const existing = next.get(imageId);
          if (existing) {
            next.set(imageId, {
              ...existing,
              collectionIds: existing.collectionIds.filter(id => id !== collectionId),
            });
          }
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to remove from collection:", error);
    }
  }, []);

  const getImageCollections = React.useCallback((imageId: string): Collection[] => {
    const org = imageOrganization.get(imageId);
    if (!org) return [];
    return collections.filter(c => org.collectionIds.includes(c.id));
  }, [imageOrganization, collections]);

  // ============================================
  // TAGS
  // ============================================

  const loadTags = React.useCallback(async () => {
    try {
      const { getTags } = await import("@/utils/supabase/generations.server");
      const userTags = await getTags();
      setTags(userTags);
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  }, []);

  const createTagFn = React.useCallback(async (name: string, color?: string): Promise<Tag | null> => {
    try {
      const { createTag } = await import("@/utils/supabase/generations.server");
      const tag = await createTag({ name, color });
      if (tag) {
        // Only add if not already present (createTag may return existing)
        setTags(prev => {
          if (prev.some(t => t.id === tag.id)) return prev;
          return [...prev, tag];
        });
      }
      return tag;
    } catch (error) {
      console.error("Failed to create tag:", error);
      return null;
    }
  }, []);

  const deleteTagFn = React.useCallback(async (id: string) => {
    try {
      const { deleteTag } = await import("@/utils/supabase/generations.server");
      const success = await deleteTag(id);
      if (success) {
        setTags(prev => prev.filter(t => t.id !== id));
        // Remove from image organization cache
        setImageOrganization(prev => {
          const next = new Map(prev);
          next.forEach((org, imgId) => {
            if (org.tagIds.includes(id)) {
              next.set(imgId, {
                ...org,
                tagIds: org.tagIds.filter(tId => tId !== id),
              });
            }
          });
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  }, []);

  const addTagToImageFn = React.useCallback(async (imageId: string, tagId: string) => {
    try {
      const { addTagToGeneration } = await import("@/utils/supabase/generations.server");
      const success = await addTagToGeneration(imageId, tagId);
      if (success) {
        setImageOrganization(prev => {
          const next = new Map(prev);
          const existing = next.get(imageId) || { tagIds: [], collectionIds: [] };
          if (!existing.tagIds.includes(tagId)) {
            next.set(imageId, {
              ...existing,
              tagIds: [...existing.tagIds, tagId],
            });
          }
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to add tag to image:", error);
    }
  }, []);

  const removeTagFromImageFn = React.useCallback(async (imageId: string, tagId: string) => {
    try {
      const { removeTagFromGeneration } = await import("@/utils/supabase/generations.server");
      const success = await removeTagFromGeneration(imageId, tagId);
      if (success) {
        setImageOrganization(prev => {
          const next = new Map(prev);
          const existing = next.get(imageId);
          if (existing) {
            next.set(imageId, {
              ...existing,
              tagIds: existing.tagIds.filter(id => id !== tagId),
            });
          }
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to remove tag from image:", error);
    }
  }, []);

  const createAndAddTagFn = React.useCallback(async (imageId: string, tagName: string, color?: string): Promise<Tag | null> => {
    try {
      const { createAndAddTag } = await import("@/utils/supabase/generations.server");
      const tag = await createAndAddTag(imageId, tagName, color);
      if (tag) {
        // Add tag to tags list if new
        setTags(prev => {
          if (prev.some(t => t.id === tag.id)) return prev;
          return [...prev, tag];
        });
        // Update image organization
        setImageOrganization(prev => {
          const next = new Map(prev);
          const existing = next.get(imageId) || { tagIds: [], collectionIds: [] };
          if (!existing.tagIds.includes(tag.id)) {
            next.set(imageId, {
              ...existing,
              tagIds: [...existing.tagIds, tag.id],
            });
          }
          return next;
        });
      }
      return tag;
    } catch (error) {
      console.error("Failed to create and add tag:", error);
      return null;
    }
  }, []);

  const getImageTags = React.useCallback((imageId: string): Tag[] => {
    const org = imageOrganization.get(imageId);
    if (!org) return [];
    return tags.filter(t => org.tagIds.includes(t.id));
  }, [imageOrganization, tags]);

  // ============================================
  // IMAGE ORGANIZATION LOADING
  // ============================================

  const loadImageOrganization = React.useCallback(async (imageId: string) => {
    // Skip if already loaded
    if (imageOrganization.has(imageId)) return;

    try {
      const { getGenerationTags, getGenerationCollections } = await import("@/utils/supabase/generations.server");
      const [imageTags, imageCollections] = await Promise.all([
        getGenerationTags(imageId),
        getGenerationCollections(imageId),
      ]);

      setImageOrganization(prev => {
        const next = new Map(prev);
        next.set(imageId, {
          tagIds: imageTags.map(t => t.id),
          collectionIds: imageCollections.map(c => c.id),
        });
        return next;
      });
    } catch (error) {
      console.error("Failed to load image organization:", error);
    }
  }, [imageOrganization]);

  // Load collections and tags on mount
  React.useEffect(() => {
    if (currentUserId) {
      loadCollections();
      loadTags();
    }
  }, [currentUserId, loadCollections, loadTags]);

  // Derive admin settings values
  const isMaintenanceMode = adminSettings?.maintenance_mode ?? false;
  const allowedImageSizes = React.useMemo<ImageSize[]>(() => {
    return (adminSettings?.allowed_image_sizes as ImageSize[]) ?? ["1K", "2K", "4K"];
  }, [adminSettings]);
  const allowedAspectRatios = React.useMemo<AspectRatio[]>(() => {
    return (adminSettings?.allowed_aspect_ratios as AspectRatio[]) ?? [
      "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"
    ];
  }, [adminSettings]);
  const maxOutputCount = adminSettings?.max_output_count ?? 4;
  const allowFastMode = adminSettings?.allow_fast_mode ?? true;
  const allowRelaxedMode = adminSettings?.allow_relaxed_mode ?? true;

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
    reuseImageSetup,
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
    activeGenerations: activeGenerations.size,
    hasAvailableSlots,
    retryGeneration,
    updateNodeData,
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
    // Gallery filters
    galleryFilterState,
    setSearchQuery,
    setSortBy,
    setGalleryFilters,
    clearGalleryFilters,
    toggleBulkSelection,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages,
    getFilteredHistory,
    bulkDeleteImages,
    // Favorites
    toggleFavorite,
    // Collections
    collections,
    createCollection: createCollectionFn,
    updateCollection: updateCollectionFn,
    deleteCollection: deleteCollectionFn,
    addToCollection: addToCollectionFn,
    removeFromCollection: removeFromCollectionFn,
    getImageCollections,
    // Tags
    tags,
    createTag: createTagFn,
    deleteTag: deleteTagFn,
    addTagToImage: addTagToImageFn,
    removeTagFromImage: removeTagFromImageFn,
    createAndAddTag: createAndAddTagFn,
    getImageTags,
    // Image organization
    imageOrganization,
    loadImageOrganization,
    // Admin settings
    adminSettings,
    isMaintenanceMode,
    allowedImageSizes,
    allowedAspectRatios,
    maxOutputCount,
    allowFastMode,
    allowRelaxedMode,
  }), [
    availableApis, selectedApiId, isLoadingApis, pendingBatchJobs,
    prompt, isPromptExpanded, settings, referenceImages, history, selectedImage,
    nodes, edges, onNodesChange, onEdgesChange, onConnect, addImageNode, deleteNode, selectImageByNodeId,
    currentCanvasId, canvasList, isSaving, lastSaved, createNewCanvas, switchCanvas, renameCanvas, deleteCanvasById,
    viewMode, historyPanelOpen, isInputVisible, activeTab, zoom, canUndo, canRedo,
    isGenerating, thinkingSteps, activeGenerations, hasAvailableSlots, retryGeneration, updateNodeData,
    currentSessionId, currentSessionName, sessions, historyGroupedBySession,
    updateSettings, addReferenceImages, addReferenceImageFromUrl, removeReferenceImage, clearReferenceImages,
    savedReferences, loadSavedReferences, removeSavedReference, renameSavedReference, addSavedReferenceToActive,
    selectImage, clearHistory, toggleHistoryPanel, toggleInputVisibility, undo, redo, generate, cancelGeneration,
    startNewSession, renameCurrentSession, loadSessions, deleteSessionById, buildFinalPrompt,
    galleryFilterState, setSearchQuery, setSortBy, setGalleryFilters, clearGalleryFilters,
    toggleBulkSelection, toggleImageSelection, selectAllImages, deselectAllImages, getFilteredHistory, bulkDeleteImages,
    toggleFavorite, collections, createCollectionFn, updateCollectionFn, deleteCollectionFn, addToCollectionFn, removeFromCollectionFn, getImageCollections,
    tags, createTagFn, deleteTagFn, addTagToImageFn, removeTagFromImageFn, createAndAddTagFn, getImageTags,
    imageOrganization, loadImageOrganization,
    adminSettings, isMaintenanceMode, allowedImageSizes, allowedAspectRatios, maxOutputCount, allowFastMode, allowRelaxedMode,
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
