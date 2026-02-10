'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Globe,
  Users,
  Fingerprint,
  Sparkles,
  Brain,
  MessageSquare,
  Image,
  Zap,
  Box,
  Settings,
  Check,
  Server,
  Key,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AllowedViewers } from '@/components/settings/allowed-viewers';

import type { ApiConfig, ApiConfigInsert, ApiConfigUpdate, ApiAccessLevel } from '@/types/api-config';
import { API_PROVIDERS, API_ACCESS_LEVELS } from '@/types/api-config';
import {
  getGlobalApiConfigs,
  createApiConfig,
  updateApiConfig,
  deleteApiConfig,
} from '@/utils/supabase/api-configs.server';

// Provider icon mapping
const providerIcons: Record<string, LucideIcon> = {
  google: Sparkles,
  openai: Brain,
  anthropic: MessageSquare,
  stability: Image,
  fal: Zap,
  replicate: Box,
  custom: Settings,
};

// Access level icon mapping
const accessLevelIcons: Record<ApiAccessLevel, LucideIcon> = {
  public: Globe,
  authenticated: Users,
  restricted: Fingerprint,
};

interface ApiFormData {
  name: string;
  provider: string;
  description: string;
  endpoint: string;
  api_key: string;
  model_id: string;
  access_level: ApiAccessLevel;
  allowed_users: string[];
  is_active: boolean;
  enable_safety_checker: boolean;
}

const defaultFormData: ApiFormData = {
  name: '',
  provider: 'google',
  description: '',
  endpoint: '',
  api_key: '',
  model_id: '',
  access_level: 'authenticated',
  allowed_users: [],
  is_active: true,
  enable_safety_checker: true,
};

function ApiCard({
  api,
  onEdit,
  onDelete,
}: {
  api: ApiConfig;
  onEdit: (api: ApiConfig) => void;
  onDelete: (api: ApiConfig) => void;
}) {
  const ProviderIcon = providerIcons[api.provider] || Settings;
  const AccessIcon = accessLevelIcons[api.access_level];
  const providerName = API_PROVIDERS.find((p) => p.id === api.provider)?.name || api.provider;

  return (
    <div className="flex items-center gap-4 p-4 bg-card border rounded-lg shadow-sm group hover:border-primary/50 transition-colors">
      <div
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-lg shadow-sm',
          'bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900'
        )}
      >
        <ProviderIcon className="w-6 h-6 text-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{api.name}</span>
          {!api.is_active && (
            <Badge variant="secondary" className="text-[10px] h-5">
              Inactive
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{providerName}</span>
          <span>·</span>
          <div className="flex items-center gap-1">
            <AccessIcon className="w-3 h-3" />
            <span className="capitalize">{api.access_level}</span>
          </div>
          {api.model_id && (
            <>
              <span>·</span>
              <span className="truncate max-w-[150px]">{api.model_id}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(api)}
          aria-label={`Edit ${api.name}`}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(api)}
          aria-label={`Delete ${api.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function ApiManager() {
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [apiToDelete, setApiToDelete] = useState<ApiConfig | null>(null);
  const [editingApi, setEditingApi] = useState<ApiConfig | null>(null);
  const [formData, setFormData] = useState<ApiFormData>(defaultFormData);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadApis();
  }, []);

  async function loadApis() {
    setIsLoading(true);
    const data = await getGlobalApiConfigs();
    setApis(data);
    setIsLoading(false);
  }

  const handleSaveApi = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.endpoint.trim()) {
      toast.error('Endpoint is required');
      return;
    }
    if (!editingApi && !formData.api_key.trim()) {
      toast.error('API Key is required');
      return;
    }

    setIsSaving(true);

    const modelInfo = formData.provider === 'fal'
      ? { enableSafetyChecker: formData.enable_safety_checker }
      : null;

    if (editingApi) {
      // Update existing API
      const updates: ApiConfigUpdate = {
        name: formData.name,
        provider: formData.provider,
        description: formData.description || null,
        endpoint: formData.endpoint,
        model_id: formData.model_id || null,
        model_info: modelInfo,
        access_level: formData.access_level,
        allowed_users: formData.allowed_users,
        is_active: formData.is_active,
      };

      // Only include API key if it was changed
      if (formData.api_key.trim()) {
        updates.api_key = formData.api_key;
      }

      const updated = await updateApiConfig(editingApi.id, updates);
      if (updated) {
        setApis((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        toast.success('API updated successfully');
      } else {
        toast.error('Failed to update API');
      }
    } else {
      // Create new API
      const newApi: ApiConfigInsert = {
        owner_id: null, // Global API
        name: formData.name,
        provider: formData.provider,
        description: formData.description || null,
        endpoint: formData.endpoint,
        api_key: formData.api_key,
        model_id: formData.model_id || null,
        model_info: modelInfo,
        access_level: formData.access_level,
        allowed_users: formData.allowed_users,
        is_active: formData.is_active,
      };

      const created = await createApiConfig(newApi);
      if (created) {
        setApis((prev) => [created, ...prev]);
        toast.success('API created successfully');
      } else {
        toast.error('Failed to create API');
      }
    }

    setIsSaving(false);
    setIsDialogOpen(false);
    setShowApiKey(false);
  };

  const confirmDelete = (api: ApiConfig) => {
    setApiToDelete(api);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteApi = async () => {
    if (!apiToDelete) return;

    const success = await deleteApiConfig(apiToDelete.id);
    if (success) {
      setApis((prev) => prev.filter((a) => a.id !== apiToDelete.id));
      toast.success('API deleted');
    } else {
      toast.error('Failed to delete API');
    }
    setIsDeleteDialogOpen(false);
    setApiToDelete(null);
  };

  const openEditDialog = (api: ApiConfig) => {
    setEditingApi(api);
    setFormData({
      name: api.name,
      provider: api.provider,
      description: api.description || '',
      endpoint: api.endpoint,
      api_key: '', // Never pre-fill API key
      model_id: api.model_id || '',
      access_level: api.access_level,
      allowed_users: api.allowed_users || [],
      is_active: api.is_active,
      enable_safety_checker: api.model_info?.enableSafetyChecker ?? true,
    });
    setShowApiKey(false);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingApi(null);
    setFormData(defaultFormData);
    setShowApiKey(false);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">API Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Manage AI APIs available for image generation and other features.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" /> Add API
        </Button>
      </div>

      <div className="grid gap-3">
        {apis.map((api) => (
          <ApiCard
            key={api.id}
            api={api}
            onEdit={openEditDialog}
            onDelete={confirmDelete}
          />
        ))}
      </div>

      {apis.length === 0 && (
        <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground">
          <Server className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No APIs configured yet.</p>
          <p className="text-sm">Add an API to enable image generation.</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingApi ? 'Edit API' : 'Add API'}</DialogTitle>
            <DialogDescription>
              Configure an AI API for use in the creation studio.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-name">Name</Label>
                <Input
                  id="api-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Gemini 3 Pro Image…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(v) =>
                    setFormData({ ...formData, provider: v })
                  }
                >
                  <SelectTrigger id="api-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_PROVIDERS.map((provider) => {
                      const Icon = providerIcons[provider.id] || Settings;
                      return (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {provider.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-description">Description</Label>
              <Textarea
                id="api-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description of this API…"
                rows={2}
              />
            </div>

            {/* API Configuration */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                API Configuration
              </h4>

              <div className="space-y-2">
                <Label htmlFor="api-endpoint">Endpoint URL</Label>
                <Input
                  id="api-endpoint"
                  value={formData.endpoint}
                  onChange={(e) =>
                    setFormData({ ...formData, endpoint: e.target.value })
                  }
                  placeholder="https://api.example.com/v1/generate…"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">
                  API Key {editingApi && '(leave blank to keep current)'}
                </Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.api_key}
                    onChange={(e) =>
                      setFormData({ ...formData, api_key: e.target.value })
                    }
                    placeholder={editingApi ? '••••••••••••••••' : 'Enter API key…'}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                    aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  API keys are encrypted at rest and never exposed to the frontend.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-model">Model ID</Label>
                <Input
                  id="api-model"
                  value={formData.model_id}
                  onChange={(e) =>
                    setFormData({ ...formData, model_id: e.target.value })
                  }
                  placeholder="e.g. gemini-3-pro-image…"
                />
              </div>

              {/* Safety Checker (fal.ai only) */}
              {formData.provider === 'fal' && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Safety Checker</Label>
                    <p className="text-xs text-muted-foreground">
                      Filter unsafe or inappropriate content (fal.ai)
                    </p>
                  </div>
                  <Switch
                    checked={formData.enable_safety_checker}
                    onCheckedChange={(c) =>
                      setFormData({ ...formData, enable_safety_checker: c })
                    }
                  />
                </div>
              )}
            </div>

            {/* Access Control */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Access Control
              </h4>

              <RadioGroup
                value={formData.access_level}
                onValueChange={(v) =>
                  setFormData({ ...formData, access_level: v as ApiAccessLevel })
                }
                className="space-y-3"
              >
                {API_ACCESS_LEVELS.map((level) => {
                  const Icon = accessLevelIcons[level.value];
                  const isSelected = formData.access_level === level.value;

                  return (
                    <div key={level.value}>
                      <RadioGroupItem
                        value={level.value}
                        id={`access-${level.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`access-${level.value}`}
                        className={cn(
                          'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          'hover:bg-muted/50',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{level.label}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {level.description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              {/* Allowed Users (for restricted access) */}
              {formData.access_level === 'restricted' && (
                <div className="mt-4 p-4 rounded-xl border bg-muted/20">
                  <AllowedViewers
                    currentAllowedIds={formData.allowed_users}
                    onChange={(ids) =>
                      setFormData({ ...formData, allowed_users: ids })
                    }
                  />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Enable or disable this API for use
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(c) =>
                  setFormData({ ...formData, is_active: c })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApi} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingApi ? 'Save Changes' : 'Create API'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete API</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">
                {apiToDelete?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteApi}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
