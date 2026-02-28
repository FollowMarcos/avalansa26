"use client";

import * as React from "react";
import type {
  PromptWithOrganization,
  PromptFolder,
  PromptTag,
} from "@/types/prompt";
import type { GenerationSettings } from "@/types/generation";
import {
  savePrompt,
  deletePrompt as deletePromptServer,
  togglePromptFavorite,
  getPromptFolders,
  createPromptFolder,
  getPromptTags,
  createPromptTag,
  addPromptToFolder,
  addTagToPrompt,
  sharePromptWithUser,
  incrementPromptUseCount,
  getPromptsWithOrganization,
  getPromptFolderItemCounts,
  getPromptFolderMapping,
} from "@/utils/supabase/prompts.server";
import { createClient } from "@/utils/supabase/client";

interface UsePromptVaultOptions {
  onPromptSelected?: (prompt: PromptWithOrganization) => void;
}

interface UsePromptVaultReturn {
  // State
  prompts: PromptWithOrganization[];
  folders: PromptFolder[];
  tags: PromptTag[];
  folderItemCounts: Record<string, number>;
  folderMapping: Record<string, string[]>;
  isLoading: boolean;
  vaultOpen: boolean;
  saveDialogOpen: boolean;
  shareDialogOpen: boolean;
  promptToShare: PromptWithOrganization | null;

  // Actions
  loadVault: () => Promise<void>;
  toggleVault: () => void;
  openSaveDialog: () => void;
  closeSaveDialog: () => void;
  openShareDialog: (prompt: PromptWithOrganization) => void;
  closeShareDialog: () => void;

  // Prompt operations
  saveNewPrompt: (data: {
    name: string;
    description?: string;
    promptText: string;
    negativePrompt?: string;
    settings?: Partial<GenerationSettings>;
    folderIds?: string[];
    tagIds?: string[];
  }) => Promise<PromptWithOrganization | null>;
  deletePrompt: (promptId: string) => Promise<boolean>;
  toggleFavorite: (promptId: string, isFavorite: boolean) => Promise<void>;
  usePrompt: (prompt: PromptWithOrganization) => void;
  shareWithUsers: (promptId: string, userIds: string[], message?: string) => Promise<void>;

  // Folder operations
  createFolder: (name: string) => Promise<PromptFolder | null>;

  // Tag operations
  createTag: (name: string) => Promise<PromptTag | null>;

  // User search (for sharing)
  searchUsers: (query: string) => Promise<Array<{
    id: string;
    username: string | null;
    avatar_url: string | null;
  }>>;
}

export function usePromptVault(
  options: UsePromptVaultOptions = {}
): UsePromptVaultReturn {
  const { onPromptSelected } = options;

  // Core state
  const [prompts, setPrompts] = React.useState<PromptWithOrganization[]>([]);
  const [folders, setFolders] = React.useState<PromptFolder[]>([]);
  const [tags, setTags] = React.useState<PromptTag[]>([]);
  const [folderItemCounts, setFolderItemCounts] = React.useState<Record<string, number>>({});
  const [folderMapping, setFolderMapping] = React.useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  // UI state
  const [vaultOpen, setVaultOpen] = React.useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [promptToShare, setPromptToShare] = React.useState<PromptWithOrganization | null>(null);

  // Load vault data (enriched with tags/folders)
  const loadVault = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [promptsData, foldersData, tagsData, countsData, mappingData] = await Promise.all([
        getPromptsWithOrganization(100, 0),
        getPromptFolders(),
        getPromptTags(),
        getPromptFolderItemCounts(),
        getPromptFolderMapping(),
      ]);
      setPrompts(promptsData);
      setFolders(foldersData);
      setTags(tagsData);
      setFolderItemCounts(countsData);
      setFolderMapping(mappingData);
    } catch (error) {
      console.error("Failed to load vault:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load vault when opened
  React.useEffect(() => {
    if (vaultOpen && prompts.length === 0) {
      loadVault();
    }
  }, [vaultOpen, prompts.length, loadVault]);

  // Toggle vault
  const toggleVault = React.useCallback(() => {
    setVaultOpen((prev) => !prev);
  }, []);

  // Dialog controls
  const openSaveDialog = React.useCallback(() => setSaveDialogOpen(true), []);
  const closeSaveDialog = React.useCallback(() => setSaveDialogOpen(false), []);
  const openShareDialog = React.useCallback((prompt: PromptWithOrganization) => {
    setPromptToShare(prompt);
    setShareDialogOpen(true);
  }, []);
  const closeShareDialog = React.useCallback(() => {
    setShareDialogOpen(false);
    setPromptToShare(null);
  }, []);

  // Save new prompt
  const saveNewPrompt = React.useCallback(
    async (data: {
      name: string;
      description?: string;
      promptText: string;
      negativePrompt?: string;
      settings?: Partial<GenerationSettings>;
      folderIds?: string[];
      tagIds?: string[];
    }) => {
      const prompt = await savePrompt({
        name: data.name,
        description: data.description,
        prompt_text: data.promptText,
        negative_prompt: data.negativePrompt,
        settings: data.settings,
      });

      if (prompt) {
        // Add to folders
        if (data.folderIds?.length) {
          await Promise.all(
            data.folderIds.map((folderId) =>
              addPromptToFolder(prompt.id, folderId)
            )
          );
        }

        // Add tags
        if (data.tagIds?.length) {
          await Promise.all(
            data.tagIds.map((tagId) => addTagToPrompt(prompt.id, tagId))
          );
        }

        // Build enriched prompt with tags and folders
        const enriched: PromptWithOrganization = {
          ...prompt,
          tags: tags.filter((t) => data.tagIds?.includes(t.id)),
          folders: folders.filter((f) => data.folderIds?.includes(f.id)),
        };

        // Update local state
        setPrompts((prev) => [enriched, ...prev]);

        // Update folder counts
        if (data.folderIds?.length) {
          setFolderItemCounts((prev) => {
            const next = { ...prev };
            for (const fId of data.folderIds!) {
              next[fId] = (next[fId] ?? 0) + 1;
            }
            return next;
          });
          setFolderMapping((prev) => {
            const next = { ...prev };
            for (const fId of data.folderIds!) {
              next[fId] = [...(next[fId] ?? []), prompt.id];
            }
            return next;
          });
        }

        return enriched;
      }

      return null;
    },
    [tags, folders]
  );

  // Delete prompt
  const deletePrompt = React.useCallback(async (promptId: string) => {
    const success = await deletePromptServer(promptId);
    if (success) {
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
    }
    return success;
  }, []);

  // Toggle favorite
  const toggleFavorite = React.useCallback(
    async (promptId: string, isFavorite: boolean) => {
      await togglePromptFavorite(promptId, isFavorite);
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === promptId ? { ...p, is_favorite: isFavorite } : p
        )
      );
    },
    []
  );

  // Use prompt (load into composer)
  const usePrompt = React.useCallback(
    (prompt: PromptWithOrganization) => {
      // Increment use count
      incrementPromptUseCount(prompt.id);

      // Update local state
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === prompt.id ? { ...p, use_count: p.use_count + 1 } : p
        )
      );

      // Notify parent
      onPromptSelected?.(prompt);
    },
    [onPromptSelected]
  );

  // Share with users
  const shareWithUsers = React.useCallback(
    async (promptId: string, userIds: string[], message?: string) => {
      await Promise.all(
        userIds.map((userId) =>
          sharePromptWithUser({
            prompt_id: promptId,
            shared_with: userId,
            message,
          })
        )
      );
    },
    []
  );

  // Create folder
  const createFolder = React.useCallback(async (name: string) => {
    const folder = await createPromptFolder({ name });
    if (folder) {
      setFolders((prev) => [...prev, folder]);
    }
    return folder;
  }, []);

  // Create tag
  const createTag = React.useCallback(async (name: string) => {
    const tag = await createPromptTag({ name });
    if (tag) {
      setTags((prev) => [...prev, tag]);
    }
    return tag;
  }, []);

  // Search users
  const searchUsers = React.useCallback(
    async (
      query: string
    ): Promise<
      Array<{ id: string; username: string | null; avatar_url: string | null }>
    > => {
      if (!query.trim()) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${query}%`)
        .limit(10);

      if (error) {
        console.error("User search failed:", error);
        return [];
      }

      return data ?? [];
    },
    []
  );

  return {
    // State
    prompts,
    folders,
    tags,
    folderItemCounts,
    folderMapping,
    isLoading,
    vaultOpen,
    saveDialogOpen,
    shareDialogOpen,
    promptToShare,

    // Actions
    loadVault,
    toggleVault,
    openSaveDialog,
    closeSaveDialog,
    openShareDialog,
    closeShareDialog,

    // Prompt operations
    saveNewPrompt,
    deletePrompt,
    toggleFavorite,
    usePrompt,
    shareWithUsers,

    // Folder operations
    createFolder,

    // Tag operations
    createTag,

    // User search
    searchUsers,
  };
}
