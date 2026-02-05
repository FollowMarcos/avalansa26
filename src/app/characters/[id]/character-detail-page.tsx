"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Character, CharacterImage, CharacterUpdate } from "@/types/character";
import type { Generation } from "@/types/generation";
import {
  getCharacterGenerations,
  deleteCharacter,
  toggleCharacterFavorite,
  updateCharacter,
  uploadCharacterImage,
  deleteCharacterImage,
  setCharacterPrimaryImage,
} from "@/utils/supabase/characters.server";
import { createClient } from "@/utils/supabase/client";
import { resizeImageToSize, PROMPT_IMAGE_MAX_SIZE } from "@/lib/image-utils";
import {
  ArrowLeft,
  Heart,
  Trash2,
  Copy,
  Sparkles,
  Clock,
  ImagePlus,
  X,
  Loader2,
  Settings2,
  Star,
  User,
  Pencil,
  Check,
  ImageIcon,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CharacterDetailPageProps {
  characterId: string;
  initialCharacter: Character;
}

export function CharacterDetailPage({
  characterId,
  initialCharacter,
}: CharacterDetailPageProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // Character state
  const [character, setCharacter] = React.useState<Character>(initialCharacter);
  const [isOwner, setIsOwner] = React.useState(false);

  // Linked generations state
  const [linkedGenerations, setLinkedGenerations] = React.useState<Generation[]>([]);
  const [isLoadingGenerations, setIsLoadingGenerations] = React.useState(true);

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editName, setEditName] = React.useState(character.name);
  const [editDescription, setEditDescription] = React.useState(
    character.description || ""
  );
  const [editPromptTemplate, setEditPromptTemplate] = React.useState(
    character.prompt_template
  );
  const [editNegativePrompt, setEditNegativePrompt] = React.useState(
    character.negative_prompt || ""
  );
  const [isSaving, setIsSaving] = React.useState(false);

  // Action states
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [settingPrimaryId, setSettingPrimaryId] = React.useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = React.useState<string | null>(null);

  // Load data on mount
  React.useEffect(() => {
    loadData();
  }, [characterId]);

  const loadData = async () => {
    setIsLoadingGenerations(true);

    // Parallel fetch: auth check and generations
    const supabase = createClient();
    const [authResult, generations] = await Promise.all([
      supabase.auth.getUser(),
      getCharacterGenerations(characterId, 50, 0),
    ]);

    if (authResult.data.user) {
      setIsOwner(character.user_id === authResult.data.user.id);
    }

    setLinkedGenerations(generations);
    setIsLoadingGenerations(false);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    const newValue = !character.is_favorite;
    setCharacter((prev) => ({ ...prev, is_favorite: newValue }));
    await toggleCharacterFavorite(characterId, newValue);
    toast.success(newValue ? "Added to favorites" : "Removed from favorites");
  };

  // Handle copy prompt template
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(character.prompt_template);
      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Handle use in create
  const handleUseInCreate = () => {
    sessionStorage.setItem("loadCharacter", JSON.stringify(character));
    router.push("/create");
  };

  // Handle edit save
  const handleSaveEdit = async () => {
    if (!editName.trim() || !editPromptTemplate.trim()) {
      toast.error("Name and prompt template are required");
      return;
    }

    setIsSaving(true);
    const updateData: CharacterUpdate = {
      name: editName.trim(),
      description: editDescription.trim() || null,
      prompt_template: editPromptTemplate.trim(),
      negative_prompt: editNegativePrompt.trim() || null,
    };

    const updated = await updateCharacter(characterId, updateData);
    if (updated) {
      setCharacter((prev) => ({ ...prev, ...updated }));
      toast.success("Character updated");
      setEditDialogOpen(false);
    } else {
      toast.error("Failed to update character");
    }
    setIsSaving(false);
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteCharacter(characterId);
    if (success) {
      toast.success("Character deleted");
      router.push("/characters");
    } else {
      toast.error("Failed to delete character");
      setIsDeleting(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { blob } = await resizeImageToSize(file, PROMPT_IMAGE_MAX_SIZE);
      const resizedFile = new File([blob], file.name, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", resizedFile);

      const image = await uploadCharacterImage(characterId, formData);
      if (image) {
        setCharacter((prev) => ({
          ...prev,
          images: [...(prev.images ?? []), image],
        }));
        toast.success("Image added");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // Handle image delete
  const handleDeleteImage = async (imageId: string) => {
    setDeletingImageId(imageId);
    const success = await deleteCharacterImage(imageId);
    if (success) {
      setCharacter((prev) => ({
        ...prev,
        images: prev.images?.filter((img) => img.id !== imageId),
        primary_image:
          prev.primary_image?.id === imageId ? null : prev.primary_image,
      }));
      toast.success("Image removed");
    } else {
      toast.error("Failed to remove image");
    }
    setDeletingImageId(null);
  };

  // Handle set primary image
  const handleSetPrimaryImage = async (imageId: string) => {
    setSettingPrimaryId(imageId);
    const success = await setCharacterPrimaryImage(characterId, imageId);
    if (success) {
      setCharacter((prev) => ({
        ...prev,
        images: prev.images?.map((img) => ({
          ...img,
          is_primary: img.id === imageId,
        })),
        primary_image: prev.images?.find((img) => img.id === imageId) || null,
      }));
      toast.success("Primary image updated");
    } else {
      toast.error("Failed to set primary image");
    }
    setSettingPrimaryId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const primaryImage =
    character.primary_image ||
    character.images?.find((img) => img.is_primary) ||
    character.images?.[0];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                  <Link href="/characters">
                    <ArrowLeft className="size-4" />
                    <span className="sr-only">Back to Characters</span>
                  </Link>
                </Button>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border">
                    {primaryImage ? (
                      <AvatarImage
                        src={primaryImage.url}
                        alt=""
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback>
                      <User className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-xl font-semibold flex items-center gap-2 text-balance">
                      {character.name}
                      {character.is_favorite && (
                        <Heart className="size-4 text-red-500 fill-red-500" aria-hidden="true" />
                      )}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDate(character.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleToggleFavorite}
                      aria-label={
                        character.is_favorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <Heart
                        className={cn(
                          "size-4",
                          character.is_favorite && "fill-red-500 text-red-500"
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {character.is_favorite
                      ? "Remove from favorites"
                      : "Add to favorites"}
                  </TooltipContent>
                </Tooltip>

                {isOwner && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Edit character"
                        onClick={() => {
                          setEditName(character.name);
                          setEditDescription(character.description || "");
                          setEditPromptTemplate(character.prompt_template);
                          setEditNegativePrompt(character.negative_prompt || "");
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit character</TooltipContent>
                  </Tooltip>
                )}

                <Button onClick={handleUseInCreate}>
                  <Sparkles className="size-4 mr-2" />
                  Use in Create
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="space-y-8"
          >
            {/* Description */}
            {character.description && (
              <section className="space-y-2">
                <p className="text-muted-foreground">{character.description}</p>
              </section>
            )}

            {/* Images Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-balance">
                  <ImageIcon className="size-4" aria-hidden="true" />
                  Reference Images
                </h2>
                {isOwner && (
                  <div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="detail-image-upload"
                      aria-label="Upload reference image"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <ImagePlus className="size-4 mr-2" />
                      )}
                      Add Image
                    </Button>
                  </div>
                )}
              </div>

              {character.images && character.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {character.images.map((image) => (
                    <div
                      key={image.id}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden bg-muted group",
                        image.is_primary && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                      {image.is_primary && (
                        <div className="absolute top-2 left-2">
                          <Badge className="gap-1 text-[10px]">
                            <Star className="size-2.5 fill-current" />
                            Primary
                          </Badge>
                        </div>
                      )}
                      {isOwner && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                          {!image.is_primary && (
                            <button
                              onClick={() => handleSetPrimaryImage(image.id)}
                              disabled={settingPrimaryId === image.id}
                              className="size-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                              aria-label="Set as primary image"
                            >
                              {settingPrimaryId === image.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Star className="size-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={deletingImageId === image.id}
                            className="size-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-colors"
                            aria-label="Delete image"
                          >
                            {deletingImageId === image.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <X className="size-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : isOwner ? (
                <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                  <ImagePlus className="size-8 text-muted-foreground/50 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground text-pretty">
                    No images yet. Add reference images for this character.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border bg-muted/30 p-8 text-center">
                  <ImageIcon className="size-8 text-muted-foreground/50 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground text-pretty">
                    No reference images
                  </p>
                </div>
              )}
            </section>

            {/* Prompt Template Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-balance">Prompt Template</h2>
                <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                  <Copy className="size-4 mr-2" />
                  Copy
                </Button>
              </div>

              <div className="rounded-xl bg-muted/50 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {character.prompt_template}
              </div>

              {character.negative_prompt && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Negative Prompt</Label>
                  <div className="rounded-xl bg-red-500/10 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    <span className="text-red-500 font-semibold">Negative:</span>{" "}
                    {character.negative_prompt}
                  </div>
                </div>
              )}
            </section>

            {/* Settings Section */}
            {character.settings && Object.keys(character.settings).length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-balance">
                  <Settings2 className="size-4" aria-hidden="true" />
                  Saved Settings
                </h2>
                <div className="flex flex-wrap gap-2">
                  {character.settings.aspectRatio && (
                    <Badge variant="outline">
                      Aspect: {character.settings.aspectRatio}
                    </Badge>
                  )}
                  {character.settings.imageSize && (
                    <Badge variant="outline">
                      Size: {character.settings.imageSize}
                    </Badge>
                  )}
                  {character.settings.model && (
                    <Badge variant="outline">
                      Model: {character.settings.model}
                    </Badge>
                  )}
                  {character.settings.outputCount && (
                    <Badge variant="outline">
                      Count: {character.settings.outputCount}
                    </Badge>
                  )}
                </div>
              </section>
            )}

            {/* Stats Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-balance">Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-2xl font-bold tabular-nums">{character.use_count}</div>
                  <div className="text-sm text-muted-foreground">Times used</div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-2xl font-bold tabular-nums">
                    {character.images?.length ?? 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Reference images
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-2xl font-bold tabular-nums">
                    {linkedGenerations.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Linked generations
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-sm font-medium">
                    {formatRelativeTime(character.updated_at)}
                  </div>
                  <div className="text-sm text-muted-foreground">Last updated</div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Linked Generations Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-balance">
                <Hash className="size-4" aria-hidden="true" />
                Linked Generations
              </h2>

              {isLoadingGenerations ? (
                <div
                  className="flex items-center justify-center py-8"
                  role="status"
                  aria-label="Loading linked generations"
                >
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  <span className="sr-only">Loading linked generations...</span>
                </div>
              ) : linkedGenerations.length === 0 ? (
                <div className="rounded-xl border bg-muted/30 p-8 text-center">
                  <ImageIcon className="size-8 text-muted-foreground/50 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground text-pretty">
                    No linked generations yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 text-pretty">
                    Link generations to this character from the image details panel
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {linkedGenerations.map((generation) => (
                    <div
                      key={generation.id}
                      role="button"
                      tabIndex={0}
                      className="relative aspect-square rounded-xl overflow-hidden bg-muted group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={() => {
                        // Could open a modal or navigate to generation detail
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          // Could open a modal or navigate to generation detail
                        }
                      }}
                      aria-label={`View generation: ${generation.prompt.slice(0, 50)}${generation.prompt.length > 50 ? "…" : ""}`}
                    >
                      <Image
                        src={generation.image_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs line-clamp-2">
                            {generation.prompt}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Danger Zone (Owner only) */}
            {isOwner && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-destructive text-balance">
                  Danger Zone
                </h2>
                <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete this character</p>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. All images will be deleted.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                          {isDeleting ? (
                            <Loader2 className="size-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="size-4 mr-2" />
                          )}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete character?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{character.name}" and all
                            associated images. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </section>
            )}
          </motion.div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="size-4" />
                Edit Character
              </DialogTitle>
              <DialogDescription>
                Update the details for "{character.name}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Character name…"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Brief description…"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-prompt">
                  Prompt Template <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="edit-prompt"
                  value={editPromptTemplate}
                  onChange={(e) => setEditPromptTemplate(e.target.value)}
                  placeholder="Prompt template…"
                  rows={4}
                  className="resize-none font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-negative">Negative Prompt</Label>
                <Textarea
                  id="edit-negative"
                  value={editNegativePrompt}
                  onChange={(e) => setEditNegativePrompt(e.target.value)}
                  placeholder="Things to avoid…"
                  rows={2}
                  className="resize-none font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={
                  isSaving || !editName.trim() || !editPromptTemplate.trim()
                }
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="size-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
