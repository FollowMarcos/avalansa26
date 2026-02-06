"use client";

import * as React from "react";
import type { Ava, AvaFolder, AvaTag, RunAvaResponse } from "@/types/ava";
import {
  saveAva,
  getAvas,
  updateAva as updateAvaServer,
  deleteAva as deleteAvaServer,
  toggleAvaFavorite,
  getAvaFolders,
  createAvaFolder,
  getAvaTags,
  createAvaTag,
  addAvaToFolder,
  addTagToAva,
  shareAvaWithUser,
} from "@/utils/supabase/avas.server";
import { createClient } from "@/utils/supabase/client";

interface UseAvaVaultOptions {
  onAvaResult?: (result: { prompt: string; negativePrompt?: string }) => void;
}

interface UseAvaVaultReturn {
  // State
  avas: Ava[];
  folders: AvaFolder[];
  tags: AvaTag[];
  isLoading: boolean;

  // Dialog state
  createDialogOpen: boolean;
  editingAva: Ava | null;
  shareDialogOpen: boolean;
  avaToShare: Ava | null;
  runDialogOpen: boolean;
  avaToRun: Ava | null;

  // Data loading
  loadAvas: () => Promise<void>;

  // Dialog controls
  openCreateDialog: (ava?: Ava) => void;
  closeCreateDialog: () => void;
  openShareDialog: (ava: Ava) => void;
  closeShareDialog: () => void;
  openRunDialog: (ava: Ava) => void;
  closeRunDialog: () => void;

  // Ava operations
  saveNewAva: (data: {
    name: string;
    description?: string;
    instructions: string;
    avatarUrl?: string;
    folderIds?: string[];
    tagIds?: string[];
  }) => Promise<Ava | null>;
  updateExistingAva: (
    avaId: string,
    data: {
      name: string;
      description?: string;
      instructions: string;
      avatarUrl?: string;
    }
  ) => Promise<Ava | null>;
  deleteAva: (avaId: string) => Promise<boolean>;
  toggleFavorite: (avaId: string, isFavorite: boolean) => Promise<void>;
  runAva: (
    avaId: string,
    apiId: string,
    inputText?: string,
    inputImages?: string[]
  ) => Promise<RunAvaResponse>;
  shareWithUsers: (
    avaId: string,
    userIds: string[],
    message?: string
  ) => Promise<void>;

  // Organization
  createFolder: (name: string) => Promise<AvaFolder | null>;
  createTag: (name: string) => Promise<AvaTag | null>;

  // User search
  searchUsers: (
    query: string
  ) => Promise<
    Array<{ id: string; username: string | null; avatar_url: string | null }>
  >;
}

export function useAvaVault(
  options: UseAvaVaultOptions = {}
): UseAvaVaultReturn {
  const { onAvaResult } = options;

  // Core state
  const [avas, setAvas] = React.useState<Ava[]>([]);
  const [folders, setFolders] = React.useState<AvaFolder[]>([]);
  const [tags, setTags] = React.useState<AvaTag[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingAva, setEditingAva] = React.useState<Ava | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [avaToShare, setAvaToShare] = React.useState<Ava | null>(null);
  const [runDialogOpen, setRunDialogOpen] = React.useState(false);
  const [avaToRun, setAvaToRun] = React.useState<Ava | null>(null);

  // Load ava data
  const loadAvas = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [avasData, foldersData, tagsData] = await Promise.all([
        getAvas(100, 0),
        getAvaFolders(),
        getAvaTags(),
      ]);
      setAvas(avasData);
      setFolders(foldersData);
      setTags(tagsData);
    } catch (error) {
      console.error("Failed to load avas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dialog controls
  const openCreateDialog = React.useCallback((ava?: Ava) => {
    setEditingAva(ava ?? null);
    setCreateDialogOpen(true);
  }, []);

  const closeCreateDialog = React.useCallback(() => {
    setCreateDialogOpen(false);
    setEditingAva(null);
  }, []);

  const openShareDialog = React.useCallback((ava: Ava) => {
    setAvaToShare(ava);
    setShareDialogOpen(true);
  }, []);

  const closeShareDialog = React.useCallback(() => {
    setShareDialogOpen(false);
    setAvaToShare(null);
  }, []);

  const openRunDialog = React.useCallback((ava: Ava) => {
    setAvaToRun(ava);
    setRunDialogOpen(true);
  }, []);

  const closeRunDialog = React.useCallback(() => {
    setRunDialogOpen(false);
    setAvaToRun(null);
  }, []);

  // Save new ava
  const saveNewAva = React.useCallback(
    async (data: {
      name: string;
      description?: string;
      instructions: string;
      avatarUrl?: string;
      folderIds?: string[];
      tagIds?: string[];
    }) => {
      const ava = await saveAva({
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        avatar_url: data.avatarUrl,
      });

      if (ava) {
        if (data.folderIds?.length) {
          await Promise.all(
            data.folderIds.map((folderId) => addAvaToFolder(ava.id, folderId))
          );
        }

        if (data.tagIds?.length) {
          await Promise.all(
            data.tagIds.map((tagId) => addTagToAva(ava.id, tagId))
          );
        }

        setAvas((prev) => [ava, ...prev]);
      }

      return ava;
    },
    []
  );

  // Update existing ava
  const updateExistingAva = React.useCallback(
    async (
      avaId: string,
      data: {
        name: string;
        description?: string;
        instructions: string;
        avatarUrl?: string;
      }
    ) => {
      const updated = await updateAvaServer(avaId, {
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        avatar_url: data.avatarUrl,
      });

      if (updated) {
        setAvas((prev) => prev.map((a) => (a.id === avaId ? updated : a)));
      }

      return updated;
    },
    []
  );

  // Delete ava
  const deleteAva = React.useCallback(async (avaId: string) => {
    const success = await deleteAvaServer(avaId);
    if (success) {
      setAvas((prev) => prev.filter((a) => a.id !== avaId));
    }
    return success;
  }, []);

  // Toggle favorite
  const toggleFavorite = React.useCallback(
    async (avaId: string, isFavorite: boolean) => {
      await toggleAvaFavorite(avaId, isFavorite);
      setAvas((prev) =>
        prev.map((a) =>
          a.id === avaId ? { ...a, is_favorite: isFavorite } : a
        )
      );
    },
    []
  );

  // Run ava
  const runAva = React.useCallback(
    async (
      avaId: string,
      apiId: string,
      inputText?: string,
      inputImages?: string[]
    ): Promise<RunAvaResponse> => {
      try {
        const response = await fetch("/api/ava/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avaId, apiId, inputText, inputImages }),
        });

        const result: RunAvaResponse = await response.json();

        if (result.success && result.prompt) {
          // Update use count locally
          setAvas((prev) =>
            prev.map((a) =>
              a.id === avaId ? { ...a, use_count: a.use_count + 1 } : a
            )
          );

          onAvaResult?.({
            prompt: result.prompt,
            negativePrompt: result.negativePrompt,
          });
        }

        return result;
      } catch (error) {
        console.error("Failed to run ava:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to run Ava",
        };
      }
    },
    [onAvaResult]
  );

  // Share with users
  const shareWithUsers = React.useCallback(
    async (avaId: string, userIds: string[], message?: string) => {
      await Promise.all(
        userIds.map((userId) =>
          shareAvaWithUser({
            ava_id: avaId,
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
    const folder = await createAvaFolder({ name });
    if (folder) {
      setFolders((prev) => [...prev, folder]);
    }
    return folder;
  }, []);

  // Create tag
  const createTag = React.useCallback(async (name: string) => {
    const tag = await createAvaTag({ name });
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
    avas,
    folders,
    tags,
    isLoading,
    createDialogOpen,
    editingAva,
    shareDialogOpen,
    avaToShare,
    runDialogOpen,
    avaToRun,
    loadAvas,
    openCreateDialog,
    closeCreateDialog,
    openShareDialog,
    closeShareDialog,
    openRunDialog,
    closeRunDialog,
    saveNewAva,
    updateExistingAva,
    deleteAva,
    toggleFavorite,
    runAva,
    shareWithUsers,
    createFolder,
    createTag,
    searchUsers,
  };
}
