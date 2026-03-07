"use client";

import * as React from "react";
import type { ApiConfig } from "@/types/api-config";
import type { Generation, Collection, Tag } from "@/types/generation";
import { uploadReferenceImage as uploadToStorage } from "@/utils/supabase/storage";
import { createClient } from "@/utils/supabase/client";
import type { ReferenceImageWithUrl } from "@/types/reference-image";
import type { CreateSettings as AdminCreateSettings } from "@/types/create-settings";

/** Check if a string is a valid UUID (database-backed IDs vs temporary local IDs) */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isDbId(id: string): boolean {
  return UUID_RE.test(id);
}

// Gemini image generation API types
export type ImageSize = "0.5K" | "1K" | "2K" | "4K";
export type AspectRatio =
  | "1:1"
  | "2:3" | "3:2"
  | "3:4" | "4:3"
  | "4:5" | "5:4"
  | "9:16" | "16:9"
  | "21:9"
  | "1:4" | "4:1"
  | "1:8" | "8:1";
export type GenerationSpeed = "fast" | "relaxed";
export type ModelId = string;

// Canvas interaction modes (Figma-style)
export type InteractionMode = "select" | "hand";

// Gallery filter types
export type GallerySortOption = "newest" | "oldest" | "prompt-asc" | "prompt-desc" | "prompt-group";

export type DateRangePreset = "last-7-days" | "last-30-days" | "last-90-days" | "custom";

export interface DateRangeFilter {
  preset: DateRangePreset | null;
  from: number | null;
  to: number | null;
}

export interface GalleryFilters {
  aspectRatio: AspectRatio[];
  imageSize: ImageSize[];
  showFavoritesOnly: boolean;
  tagIds: string[];
  collectionId: string | null;
  modelIds: string[];
  dateRange: DateRangeFilter;
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
  status?: "pending" | "completed" | "failed";
  error?: string;
  isFavorite?: boolean;
}

export interface ThinkingStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface ReferenceImageInfo {
  url: string;
  storagePath?: string;
}

/** A reference with optional image and prompt tags (for expression, clothing, location) */
export interface TaggedReference {
  image?: ReferenceImageInfo;
  tags: string[];
  customText: string;
}

export interface CreateSettings {
  model: ModelId;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  outputCount: number;
  generationSpeed: GenerationSpeed;
  styleStrength: number;
  negativePrompt: string;
  referenceImages?: ReferenceImageInfo[];
  /** Source identifier for workflow-generated images (e.g. 'characterTurnaround') */
  source?: string;
  /** Style reference image — art style only, not content */
  styleRef?: ReferenceImageInfo;
  /** Pose reference image — body pose only, not appearance */
  poseRef?: ReferenceImageInfo;
  /** Facial expression reference — image and/or descriptive tags */
  expressionRef?: TaggedReference;
  /** Clothing reference — image and/or descriptive tags */
  clothingRef?: TaggedReference;
  /** Location/background reference — image and/or descriptive tags */
  locationRef?: TaggedReference;
}

export interface VariationSlot {
  id: string;
  secondaryPrompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  apiId: string | null;
  referenceImages: ImageFile[];
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
  loadMoreHistory: () => Promise<void>;
  hasMoreHistory: boolean;
  isLoadingMoreHistory: boolean;

  // UI state
  viewMode: "gallery" | "workflow";
  setViewMode: (mode: "gallery" | "workflow") => void;
  historyPanelOpen: boolean;
  toggleHistoryPanel: () => void;
  isInputVisible: boolean;
  toggleInputVisibility: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;

  // Gallery layout
  galleryColumnCount: number;
  setGalleryColumnCount: (count: number) => void;
  gallerySidebarOpen: boolean;
  setGallerySidebarOpen: (open: boolean) => void;

  // Dock
  dockCollapsed: boolean;
  setDockCollapsed: (collapsed: boolean) => void;

  // Generation
  isGenerating: boolean;
  thinkingSteps: ThinkingStep[];
  generate: () => Promise<void>;
  cancelGeneration: () => void;
  pendingBatchJobs: string[];

  // Concurrency
  hasAvailableSlots: boolean;
  activeGenerations: number;

  // Retry / dismiss
  retryFailedImage: (image: GeneratedImage) => void;
  dismissFailedImage: (id: string) => void;

  // Helper to build final prompt with negative injection
  buildFinalPrompt: () => string;

  // Variations mode
  variationsMode: boolean;
  setVariationsMode: (enabled: boolean) => void;
  variationSlots: VariationSlot[];
  addVariationSlot: () => void;
  removeVariationSlot: (id: string) => void;
  updateVariationSlot: (id: string, updates: Partial<Omit<VariationSlot, "referenceImages">>) => void;
  addVariationReferenceImages: (slotId: string, files: File[]) => Promise<void>;
  removeVariationReferenceImage: (slotId: string, imageId: string) => void;

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

  // Bulk organization
  bulkAddToCollection: (imageIds: string[], collectionId: string) => Promise<void>;
  bulkAddTag: (imageIds: string[], tagId: string) => Promise<void>;

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

  // Inpainting
  inpaintSourceImage: GeneratedImage | null;
  setInpaintSourceImage: (image: GeneratedImage | null) => void;
  isInpainting: boolean;
  inpaint: (maskDataUrl: string, prompt: string, apiId?: string) => Promise<void>;

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

// Clear resolved pending entries from sessionStorage
function clearPendingFromSession(ids: string[]): void {
  try {
    const existing = JSON.parse(sessionStorage.getItem('pending-generations') || '[]') as GeneratedImage[];
    const idSet = new Set(ids);
    const remaining = existing.filter(img => !idSet.has(img.id));
    if (remaining.length > 0) {
      sessionStorage.setItem('pending-generations', JSON.stringify(remaining));
    } else {
      sessionStorage.removeItem('pending-generations');
    }
  } catch { /* ignore */ }
}

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
  selectedApiId: string | null;
  viewMode: "gallery" | "workflow";
  historyPanelOpen: boolean;
  activeReferenceImages?: ReferenceImageInfo[];
  timestamp: number; // For cache invalidation
}

// Load persisted state from localStorage
function loadPersistedState(userId: string | null): Partial<PersistedState> | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = JSON.parse(stored) as any;
    // Invalidate cache after 24 hours
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    // Migration: map old "canvas" viewMode to "gallery"
    if (parsed.viewMode === "canvas") {
      parsed.viewMode = "gallery";
    }
    return parsed as Partial<PersistedState>;
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
        setSavedReferences([]);
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
  const [hasMoreHistory, setHasMoreHistory] = React.useState(true);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"gallery" | "workflow">("gallery");
  const [interactionMode, setInteractionMode] = React.useState<InteractionMode>("select");

  // Inpainting state
  const [inpaintSourceImage, setInpaintSourceImage] = React.useState<GeneratedImage | null>(null);
  const [isInpainting, setIsInpainting] = React.useState(false);

  // Variations mode
  const [variationsMode, setVariationsMode] = React.useState(false);
  const [variationSlots, setVariationSlots] = React.useState<VariationSlot[]>([
    { id: "var-1", secondaryPrompt: "", aspectRatio: "1:1", imageSize: "2K", apiId: null, referenceImages: [] },
  ]);

  // Gallery layout state (with localStorage persistence)
  // Initialize with defaults to avoid hydration mismatch; restore from
  // localStorage in an effect after mount.
  const [galleryColumnCount, setGalleryColumnCount] = React.useState(4);
  const [gallerySidebarOpen, setGallerySidebarOpen] = React.useState(false);

  // Dock collapsed state (with localStorage persistence)
  const [dockCollapsed, setDockCollapsed] = React.useState(false);

  // Restore layout state from localStorage after mount (hydration-safe)
  React.useEffect(() => {
    try {
      const savedCols = localStorage.getItem("gallery-column-count");
      if (savedCols) setGalleryColumnCount(Math.max(2, Math.min(8, parseInt(savedCols, 10) || 4)));
      if (localStorage.getItem("gallery-sidebar-open") === "true") setGallerySidebarOpen(true);
      if (localStorage.getItem("dock-collapsed") === "true") setDockCollapsed(true);
    } catch { /* localStorage unavailable */ }
  }, []);

  // Persist gallery layout to localStorage (skip the initial render to avoid
  // overwriting saved values with defaults before the restore effect applies)
  const layoutInitialRenderRef = React.useRef(true);
  React.useEffect(() => {
    if (layoutInitialRenderRef.current) {
      layoutInitialRenderRef.current = false;
      return;
    }
    localStorage.setItem("gallery-column-count", String(galleryColumnCount));
    localStorage.setItem("gallery-sidebar-open", String(gallerySidebarOpen));
    localStorage.setItem("dock-collapsed", String(dockCollapsed));
  }, [galleryColumnCount, gallerySidebarOpen, dockCollapsed]);
  const [historyPanelOpen, setHistoryPanelOpen] = React.useState(true);
  const [isInputVisible, setIsInputVisible] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("create");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [thinkingSteps, setThinkingSteps] = React.useState<ThinkingStep[]>([]);
  const [pendingBatchJobs, setPendingBatchJobs] = React.useState<string[]>([]);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Admin settings for feature restrictions
  const [adminSettings, setAdminSettings] = React.useState<AdminCreateSettings | null>(null);

  // Gallery filter state
  const [galleryFilterState, setGalleryFilterState] = React.useState<GalleryFilterState>({
    searchQuery: "",
    sortBy: "newest",
    filters: {
      aspectRatio: [],
      imageSize: [],
      showFavoritesOnly: false,
      tagIds: [],
      collectionId: null,
      modelIds: [],
      dateRange: { preset: null, from: null, to: null },
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
      const [apis, generations, savedRefs, loadedAdminSettings] = await Promise.all([
        apisPromise,
        historyPromise,
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
        status: 'completed' as const,
        settings: {
          model: gen.settings.model || "Unknown",
          imageSize: (gen.settings.imageSize as ImageSize) || "2K",
          aspectRatio: (gen.settings.aspectRatio as AspectRatio) || "1:1",
          outputCount: gen.settings.outputCount || 1,
          generationSpeed: (gen.settings.generationSpeed as GenerationSpeed) || "fast",
          styleStrength: 75,
          negativePrompt: gen.negative_prompt || "",
          referenceImages: gen.settings.referenceImages,
          source: gen.settings.source,
        },
      }));

      // Restore any pending generations from sessionStorage as failed (API call was lost on refresh)
      let restoredFailed: GeneratedImage[] = [];
      try {
        const pendingRaw = sessionStorage.getItem('pending-generations');
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw) as GeneratedImage[];
          restoredFailed = pending.map(img => ({
            ...img,
            status: 'failed' as const,
            error: 'Generation interrupted — page was refreshed.',
          }));
        }
      } catch { /* ignore */ }

      setHistory(prev => {
        // Preserve any in-flight pending items added by generate() before initial data loaded
        const inFlightPending = prev.filter(img => img.status === 'pending');
        const inFlightIds = new Set(inFlightPending.map(img => img.id));
        // Don't mark in-flight items as failed
        const actuallyFailed = restoredFailed.filter(img => !inFlightIds.has(img.id));

        // Update sessionStorage: keep only in-flight items
        try {
          if (inFlightPending.length > 0) {
            sessionStorage.setItem('pending-generations', JSON.stringify(inFlightPending));
          } else {
            sessionStorage.removeItem('pending-generations');
          }
        } catch { /* ignore */ }

        return [...inFlightPending, ...actuallyFailed, ...historyImages];
      });
      setHasMoreHistory(generations.length >= 50);
      // Select the most recent image if available
      if (historyImages.length > 0) {
        setSelectedImage(historyImages[0]);
      }

      // Process saved reference images from database
      setSavedReferences(savedRefs);

      // Process admin settings
      setAdminSettings(loadedAdminSettings);

    }

    loadInitialData();
  }, []);

  // Load more history (pagination)
  const loadMoreHistory = React.useCallback(async () => {
    if (isLoadingMoreHistory || !hasMoreHistory) return;
    setIsLoadingMoreHistory(true);
    try {
      const { getGenerationHistory } = await import("@/utils/supabase/generations.server");
      // Offset = number of completed (non-pending) images already loaded
      const existingCount = history.filter(img => img.status !== "pending").length;
      const generations = await getGenerationHistory(50, existingCount);

      if (generations.length < 50) {
        setHasMoreHistory(false);
      }

      if (generations.length > 0) {
        const moreImages: GeneratedImage[] = generations.map((gen: Generation) => ({
          id: gen.id,
          url: gen.image_url,
          prompt: gen.prompt,
          timestamp: new Date(gen.created_at).getTime(),
          isFavorite: gen.is_favorite ?? false,
          status: 'completed' as const,
          settings: {
            model: gen.settings.model || "Unknown",
            imageSize: (gen.settings.imageSize as ImageSize) || "2K",
            aspectRatio: (gen.settings.aspectRatio as AspectRatio) || "1:1",
            outputCount: gen.settings.outputCount || 1,
            generationSpeed: (gen.settings.generationSpeed as GenerationSpeed) || "fast",
            styleStrength: 75,
            negativePrompt: gen.negative_prompt || "",
            referenceImages: gen.settings.referenceImages,
          },
        }));

        setHistory(prev => {
          const existingIds = new Set(prev.map(img => img.id));
          const newImages = moreImages.filter(img => !existingIds.has(img.id));
          return [...prev, ...newImages];
        });
      }
    } catch (error) {
      console.error("Failed to load more history:", error);
    } finally {
      setIsLoadingMoreHistory(false);
    }
  }, [isLoadingMoreHistory, hasMoreHistory, history]);

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

  /**
   * Reuse a generated image's complete setup (original reference images + prompt + settings)
   */
  const reuseImageSetup = React.useCallback(async (image: GeneratedImage) => {
    // Clear existing reference images first
    clearReferenceImages();

    // Add the original reference images that were used for this generation
    if (image.settings?.referenceImages && image.settings.referenceImages.length > 0) {
      for (const ref of image.settings.referenceImages) {
        if (ref.storagePath) {
          // Image already exists in storage — reuse it directly (no re-upload)
          addSavedReferenceToActive({
            id: `reused-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            user_id: '',
            storage_path: ref.storagePath,
            name: null,
            created_at: new Date().toISOString(),
            url: ref.url,
          });
        } else {
          // No storage path — fall back to fetching and uploading
          await addReferenceImageFromUrl(ref.url);
        }
      }
    }

    // Set prompt
    setPrompt(image.prompt);

    // Update settings
    updateSettings({
      aspectRatio: image.settings?.aspectRatio || settings.aspectRatio,
      negativePrompt: image.settings?.negativePrompt || '',
    });
  }, [addReferenceImageFromUrl, addSavedReferenceToActive, clearReferenceImages, setPrompt, updateSettings, settings.aspectRatio]);

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


  const selectImage = React.useCallback((image: GeneratedImage | null) => {
    setSelectedImage(image);
  }, []);

  const clearHistory = React.useCallback(() => {
    setHistory([]);
    setSelectedImage(null);
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


  const generate = React.useCallback(async () => {
    if (!prompt.trim() && referenceImages.length === 0) return;
    if (!selectedApiId) {
      console.error("No API selected");
      return;
    }

    // ---- VARIATIONS MODE ----
    if (variationsMode) {
      const activeSlots = variationSlots.filter(s => s.secondaryPrompt.trim());
      if (activeSlots.length === 0) return;

      setIsGenerating(true);
      abortControllerRef.current = new AbortController();

      // Wait for any uploading images (global + per-slot)
      const hasUploading = referenceImages.some(img => img.isUploading) ||
        activeSlots.some(s => s.referenceImages.some(img => img.isUploading));
      if (hasUploading) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Global reference images (shared across all slots)
      const globalRefPaths = referenceImages
        .filter(img => img.storagePath && !img.isUploading)
        .map(img => img.storagePath!);
      const globalRefImages: ReferenceImageInfo[] = referenceImages
        .filter(img => img.storagePath && !img.isUploading)
        .map(img => ({ url: img.preview || '', storagePath: img.storagePath }));

      // Create one placeholder per variation
      const placeholderMap: { slotId: string; placeholderId: string }[] = [];
      const placeholders: GeneratedImage[] = [];

      for (const slot of activeSlots) {
        // Resolve per-slot API or fall back to global
        const slotApiId = slot.apiId || selectedApiId;
        const slotApi = availableApis.find(api => api.id === slotApiId);
        const slotModelName = slotApi?.name || settings.model;

        // Merge global + per-slot reference images
        const slotRefPaths = slot.referenceImages
          .filter(img => img.storagePath && !img.isUploading)
          .map(img => img.storagePath!);
        const slotRefImages: ReferenceImageInfo[] = slot.referenceImages
          .filter(img => img.storagePath && !img.isUploading)
          .map(img => ({ url: img.preview || '', storagePath: img.storagePath }));

        const placeholderId = `gen-pending-${Date.now()}-${slot.id}`;
        placeholderMap.push({ slotId: slot.id, placeholderId });
        placeholders.push({
          id: placeholderId,
          url: '',
          prompt: `${prompt.trim()}. ${slot.secondaryPrompt.trim()}`,
          timestamp: Date.now(),
          settings: {
            ...settings,
            model: slotModelName,
            aspectRatio: slot.aspectRatio,
            imageSize: slot.imageSize,
            outputCount: 1,
            referenceImages: [...globalRefImages, ...slotRefImages],
          },
          status: 'pending',
        });
      }

      setHistory(prev => [...placeholders, ...prev]);

      // Fire all API calls in parallel
      const promises = activeSlots.map(async (slot) => {
        const entry = placeholderMap.find(e => e.slotId === slot.id)!;
        const slotApiId = slot.apiId || selectedApiId;
        const slotApi = availableApis.find(api => api.id === slotApiId);
        const slotModelName = slotApi?.name || settings.model;

        const combinedPrompt = `${prompt.trim()}. ${slot.secondaryPrompt.trim()}`;
        let finalPrompt = combinedPrompt;
        if (settings.negativePrompt.trim()) {
          finalPrompt += `\n\nNegative: ${settings.negativePrompt.trim()}`;
        }

        // Merge global + per-slot reference image paths
        const slotRefPaths = slot.referenceImages
          .filter(img => img.storagePath && !img.isUploading)
          .map(img => img.storagePath!);
        const allRefPaths = [...globalRefPaths, ...slotRefPaths];

        const requestParams: Record<string, unknown> = {
          apiId: slotApiId,
          prompt: finalPrompt,
          negativePrompt: settings.negativePrompt,
          aspectRatio: slot.aspectRatio,
          imageSize: slot.imageSize,
          outputCount: 1,
          referenceImagePaths: allRefPaths,
          mode: 'fast',
        };
        if (settings.styleRef) requestParams.styleRefPath = settings.styleRef.storagePath || settings.styleRef.url;
        if (settings.poseRef) requestParams.poseRefPath = settings.poseRef.storagePath || settings.poseRef.url;
        if (settings.expressionRef?.image) requestParams.expressionRefPath = settings.expressionRef.image.storagePath || settings.expressionRef.image.url;
        if (settings.expressionRef?.tags?.length) requestParams.expressionTags = settings.expressionRef.tags;
        if (settings.expressionRef?.customText) requestParams.expressionCustomText = settings.expressionRef.customText;
        if (settings.clothingRef?.image) requestParams.clothingRefPath = settings.clothingRef.image.storagePath || settings.clothingRef.image.url;
        if (settings.clothingRef?.tags?.length) requestParams.clothingTags = settings.clothingRef.tags;
        if (settings.clothingRef?.customText) requestParams.clothingCustomText = settings.clothingRef.customText;
        if (settings.locationRef?.image) requestParams.locationRefPath = settings.locationRef.image.storagePath || settings.locationRef.image.url;
        if (settings.locationRef?.tags?.length) requestParams.locationTags = settings.locationRef.tags;
        if (settings.locationRef?.customText) requestParams.locationCustomText = settings.locationRef.customText;

        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestParams),
            signal: abortControllerRef.current!.signal,
          });

          if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`;
            try {
              const d = await response.json();
              errorMessage = d.error || errorMessage;
            } catch {
              if (response.status === 413) {
                errorMessage = 'Images are too large. Try using fewer or smaller reference images.';
              }
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          if (!data.success || !data.images?.length) {
            throw new Error(data.error || 'No images generated');
          }

          const img = data.images[0];
          const newImage: GeneratedImage = {
            id: img.id || `gen-${Date.now()}-${slot.id}`,
            url: img.url,
            prompt: combinedPrompt,
            timestamp: Date.now(),
            settings: {
              ...settings,
              model: slotModelName,
              aspectRatio: slot.aspectRatio,
              imageSize: slot.imageSize,
              outputCount: 1,
            },
            status: 'completed',
          };

          setHistory(prev =>
            prev.map(h => h.id === entry.placeholderId ? newImage : h)
          );
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
          const errorMessage = error instanceof Error ? error.message : 'Generation failed';
          setHistory(prev =>
            prev.map(h =>
              h.id === entry.placeholderId
                ? { ...h, status: 'failed' as const, error: errorMessage }
                : h
            )
          );
        }
      });

      await Promise.allSettled(promises);

      setIsGenerating(false);
      setThinkingSteps([]);
      return;
    }

    // ---- NORMAL MODE ----
    // Determine how many images to generate (max 4 per API call)
    const outputCount = Math.min(settings.outputCount, 4);

    // Resolve the API config name for accurate model display
    const selectedApi = availableApis.find(api => api.id === selectedApiId);
    const resolvedModelName = selectedApi?.name || settings.model;

    // Capture current reference images for persistence
    const currentRefImages: ReferenceImageInfo[] = referenceImages
      .filter(img => img.storagePath && !img.isUploading)
      .map(img => ({ url: img.preview || '', storagePath: img.storagePath }));

    // Create placeholder entries in history immediately
    const placeholderIds: string[] = [];
    const placeholders: GeneratedImage[] = [];
    for (let i = 0; i < outputCount; i++) {
      const id = `gen-pending-${Date.now()}-${i}`;
      placeholderIds.push(id);
      placeholders.push({
        id,
        url: '',
        prompt: prompt,
        timestamp: Date.now(),
        settings: { ...settings, model: resolvedModelName, referenceImages: currentRefImages },
        status: 'pending',
      });
    }
    setHistory(prev => [...placeholders, ...prev]);

    // Persist pending entries to sessionStorage so they survive refresh
    try {
      const existing = JSON.parse(sessionStorage.getItem('pending-generations') || '[]') as GeneratedImage[];
      sessionStorage.setItem('pending-generations', JSON.stringify([...placeholders, ...existing]));
    } catch { /* ignore */ }

    // Capture values before async gap (allow user to modify prompt/settings for next generation)
    const capturedPrompt = buildFinalPrompt();
    const capturedSettings = { ...settings };
    const capturedApiId = selectedApiId;
    const capturedRefPaths = referenceImages
      .filter(img => img.storagePath && !img.isUploading)
      .map(img => img.storagePath!);

    // Fire-and-forget: run API call in background so user can queue more jobs
    (async () => {
      try {
        const requestParams: Record<string, unknown> = {
          apiId: capturedApiId,
          prompt: capturedPrompt,
          negativePrompt: capturedSettings.negativePrompt,
          aspectRatio: capturedSettings.aspectRatio,
          imageSize: capturedSettings.imageSize,
          outputCount,
          referenceImagePaths: capturedRefPaths,
          mode: capturedSettings.generationSpeed,
        };

        // Add labeled style / pose references if set (prefer storagePath, fall back to URL)
        if (capturedSettings.styleRef) requestParams.styleRefPath = capturedSettings.styleRef.storagePath || capturedSettings.styleRef.url;
        if (capturedSettings.poseRef) requestParams.poseRefPath = capturedSettings.poseRef.storagePath || capturedSettings.poseRef.url;
        // Add new tagged references (expression, clothing, location)
        if (capturedSettings.expressionRef?.image) requestParams.expressionRefPath = capturedSettings.expressionRef.image.storagePath || capturedSettings.expressionRef.image.url;
        if (capturedSettings.expressionRef?.tags?.length) requestParams.expressionTags = capturedSettings.expressionRef.tags;
        if (capturedSettings.expressionRef?.customText) requestParams.expressionCustomText = capturedSettings.expressionRef.customText;
        if (capturedSettings.clothingRef?.image) requestParams.clothingRefPath = capturedSettings.clothingRef.image.storagePath || capturedSettings.clothingRef.image.url;
        if (capturedSettings.clothingRef?.tags?.length) requestParams.clothingTags = capturedSettings.clothingRef.tags;
        if (capturedSettings.clothingRef?.customText) requestParams.clothingCustomText = capturedSettings.clothingRef.customText;
        if (capturedSettings.locationRef?.image) requestParams.locationRefPath = capturedSettings.locationRef.image.storagePath || capturedSettings.locationRef.image.url;
        if (capturedSettings.locationRef?.tags?.length) requestParams.locationTags = capturedSettings.locationRef.tags;
        if (capturedSettings.locationRef?.customText) requestParams.locationCustomText = capturedSettings.locationRef.customText;

        // Call the generation API
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestParams),
        });

        if (!response.ok) {
          let errorMessage = `Request failed with status ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
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
          setHistory(prev => {
            const filtered = prev.filter(img => !placeholderIds.includes(img.id));
            const batchPlaceholder: GeneratedImage = {
              id: `batch-${data.batchJobId}`,
              url: '',
              prompt: capturedPrompt,
              timestamp: Date.now(),
              settings: capturedSettings,
              status: 'pending',
            };
            return [batchPlaceholder, ...filtered];
          });
          pollBatchJob(data.batchJobId, capturedPrompt, capturedSettings);
          return;
        }

        // Handle fast mode (immediate images)
        if (!data.images || data.images.length === 0) {
          throw new Error(data.error || 'No images generated');
        }

        // Replace placeholder entries with actual images
        const newImages: GeneratedImage[] = data.images.map((img: { url: string; id?: string }, i: number) => ({
          id: img.id || `gen-${Date.now()}-${i}`,
          url: img.url,
          prompt: capturedPrompt,
          timestamp: Date.now(),
          settings: { ...capturedSettings, model: resolvedModelName },
          status: 'completed' as const,
        }));

        setHistory(prev => {
          const filtered = prev.filter(img => !placeholderIds.includes(img.id));
          return [...newImages, ...filtered];
        });
        setSelectedImage(newImages[0]);
        clearPendingFromSession(placeholderIds);

      } catch (error) {
        console.error("Generation error:", error);
        const errorMessage = error instanceof Error ? error.message : "Generation failed";
        setHistory(prev =>
          prev.map(img =>
            placeholderIds.includes(img.id)
              ? { ...img, status: 'failed' as const, error: errorMessage }
              : img
          )
        );
        clearPendingFromSession(placeholderIds);
      }
    })();
  }, [prompt, referenceImages, settings, selectedApiId, availableApis, getThinkingSteps, buildFinalPrompt, pollBatchJob, variationsMode, variationSlots]);

  const cancelGeneration = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setThinkingSteps([]);
  }, []);

  // Inpaint: send source image + mask + prompt to inpainting API
  // Closes the modal immediately and adds a pending card to history.
  const inpaint = React.useCallback(async (maskDataUrl: string, inpaintPrompt: string, overrideApiId?: string) => {
    const resolvedApiId = overrideApiId || selectedApiId;
    if (!inpaintSourceImage?.url || !resolvedApiId) return;

    // Create a pending placeholder in history
    const placeholderId = `inpaint-${Date.now()}`;
    const placeholder: GeneratedImage = {
      id: placeholderId,
      url: '',
      prompt: inpaintPrompt,
      timestamp: Date.now(),
      settings: { ...settings, source: 'inpaint' },
      status: 'pending',
    };
    setHistory(prev => [placeholder, ...prev]);

    // Close the modal immediately
    setInpaintSourceImage(null);
    setIsInpainting(true);

    // Capture values before async gap
    const sourceUrl = inpaintSourceImage.url;
    const negPrompt = settings.negativePrompt;
    const imgSize = settings.imageSize;

    try {
      const response = await fetch('/api/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiId: resolvedApiId,
          sourceImagePath: sourceUrl,
          maskDataUrl,
          prompt: inpaintPrompt,
          negativePrompt: negPrompt,
          imageSize: imgSize,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Inpainting failed');
      }
      const data = await response.json();
      if (data.url) {
        setHistory(prev =>
          prev.map(h => h.id === placeholderId
            ? { ...h, url: data.url, status: 'completed' as const }
            : h
          )
        );
      } else {
        throw new Error('No image returned');
      }
    } catch (error) {
      console.error('[Inpaint] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Inpainting failed';
      setHistory(prev =>
        prev.map(h => h.id === placeholderId
          ? { ...h, status: 'failed' as const, error: errorMessage }
          : h
        )
      );
    } finally {
      setIsInpainting(false);
    }
  }, [inpaintSourceImage, selectedApiId, settings]);

  // Retry a failed image: restore its prompt + settings then re-generate
  const retryFailedImage = React.useCallback((image: GeneratedImage) => {
    // Remove the failed card
    setHistory(prev => prev.filter(img => img.id !== image.id));
    // Restore prompt and settings
    setPrompt(image.prompt);
    updateSettings({
      aspectRatio: image.settings.aspectRatio,
      imageSize: image.settings.imageSize,
      negativePrompt: image.settings.negativePrompt,
      outputCount: image.settings.outputCount,
      generationSpeed: image.settings.generationSpeed,
    });
    // Trigger generation on next tick (after state updates)
    setTimeout(() => {
      generate();
    }, 0);
  }, [generate, setPrompt, updateSettings]);

  // Dismiss a failed image card without server deletion or confirmation
  const dismissFailedImage = React.useCallback((id: string) => {
    setHistory(prev => prev.filter(img => img.id !== id));
  }, []);

  // Variations mode callbacks
  const addVariationSlot = React.useCallback(() => {
    setVariationSlots(prev => {
      if (prev.length >= 4) return prev;
      return [...prev, {
        id: `var-${Date.now()}`,
        secondaryPrompt: "",
        aspectRatio: settings.aspectRatio,
        imageSize: settings.imageSize,
        apiId: null,
        referenceImages: [],
      }];
    });
  }, [settings.aspectRatio, settings.imageSize]);

  const removeVariationSlot = React.useCallback((id: string) => {
    setVariationSlots(prev => {
      // Revoke blob URLs for removed slot's reference images
      const slot = prev.find(s => s.id === id);
      if (slot) {
        slot.referenceImages.forEach(img => URL.revokeObjectURL(img.preview));
      }
      const filtered = prev.filter(s => s.id !== id);
      return filtered.length === 0
        ? [{ id: "var-1", secondaryPrompt: "", aspectRatio: settings.aspectRatio, imageSize: settings.imageSize, apiId: null, referenceImages: [] }]
        : filtered;
    });
  }, [settings.aspectRatio, settings.imageSize]);

  const updateVariationSlot = React.useCallback((id: string, updates: Partial<Omit<VariationSlot, "referenceImages">>) => {
    setVariationSlots(prev =>
      prev.map(s => s.id === id ? { ...s, ...updates } : s)
    );
  }, []);

  const addVariationReferenceImages = React.useCallback(async (slotId: string, files: File[]) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slot = variationSlots.find(s => s.id === slotId);
    const currentCount = slot?.referenceImages.length ?? 0;
    const filesToAdd = files.slice(0, 5 - currentCount); // max 5 per slot
    if (filesToAdd.length === 0) return;

    const newImages: ImageFile[] = filesToAdd.map(file => ({
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      file,
      preview: URL.createObjectURL(file),
      isUploading: true,
    }));

    // Add to slot immediately with uploading state
    setVariationSlots(prev =>
      prev.map(s => s.id === slotId
        ? { ...s, referenceImages: [...s.referenceImages, ...newImages].slice(0, 5) }
        : s
      )
    );

    // Upload in parallel
    const { uploadReferenceImage: uploadToStorage } = await import("@/utils/supabase/storage");

    for (const img of newImages) {
      try {
        const { path, error } = await uploadToStorage(img.file, user.id);
        if (error || !path) {
          setVariationSlots(prev =>
            prev.map(s => s.id === slotId
              ? { ...s, referenceImages: s.referenceImages.filter(i => i.id !== img.id) }
              : s
            )
          );
          URL.revokeObjectURL(img.preview);
        } else {
          setVariationSlots(prev =>
            prev.map(s => s.id === slotId
              ? { ...s, referenceImages: s.referenceImages.map(i => i.id === img.id ? { ...i, storagePath: path, isUploading: false } : i) }
              : s
            )
          );
        }
      } catch {
        setVariationSlots(prev =>
          prev.map(s => s.id === slotId
            ? { ...s, referenceImages: s.referenceImages.filter(i => i.id !== img.id) }
            : s
          )
        );
        URL.revokeObjectURL(img.preview);
      }
    }
  }, [variationSlots]);

  const removeVariationReferenceImage = React.useCallback((slotId: string, imageId: string) => {
    setVariationSlots(prev =>
      prev.map(s => {
        if (s.id !== slotId) return s;
        const img = s.referenceImages.find(i => i.id === imageId);
        if (img) URL.revokeObjectURL(img.preview);
        return { ...s, referenceImages: s.referenceImages.filter(i => i.id !== imageId) };
      })
    );
  }, []);

  // Load persisted state from localStorage on mount (after userId is known)
  React.useEffect(() => {
    if (!userIdLoadedRef.current) return;
    if (hasLoadedPersistedState.current) return;
    hasLoadedPersistedState.current = true;
    isInitialLoadRef.current = false;

    const persisted = loadPersistedState(currentUserId);
    if (persisted) {
      if (persisted.prompt) setPrompt(persisted.prompt);
      if (persisted.settings) setSettings(persisted.settings);
      if (persisted.selectedApiId) setSelectedApiId(persisted.selectedApiId);
      if (persisted.viewMode) setViewMode(persisted.viewMode);
      if (persisted.historyPanelOpen !== undefined) setHistoryPanelOpen(persisted.historyPanelOpen);

      // Restore active reference images from persisted state
      if (persisted.activeReferenceImages && persisted.activeReferenceImages.length > 0) {
        const restored: ImageFile[] = persisted.activeReferenceImages
          .filter(ref => ref.storagePath)
          .map(ref => ({
            id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file: new File([], 'reference'),
            preview: ref.url,
            storagePath: ref.storagePath,
            isUploading: false,
          }));
        if (restored.length > 0) {
          setReferenceImages(restored);
        }
      }
    }

    // Check for "Use in Create" from prompt library — overrides persisted prompt
    try {
      const raw = sessionStorage.getItem("loadPrompt");
      if (raw) {
        sessionStorage.removeItem("loadPrompt");
        const libraryPrompt = JSON.parse(raw) as {
          prompt_text?: string;
          negative_prompt?: string | null;
          settings?: Record<string, unknown>;
        };
        if (libraryPrompt.prompt_text) {
          setPrompt(libraryPrompt.prompt_text);
        }
        const settingsUpdate: Partial<CreateSettings> = {};
        if (libraryPrompt.negative_prompt) {
          settingsUpdate.negativePrompt = libraryPrompt.negative_prompt;
        }
        if (libraryPrompt.settings?.aspectRatio) {
          settingsUpdate.aspectRatio = libraryPrompt.settings.aspectRatio as CreateSettings['aspectRatio'];
        }
        if (libraryPrompt.settings?.imageSize) {
          settingsUpdate.imageSize = libraryPrompt.settings.imageSize as CreateSettings['imageSize'];
        }
        if (Object.keys(settingsUpdate).length > 0) {
          setSettings(prev => ({ ...prev, ...settingsUpdate }));
        }
      }
    } catch {
      // Ignore malformed sessionStorage data
    }
  }, [currentUserId]);

  // Persist state to localStorage on changes (debounced)
  React.useEffect(() => {
    if (!hasLoadedPersistedState.current) return;
    if (!userIdLoadedRef.current) return;

    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = setTimeout(() => {
      const activeRefs: ReferenceImageInfo[] = referenceImages
        .filter(img => img.storagePath && !img.isUploading)
        .map(img => ({ url: img.preview, storagePath: img.storagePath }));
      const stateToSave: PersistedState = {
        prompt,
        settings,
        selectedApiId,
        viewMode,
        historyPanelOpen,
        activeReferenceImages: activeRefs.length > 0 ? activeRefs : undefined,
        timestamp: Date.now(),
      };
      savePersistedState(stateToSave, currentUserId);
    }, 1000);

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [prompt, settings, selectedApiId, viewMode, historyPanelOpen, referenceImages, currentUserId]);

  // Save state immediately before page unload
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (!userIdLoadedRef.current) return;
      const activeRefs: ReferenceImageInfo[] = referenceImages
        .filter(img => img.storagePath && !img.isUploading)
        .map(img => ({ url: img.preview, storagePath: img.storagePath }));
      const stateToSave: PersistedState = {
        prompt,
        settings,
        selectedApiId,
        viewMode,
        historyPanelOpen,
        activeReferenceImages: activeRefs.length > 0 ? activeRefs : undefined,
        timestamp: Date.now(),
      };
      savePersistedState(stateToSave, currentUserId);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [prompt, settings, selectedApiId, viewMode, historyPanelOpen, referenceImages, currentUserId]);

  // Compute whether there are available slots for new generations
  const hasAvailableSlots = React.useMemo(() => {
    return true; // No global concurrency limit, only per-call limit of 4 images
  }, []);

  // Count active (pending) generations from history
  const activeGenerations = React.useMemo(() => {
    return history.filter(img => img.status === "pending").length;
  }, [history]);

  // Gallery filter actions
  const setSearchQuery = React.useCallback((query: string) => {
    setGalleryFilterState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  // Server-side search: fetch all matching generations from DB when query changes
  React.useEffect(() => {
    const query = galleryFilterState.searchQuery.trim();
    if (!query) return;

    let cancelled = false;
    const fetchSearchResults = async () => {
      try {
        const { searchGenerations } = await import("@/utils/supabase/generations.server");
        const generations = await searchGenerations(query);
        if (cancelled) return;

        if (generations.length > 0) {
          const searchImages: GeneratedImage[] = generations.map((gen: Generation) => ({
            id: gen.id,
            url: gen.image_url,
            prompt: gen.prompt,
            timestamp: new Date(gen.created_at).getTime(),
            isFavorite: gen.is_favorite ?? false,
            settings: {
              model: gen.settings.model || "Unknown",
              imageSize: (gen.settings.imageSize as ImageSize) || "2K",
              aspectRatio: (gen.settings.aspectRatio as AspectRatio) || "1:1",
              outputCount: gen.settings.outputCount || 1,
              generationSpeed: (gen.settings.generationSpeed as GenerationSpeed) || "fast",
              styleStrength: 75,
              negativePrompt: gen.negative_prompt || "",
              referenceImages: gen.settings.referenceImages,
            },
          }));

          // Merge search results into history (no duplicates)
          setHistory(prev => {
            const existingIds = new Set(prev.map(img => img.id));
            const newImages = searchImages.filter(img => !existingIds.has(img.id));
            if (newImages.length === 0) return prev;
            return [...prev, ...newImages];
          });
        }
      } catch (error) {
        console.error("Failed to search generations:", error);
      }
    };

    // Debounce: wait 300ms after user stops typing
    const timer = setTimeout(fetchSearchResults, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [galleryFilterState.searchQuery]);

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
        showFavoritesOnly: false,
        tagIds: [],
        collectionId: null,
        modelIds: [],
        dateRange: { preset: null, from: null, to: null },
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

    // Model filter
    if (galleryFilterState.filters.modelIds.length > 0) {
      result = result.filter(img =>
        galleryFilterState.filters.modelIds.includes(img.settings.model)
      );
    }

    // Date range filter
    const { from, to } = galleryFilterState.filters.dateRange;
    if (from !== null) {
      result = result.filter(img => img.timestamp >= from);
    }
    if (to !== null) {
      result = result.filter(img => img.timestamp <= to);
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
        case "prompt-group":
          return b.timestamp - a.timestamp; // newest first within groups
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
    // Separate local-only IDs (not in database) from real DB UUIDs
    const localIds = ids.filter(id => !isDbId(id));
    const dbIds = ids.filter(isDbId);

    // Local-only images can always be removed from state
    const deletedIds: string[] = [...localIds];
    const failedIds: string[] = [];

    // Only call the server for images that exist in the database
    if (dbIds.length > 0) {
      const { deleteGeneration } = await import("@/utils/supabase/generations.server");

      const results = await Promise.allSettled(dbIds.map(id => deleteGeneration(id)));

      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          deletedIds.push(dbIds[i]);
        } else {
          console.error(`Failed to delete ${dbIds[i]}:`, result.reason);
          failedIds.push(dbIds[i]);
        }
      });
    }

    // Only remove successfully deleted images from local state
    if (deletedIds.length > 0) {
      setHistory(prev => prev.filter(img => !deletedIds.includes(img.id)));

      // Clear selection
      setGalleryFilterState(prev => ({
        ...prev,
        bulkSelection: {
          ...prev.bulkSelection,
          selectedIds: new Set(),
        },
      }));

      // Clear selected image if it was deleted
      if (selectedImage && deletedIds.includes(selectedImage.id)) {
        setSelectedImage(null);
      }
    }

    // If any deletions failed, throw so the UI can show an error
    if (failedIds.length > 0) {
      throw new Error(`Failed to delete ${failedIds.length} image(s)`);
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

    // Skip server call for local-only images
    if (!isDbId(imageId)) return;

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
    if (!isDbId(imageId)) return;
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
    if (!isDbId(imageId)) return;
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

  // Bulk add to collection
  const bulkAddToCollectionFn = React.useCallback(async (imageIds: string[], collectionId: string) => {
    const { addToCollection } = await import("@/utils/supabase/generations.server");
    const results = await Promise.allSettled(
      imageIds.filter(isDbId).map(id => addToCollection(id, collectionId))
    );
    setImageOrganization(prev => {
      const next = new Map(prev);
      imageIds.forEach((id, i) => {
        if (results[i]?.status === "fulfilled") {
          const existing = next.get(id) || { tagIds: [], collectionIds: [] };
          if (!existing.collectionIds.includes(collectionId)) {
            next.set(id, { ...existing, collectionIds: [...existing.collectionIds, collectionId] });
          }
        }
      });
      return next;
    });
  }, []);

  // Bulk add tag
  const bulkAddTagFn = React.useCallback(async (imageIds: string[], tagId: string) => {
    const { addTagToGeneration } = await import("@/utils/supabase/generations.server");
    const results = await Promise.allSettled(
      imageIds.filter(isDbId).map(id => addTagToGeneration(id, tagId))
    );
    setImageOrganization(prev => {
      const next = new Map(prev);
      imageIds.forEach((id, i) => {
        if (results[i]?.status === "fulfilled") {
          const existing = next.get(id) || { tagIds: [], collectionIds: [] };
          if (!existing.tagIds.includes(tagId)) {
            next.set(id, { ...existing, tagIds: [...existing.tagIds, tagId] });
          }
        }
      });
      return next;
    });
  }, []);

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
    if (!isDbId(imageId)) return;
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
    if (!isDbId(imageId)) return;
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

    // Skip DB queries for temporary/local IDs (not valid UUIDs)
    if (!isDbId(imageId)) return;

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
      "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9",
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
    loadMoreHistory,
    hasMoreHistory,
    isLoadingMoreHistory,
    // UI state
    viewMode,
    setViewMode,
    historyPanelOpen,
    toggleHistoryPanel,
    isInputVisible,
    toggleInputVisibility,
    activeTab,
    setActiveTab,
    interactionMode,
    setInteractionMode,
    // Gallery layout
    galleryColumnCount,
    setGalleryColumnCount,
    gallerySidebarOpen,
    setGallerySidebarOpen,
    // Dock
    dockCollapsed,
    setDockCollapsed,
    // Generation
    isGenerating,
    thinkingSteps,
    generate,
    cancelGeneration,
    pendingBatchJobs,
    hasAvailableSlots,
    activeGenerations,
    retryFailedImage,
    dismissFailedImage,
    buildFinalPrompt,
    // Variations mode
    variationsMode,
    setVariationsMode,
    variationSlots,
    addVariationSlot,
    removeVariationSlot,
    updateVariationSlot,
    addVariationReferenceImages,
    removeVariationReferenceImage,
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
    // Bulk organization
    bulkAddToCollection: bulkAddToCollectionFn,
    bulkAddTag: bulkAddTagFn,
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
    // Inpainting
    inpaintSourceImage,
    setInpaintSourceImage,
    isInpainting,
    inpaint,
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
    inpaintSourceImage, isInpainting, inpaint,
    viewMode, historyPanelOpen, isInputVisible, activeTab, interactionMode, galleryColumnCount, gallerySidebarOpen, dockCollapsed,
    isGenerating, thinkingSteps,
    updateSettings, addReferenceImages, addReferenceImageFromUrl, removeReferenceImage, clearReferenceImages,
    savedReferences, loadSavedReferences, removeSavedReference, renameSavedReference, addSavedReferenceToActive,
    selectImage, clearHistory, loadMoreHistory, hasMoreHistory, isLoadingMoreHistory,
    toggleHistoryPanel, toggleInputVisibility, generate, cancelGeneration,
    hasAvailableSlots, activeGenerations, retryFailedImage, dismissFailedImage, buildFinalPrompt,
    variationsMode, variationSlots, addVariationSlot, removeVariationSlot, updateVariationSlot, addVariationReferenceImages, removeVariationReferenceImage,
    galleryFilterState, setSearchQuery, setSortBy, setGalleryFilters, clearGalleryFilters,
    toggleBulkSelection, toggleImageSelection, selectAllImages, deselectAllImages, getFilteredHistory, bulkDeleteImages,
    bulkAddToCollectionFn, bulkAddTagFn,
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
