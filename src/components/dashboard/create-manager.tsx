'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Loader2,
  AlertTriangle,
  Image,
  Square,
  Maximize2,
  Zap,
  Clock,
  Save,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import type {
  CreateSettings,
  CreateSettingsUpdate,
  ImageSize,
  AspectRatio,
} from '@/types/create-settings';
import { ALL_IMAGE_SIZES, ALL_ASPECT_RATIOS } from '@/types/create-settings';
import {
  getCreateSettings,
  updateCreateSettings,
} from '@/utils/supabase/create-settings.server';

// Aspect ratio visual component
function AspectRatioVisual({ ratio }: { ratio: string }) {
  const [w, h] = ratio.split(':').map(Number);
  const maxSize = 24;
  const dims =
    w > h
      ? { width: maxSize, height: Math.round((h / w) * maxSize) }
      : w < h
        ? { width: Math.round((w / h) * maxSize), height: maxSize }
        : { width: maxSize, height: maxSize };

  return (
    <div
      className="border-2 border-current rounded-sm"
      style={{ width: dims.width, height: dims.height }}
    />
  );
}

export function CreateManager() {
  const [settings, setSettings] = useState<CreateSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state (local copy for editing)
  const [formData, setFormData] = useState<CreateSettingsUpdate>({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    const data = await getCreateSettings();
    setSettings(data);
    if (data) {
      setFormData({
        allowed_image_sizes: data.allowed_image_sizes,
        max_output_count: data.max_output_count,
        allowed_aspect_ratios: data.allowed_aspect_ratios,
        maintenance_mode: data.maintenance_mode,
        maintenance_message: data.maintenance_message,
        allow_fast_mode: data.allow_fast_mode,
        allow_relaxed_mode: data.allow_relaxed_mode,
      });
    }
    setIsLoading(false);
  }

  const handleSave = async () => {
    setIsSaving(true);
    const updated = await updateCreateSettings(formData);
    if (updated) {
      setSettings(updated);
      setHasChanges(false);
      toast.success('Create settings saved');
    } else {
      toast.error('Failed to save settings');
    }
    setIsSaving(false);
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        allowed_image_sizes: settings.allowed_image_sizes,
        max_output_count: settings.max_output_count,
        allowed_aspect_ratios: settings.allowed_aspect_ratios,
        maintenance_mode: settings.maintenance_mode,
        maintenance_message: settings.maintenance_message,
        allow_fast_mode: settings.allow_fast_mode,
        allow_relaxed_mode: settings.allow_relaxed_mode,
      });
      setHasChanges(false);
    }
  };

  const updateFormData = (updates: Partial<CreateSettingsUpdate>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Toggle functions for arrays
  const toggleImageSize = (size: ImageSize) => {
    const current = formData.allowed_image_sizes || [];
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    // Ensure at least one is selected
    if (updated.length >= 1) {
      updateFormData({ allowed_image_sizes: updated as ImageSize[] });
    }
  };

  const toggleAspectRatio = (ratio: AspectRatio) => {
    const current = formData.allowed_aspect_ratios || [];
    const updated = current.includes(ratio)
      ? current.filter((r) => r !== ratio)
      : [...current, ratio];
    // Ensure at least one is selected
    if (updated.length >= 1) {
      updateFormData({ allowed_aspect_ratios: updated as AspectRatio[] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Failed to load settings.</p>
        <Button onClick={loadSettings} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Create Feature Settings</h3>
          <p className="text-sm text-muted-foreground">
            Control image generation options and maintenance mode.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Alert (if active) */}
      {formData.maintenance_mode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Maintenance Mode Active</AlertTitle>
          <AlertDescription>
            The create feature is currently disabled for all users.
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Maintenance Mode Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Maintenance Mode
            </CardTitle>
            <CardDescription>
              Temporarily disable the create feature for all users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-mode">Enable Maintenance Mode</Label>
              <Switch
                id="maintenance-mode"
                checked={formData.maintenance_mode}
                onCheckedChange={(checked) =>
                  updateFormData({ maintenance_mode: checked })
                }
              />
            </div>
            {formData.maintenance_mode && (
              <div className="space-y-2">
                <Label htmlFor="maintenance-message">Maintenance Message</Label>
                <Textarea
                  id="maintenance-message"
                  value={formData.maintenance_message || ''}
                  onChange={(e) =>
                    updateFormData({ maintenance_message: e.target.value })
                  }
                  placeholder="We're performing scheduled maintenance. Please check back later."
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Count Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Output Limits
            </CardTitle>
            <CardDescription>
              Control maximum images per generation batch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Max Images Per Batch</Label>
                <Badge variant="outline" className="font-mono">
                  {formData.max_output_count}
                </Badge>
              </div>
              <Slider
                value={[formData.max_output_count || 4]}
                onValueChange={([value]) =>
                  updateFormData({ max_output_count: value })
                }
                min={1}
                max={4}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>4</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Options Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Maximize2 className="w-5 h-5" />
              Quality Options
            </CardTitle>
            <CardDescription>
              Enable or disable image quality/size options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              role="group"
              aria-label="Quality options"
              className="flex flex-wrap gap-2"
            >
              {ALL_IMAGE_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleImageSize(size)}
                  aria-label={`${size} quality`}
                  aria-pressed={formData.allowed_image_sizes?.includes(size)}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 transition-all font-medium',
                    formData.allowed_image_sizes?.includes(size)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-muted-foreground'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              At least one quality option must be enabled.
            </p>
          </CardContent>
        </Card>

        {/* Generation Speed Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Generation Speed
            </CardTitle>
            <CardDescription>
              Control available generation speed modes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="font-medium">Fast Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Immediate generation
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.allow_fast_mode}
                onCheckedChange={(checked) =>
                  updateFormData({ allow_fast_mode: checked })
                }
                disabled={
                  !formData.allow_relaxed_mode && formData.allow_fast_mode
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-medium">Relaxed/Batch Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Queue-based generation
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.allow_relaxed_mode}
                onCheckedChange={(checked) =>
                  updateFormData({ allow_relaxed_mode: checked })
                }
                disabled={
                  !formData.allow_fast_mode && formData.allow_relaxed_mode
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Aspect Ratios Card (full width) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Square className="w-5 h-5" />
              Aspect Ratios
            </CardTitle>
            <CardDescription>
              Enable or disable specific aspect ratio options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              role="group"
              aria-label="Aspect ratio options"
              className="grid grid-cols-5 gap-2"
            >
              {ALL_ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => toggleAspectRatio(ratio)}
                  aria-label={`${ratio} aspect ratio`}
                  aria-pressed={formData.allowed_aspect_ratios?.includes(ratio)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                    formData.allowed_aspect_ratios?.includes(ratio)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <AspectRatioVisual ratio={ratio} />
                  <span
                    className={cn(
                      'text-xs font-mono',
                      formData.allowed_aspect_ratios?.includes(ratio)
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    )}
                  >
                    {ratio}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              At least one aspect ratio must be enabled.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
