'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Brain,
  MessageSquare,
  Image,
  Zap,
  Box,
  Settings,
  KeyRound,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getUserPersonalApiConfigs,
  createApiConfig,
  updateApiConfig,
  deleteApiConfig,
} from '@/utils/supabase/api-configs.server';
import { createClient } from '@/utils/supabase/client';
import type { ApiConfig, ApiConfigInsert, ApiConfigUpdate } from '@/types/api-config';
import { API_PROVIDERS } from '@/types/api-config';

const providerIcons: Record<string, LucideIcon> = {
  google: Sparkles,
  openai: Brain,
  anthropic: MessageSquare,
  stability: Image,
  fal: Zap,
  replicate: Box,
  custom: Settings,
};

const PROVIDER_PRESETS: Record<string, { endpoint: string; modelPlaceholder: string }> = {
  google: { endpoint: 'https://generativelanguage.googleapis.com', modelPlaceholder: 'gemini-2.0-flash-exp' },
  fal: { endpoint: 'https://fal.run', modelPlaceholder: 'fal-ai/flux/dev' },
  openai: { endpoint: 'https://api.openai.com/v1', modelPlaceholder: 'dall-e-3' },
  stability: { endpoint: 'https://api.stability.ai/v2beta', modelPlaceholder: 'stable-diffusion-xl-1024-v1-0' },
  replicate: { endpoint: 'https://api.replicate.com/v1', modelPlaceholder: 'stability-ai/sdxl' },
  anthropic: { endpoint: 'https://api.anthropic.com/v1', modelPlaceholder: '' },
  custom: { endpoint: '', modelPlaceholder: '' },
};

interface FormState {
  name: string;
  provider: string;
  endpoint: string;
  modelId: string;
  apiKey: string;
  enableSafetyChecker: boolean;
}

const emptyForm: FormState = {
  name: '',
  provider: 'fal',
  endpoint: PROVIDER_PRESETS.fal.endpoint,
  modelId: '',
  apiKey: '',
  enableSafetyChecker: true,
};

export function PersonalApiManager() {
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadApis = useCallback(async () => {
    setIsLoading(true);
    const data = await getUserPersonalApiConfigs();
    setApis(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadApis();
  }, [loadApis]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowKey(false);
    setDialogOpen(true);
  };

  const openEditDialog = (api: ApiConfig) => {
    setEditingId(api.id);
    setForm({
      name: api.name,
      provider: api.provider,
      endpoint: api.endpoint,
      modelId: api.model_id || '',
      apiKey: '',
      enableSafetyChecker: api.model_info?.enableSafetyChecker ?? true,
    });
    setShowKey(false);
    setDialogOpen(true);
  };

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom;
    setForm((prev) => ({
      ...prev,
      provider,
      endpoint: editingId ? prev.endpoint : preset.endpoint,
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.endpoint.trim()) {
      toast.error('Endpoint is required');
      return;
    }
    if (!editingId && !form.apiKey.trim()) {
      toast.error('API key is required');
      return;
    }

    setIsSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Not authenticated');
      setIsSaving(false);
      return;
    }

    const modelInfo = form.provider === 'fal'
      ? { enableSafetyChecker: form.enableSafetyChecker }
      : null;

    if (editingId) {
      const updates: ApiConfigUpdate = {
        name: form.name.trim(),
        provider: form.provider,
        endpoint: form.endpoint.trim(),
        model_id: form.modelId.trim() || null,
        model_info: modelInfo,
      };
      if (form.apiKey.trim()) {
        updates.api_key = form.apiKey.trim();
      }

      const result = await updateApiConfig(editingId, updates);
      if (result) {
        toast.success('API updated');
        setDialogOpen(false);
        loadApis();
      } else {
        toast.error('Failed to update API');
      }
    } else {
      const config: ApiConfigInsert = {
        owner_id: user.id,
        name: form.name.trim(),
        provider: form.provider,
        endpoint: form.endpoint.trim(),
        api_key: form.apiKey.trim(),
        model_id: form.modelId.trim() || null,
        model_info: modelInfo,
        access_level: 'restricted',
        is_active: true,
      };

      const result = await createApiConfig(config);
      if (result) {
        toast.success('API added');
        setDialogOpen(false);
        loadApis();
      } else {
        toast.error('Failed to add API');
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const success = await deleteApiConfig(id);
    if (success) {
      toast.success('API removed');
      setApis((prev) => prev.filter((a) => a.id !== id));
    } else {
      toast.error('Failed to delete API');
    }
    setDeletingId(null);
  };

  const preset = PROVIDER_PRESETS[form.provider] || PROVIDER_PRESETS.custom;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-vt323 text-xl text-primary">Your API Keys</h2>
          <p className="text-xs text-muted-foreground font-lato mt-1">
            Add your own API keys to use with image generation providers.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          size="sm"
          className="rounded-full gap-1.5"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add API
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : apis.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
          <KeyRound className="size-8 text-muted-foreground/40 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground font-lato">No personal APIs yet</p>
          <p className="text-xs text-muted-foreground/60 font-lato mt-1">
            Add your own API keys to use providers like Fal.ai, Google AI, or OpenAI.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {apis.map((api) => {
            const Icon = providerIcons[api.provider] || Settings;
            return (
              <div
                key={api.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:bg-muted/20 transition-colors"
              >
                <div className="size-10 rounded-full border border-border flex items-center justify-center bg-muted/30 shrink-0">
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium font-lato truncate">{api.name}</p>
                    <Badge variant="outline" className="rounded-full text-[10px] shrink-0">
                      {api.provider}
                    </Badge>
                  </div>
                  {api.model_id && (
                    <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                      {api.model_id}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => openEditDialog(api)}
                    aria-label={`Edit ${api.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirmId(api.id)}
                    disabled={deletingId === api.id}
                    aria-label={`Delete ${api.name}`}
                  >
                    {deletingId === api.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-vt323 text-xl">
              {editingId ? 'Edit API' : 'Add API'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update your API configuration. Leave the key blank to keep the existing one.'
                : 'Add your own API key for image generation. Keys are encrypted at rest.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Provider */}
            <div className="grid gap-2">
              <Label htmlFor="api-provider" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Provider
              </Label>
              <select
                id="api-provider"
                value={form.provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {API_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="api-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Name
              </Label>
              <Input
                id="api-name"
                placeholder="My Fal.ai Key…"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            {/* API Key */}
            <div className="grid gap-2">
              <Label htmlFor="api-key" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                API Key {editingId && <span className="normal-case font-normal">(leave blank to keep current)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder={editingId ? '••••••••••••••••' : 'sk-…'}
                  value={form.apiKey}
                  onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                  className="rounded-xl pr-10"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Endpoint */}
            <div className="grid gap-2">
              <Label htmlFor="api-endpoint" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Endpoint
              </Label>
              <Input
                id="api-endpoint"
                placeholder={preset.endpoint || 'https://api.example.com'}
                value={form.endpoint}
                onChange={(e) => setForm((prev) => ({ ...prev, endpoint: e.target.value }))}
                className="rounded-xl font-mono text-xs"
              />
            </div>

            {/* Model ID */}
            <div className="grid gap-2">
              <Label htmlFor="api-model" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Model ID <span className="normal-case font-normal">(optional)</span>
              </Label>
              <Input
                id="api-model"
                placeholder={preset.modelPlaceholder || 'model-name'}
                value={form.modelId}
                onChange={(e) => setForm((prev) => ({ ...prev, modelId: e.target.value }))}
                className="rounded-xl font-mono text-xs"
              />
            </div>

            {/* Safety Checker (fal.ai only) */}
            {form.provider === 'fal' && (
              <div className="flex items-center justify-between rounded-xl border border-input p-3">
                <div>
                  <Label htmlFor="safety-checker" className="text-xs font-semibold">
                    Safety Checker
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Filter unsafe or inappropriate content
                  </p>
                </div>
                <Switch
                  id="safety-checker"
                  checked={form.enableSafetyChecker}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, enableSafetyChecker: checked }))
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full gap-1.5"
            >
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              {editingId ? 'Update' : 'Add API'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">
                {apis.find((a) => a.id === deleteConfirmId)?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) handleDelete(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
