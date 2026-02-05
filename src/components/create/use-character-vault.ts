"use client";

import * as React from "react";
import type {
  Character,
  CharacterFolder,
  CharacterTag,
  CharacterImage,
  CharacterSelectionResult,
  SaveCharacterFormData,
} from "@/types/character";
import type { GenerationSettings, ReferenceImageInfo } from "@/types/generation";
import {
  saveCharacter,
  getCharactersWithPreviewImages,
  getCharacterWithAllImages,
  deleteCharacter as deleteCharacterServer,
  updateCharacter as updateCharacterServer,
  toggleCharacterFavorite,
  getCharacterFolders,
  createCharacterFolder,
  getCharacterTags,
  createCharacterTag,
  addCharacterToFolder,
  addTagToCharacter,
  incrementCharacterUseCount,
  uploadCharacterImage,
  deleteCharacterImage as deleteCharacterImageServer,
  linkGenerationToCharacter as linkGenerationToCharacterServer,
  unlinkGenerationFromCharacter as unlinkGenerationFromCharacterServer,
  getGenerationCharacters,
} from "@/utils/supabase/characters.server";

interface UseCharacterVaultOptions {
  /** Called when a character is selected for generation (merge/append behavior) */
  onCharacterSelected?: (result: CharacterSelectionResult) => void;
}

interface UseCharacterVaultReturn {
  // State
  characters: Character[];
  folders: CharacterFolder[];
  tags: CharacterTag[];
  isLoading: boolean;
  vaultOpen: boolean;
  saveDialogOpen: boolean;
  editingCharacter: Character | null;
  selectedCharacter: Character | null;

  // Actions
  loadVault: () => Promise<void>;
  toggleVault: () => void;
  openVault: () => void;
  closeVault: () => void;
  openSaveDialog: (existingCharacter?: Character) => void;
  closeSaveDialog: () => void;

  // Character operations
  saveNewCharacter: (data: SaveCharacterFormData) => Promise<Character | null>;
  updateCharacter: (characterId: string, data: SaveCharacterFormData) => Promise<Character | null>;
  deleteCharacter: (characterId: string) => Promise<boolean>;
  toggleFavorite: (characterId: string, isFavorite: boolean) => Promise<void>;

  // Character selection (merge/append behavior)
  selectCharacter: (
    character: Character,
    currentPrompt: string,
    currentSettings: Partial<GenerationSettings>
  ) => void;
  clearSelectedCharacter: () => void;

  // Image operations
  addImageToCharacter: (characterId: string, file: File) => Promise<CharacterImage | null>;
  removeImageFromCharacter: (imageId: string) => Promise<boolean>;

  // Folder operations
  createFolder: (name: string) => Promise<CharacterFolder | null>;

  // Tag operations
  createTag: (name: string) => Promise<CharacterTag | null>;

  // Generation linking (manual)
  linkGenerationToCharacter: (generationId: string, characterId: string) => Promise<boolean>;
  unlinkGenerationFromCharacter: (generationId: string, characterId: string) => Promise<boolean>;
  getCharactersForGeneration: (generationId: string) => Promise<Character[]>;
}

export function useCharacterVault(
  options: UseCharacterVaultOptions = {}
): UseCharacterVaultReturn {
  const { onCharacterSelected } = options;

  // Core state
  const [characters, setCharacters] = React.useState<Character[]>([]);
  const [folders, setFolders] = React.useState<CharacterFolder[]>([]);
  const [tags, setTags] = React.useState<CharacterTag[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // UI state
  const [vaultOpen, setVaultOpen] = React.useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [editingCharacter, setEditingCharacter] = React.useState<Character | null>(null);
  const [selectedCharacter, setSelectedCharacter] = React.useState<Character | null>(null);

  // Load vault data
  const loadVault = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [charactersData, foldersData, tagsData] = await Promise.all([
        getCharactersWithPreviewImages(100, 0, 3),
        getCharacterFolders(),
        getCharacterTags(),
      ]);
      setCharacters(charactersData);
      setFolders(foldersData);
      setTags(tagsData);
    } catch (error) {
      console.error("Failed to load character vault:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load vault when opened
  React.useEffect(() => {
    if (vaultOpen && characters.length === 0) {
      loadVault();
    }
  }, [vaultOpen, characters.length, loadVault]);

  // Vault controls
  const toggleVault = React.useCallback(() => {
    setVaultOpen((prev) => !prev);
  }, []);

  const openVault = React.useCallback(() => {
    setVaultOpen(true);
  }, []);

  const closeVault = React.useCallback(() => {
    setVaultOpen(false);
  }, []);

  // Dialog controls
  const openSaveDialog = React.useCallback((existingCharacter?: Character) => {
    setEditingCharacter(existingCharacter ?? null);
    setSaveDialogOpen(true);
  }, []);

  const closeSaveDialog = React.useCallback(() => {
    setSaveDialogOpen(false);
    setEditingCharacter(null);
  }, []);

  // Save new character
  const saveNewCharacter = React.useCallback(
    async (data: SaveCharacterFormData) => {
      const character = await saveCharacter({
        name: data.name,
        description: data.description,
        prompt_template: data.promptTemplate,
        negative_prompt: data.negativePrompt,
        settings: data.settings,
      });

      if (character) {
        // Add to folders
        if (data.folderIds?.length) {
          await Promise.all(
            data.folderIds.map((folderId) =>
              addCharacterToFolder(character.id, folderId)
            )
          );
        }

        // Add tags
        if (data.tagIds?.length) {
          await Promise.all(
            data.tagIds.map((tagId) => addTagToCharacter(character.id, tagId))
          );
        }

        // Update local state
        setCharacters((prev) => [character, ...prev]);
      }

      return character;
    },
    []
  );

  // Update existing character
  const updateCharacter = React.useCallback(
    async (characterId: string, data: SaveCharacterFormData) => {
      const character = await updateCharacterServer(characterId, {
        name: data.name,
        description: data.description,
        prompt_template: data.promptTemplate,
        negative_prompt: data.negativePrompt,
        settings: data.settings,
      });

      if (character) {
        // Update local state
        setCharacters((prev) =>
          prev.map((c) => (c.id === characterId ? { ...c, ...character } : c))
        );
      }

      return character;
    },
    []
  );

  // Delete character
  const deleteCharacter = React.useCallback(async (characterId: string) => {
    const success = await deleteCharacterServer(characterId);
    if (success) {
      setCharacters((prev) => prev.filter((c) => c.id !== characterId));
    }
    return success;
  }, []);

  // Toggle favorite
  const toggleFavorite = React.useCallback(
    async (characterId: string, isFavorite: boolean) => {
      await toggleCharacterFavorite(characterId, isFavorite);
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId ? { ...c, is_favorite: isFavorite } : c
        )
      );
    },
    []
  );

  // Select character (merge/append behavior)
  const selectCharacter = React.useCallback(
    async (
      character: Character,
      currentPrompt: string,
      currentSettings: Partial<GenerationSettings>
    ) => {
      // Load full character with all images if needed
      let fullCharacter = character;
      if (!character.images || character.images.length === 0) {
        const loaded = await getCharacterWithAllImages(character.id);
        if (loaded) {
          fullCharacter = loaded;
        }
      }

      // Increment use count (fire and forget)
      incrementCharacterUseCount(character.id);

      // Update local state for use count
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === character.id ? { ...c, use_count: c.use_count + 1 } : c
        )
      );

      // MERGE/APPEND behavior:
      // 1. Append character prompt to current prompt
      const mergedPrompt = currentPrompt.trim()
        ? `${currentPrompt.trim()}\n\n${fullCharacter.prompt_template}`
        : fullCharacter.prompt_template;

      // 2. Merge settings (user values take priority)
      const mergedSettings: Partial<GenerationSettings> = {
        ...fullCharacter.settings, // Character defaults
        ...currentSettings, // User overrides take priority
      };

      // 3. Load character's reference images
      const referenceImages: ReferenceImageInfo[] = (fullCharacter.images || []).map(
        (img) => ({
          url: img.url,
          storagePath: img.storage_path,
        })
      );

      // Set as selected character
      setSelectedCharacter(fullCharacter);

      // Notify parent with merged result
      onCharacterSelected?.({
        character: fullCharacter,
        mergedPrompt,
        mergedSettings,
        referenceImages,
      });
    },
    [onCharacterSelected]
  );

  // Clear selected character
  const clearSelectedCharacter = React.useCallback(() => {
    setSelectedCharacter(null);
  }, []);

  // Add image to character
  const addImageToCharacter = React.useCallback(
    async (characterId: string, file: File): Promise<CharacterImage | null> => {
      const formData = new FormData();
      formData.append("file", file);

      const image = await uploadCharacterImage(characterId, formData);

      if (image) {
        // Update local state
        setCharacters((prev) =>
          prev.map((c) => {
            if (c.id === characterId) {
              const images = c.images || [];
              return { ...c, images: [...images, image] };
            }
            return c;
          })
        );
      }

      return image;
    },
    []
  );

  // Remove image from character
  const removeImageFromCharacter = React.useCallback(
    async (imageId: string): Promise<boolean> => {
      const success = await deleteCharacterImageServer(imageId);

      if (success) {
        // Update local state
        setCharacters((prev) =>
          prev.map((c) => {
            if (c.images) {
              return {
                ...c,
                images: c.images.filter((img) => img.id !== imageId),
              };
            }
            return c;
          })
        );
      }

      return success;
    },
    []
  );

  // Create folder
  const createFolder = React.useCallback(async (name: string) => {
    const folder = await createCharacterFolder({ name });
    if (folder) {
      setFolders((prev) => [...prev, folder]);
    }
    return folder;
  }, []);

  // Create tag
  const createTag = React.useCallback(async (name: string) => {
    const tag = await createCharacterTag({ name });
    if (tag) {
      setTags((prev) => [...prev, tag]);
    }
    return tag;
  }, []);

  // Link generation to character
  const linkGenerationToCharacter = React.useCallback(
    async (generationId: string, characterId: string): Promise<boolean> => {
      return await linkGenerationToCharacterServer(generationId, characterId);
    },
    []
  );

  // Unlink generation from character
  const unlinkGenerationFromCharacter = React.useCallback(
    async (generationId: string, characterId: string): Promise<boolean> => {
      return await unlinkGenerationFromCharacterServer(generationId, characterId);
    },
    []
  );

  // Get characters for a generation
  const getCharactersForGeneration = React.useCallback(
    async (generationId: string): Promise<Character[]> => {
      return await getGenerationCharacters(generationId);
    },
    []
  );

  return {
    // State
    characters,
    folders,
    tags,
    isLoading,
    vaultOpen,
    saveDialogOpen,
    editingCharacter,
    selectedCharacter,

    // Actions
    loadVault,
    toggleVault,
    openVault,
    closeVault,
    openSaveDialog,
    closeSaveDialog,

    // Character operations
    saveNewCharacter,
    updateCharacter,
    deleteCharacter,
    toggleFavorite,

    // Character selection
    selectCharacter,
    clearSelectedCharacter,

    // Image operations
    addImageToCharacter,
    removeImageFromCharacter,

    // Folder operations
    createFolder,

    // Tag operations
    createTag,

    // Generation linking
    linkGenerationToCharacter,
    unlinkGenerationFromCharacter,
    getCharactersForGeneration,
  };
}
