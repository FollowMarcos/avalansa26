'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  createChannel,
  updateChannel,
  deleteChannel,
} from '@/utils/supabase/chat-channels.server';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Hash,
  Lock,
  Globe,
  Users,
  Pencil,
  Trash2,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ChatChannel, ChannelAccessLevel } from '@/types/chat';
import { CHANNEL_ACCESS_LEVELS } from '@/types/chat';

interface ChannelManagerProps {
  initialChannels: ChatChannel[];
}

export function ChannelManager({ initialChannels }: ChannelManagerProps) {
  const [channels, setChannels] = useState(initialChannels);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChatChannel | null>(
    null
  );
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(
    null
  );

  const handleCreate = async (data: ChannelFormData) => {
    const channel = await createChannel({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      topic: data.topic || null,
      access_level: data.accessLevel,
      icon: data.icon || null,
      color: data.color || null,
    });

    if (channel) {
      setChannels((prev) => [channel, ...prev]);
      setIsCreateOpen(false);
      toast.success(`Channel #${channel.name} created`);
    } else {
      toast.error('Failed to create channel');
    }
  };

  const handleUpdate = async (id: string, data: ChannelFormData) => {
    const channel = await updateChannel(id, {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      topic: data.topic || null,
      access_level: data.accessLevel,
      icon: data.icon || null,
      color: data.color || null,
    });

    if (channel) {
      setChannels((prev) =>
        prev.map((c) => (c.id === id ? channel : c))
      );
      setEditingChannel(null);
      toast.success(`Channel #${channel.name} updated`);
    } else {
      toast.error('Failed to update channel');
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteChannel(id);
    if (success) {
      setChannels((prev) => prev.filter((c) => c.id !== id));
      setDeletingChannelId(null);
      toast.success('Channel deleted');
    } else {
      toast.error('Failed to delete channel');
    }
  };

  const handleToggleArchive = async (channel: ChatChannel) => {
    const updated = await updateChannel(channel.id, {
      is_archived: !channel.is_archived,
    });

    if (updated) {
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? updated : c))
      );
      toast.success(
        updated.is_archived ? 'Channel archived' : 'Channel unarchived'
      );
    }
  };

  const activeChannels = channels.filter((c) => !c.is_archived);
  const archivedChannels = channels.filter((c) => c.is_archived);

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {channels.length} channel{channels.length !== 1 ? 's' : ''} total
        </p>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Channel</DialogTitle>
              <DialogDescription>
                Create a new chat channel. You control who can access it.
              </DialogDescription>
            </DialogHeader>
            <ChannelForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Active channels */}
      <div className="space-y-3">
        {activeChannels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            onEdit={() => setEditingChannel(channel)}
            onDelete={() => setDeletingChannelId(channel.id)}
            onToggleArchive={() => handleToggleArchive(channel)}
          />
        ))}
        {activeChannels.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No active channels. Create one to get started.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Archived channels */}
      {archivedChannels.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archived ({archivedChannels.length})
          </h3>
          {archivedChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onEdit={() => setEditingChannel(channel)}
              onDelete={() => setDeletingChannelId(channel.id)}
              onToggleArchive={() => handleToggleArchive(channel)}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={!!editingChannel}
        onOpenChange={(open) => !open && setEditingChannel(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
            <DialogDescription>
              Update channel settings and access control.
            </DialogDescription>
          </DialogHeader>
          {editingChannel && (
            <ChannelForm
              initialData={editingChannel}
              onSubmit={(data) => handleUpdate(editingChannel.id, data)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingChannelId}
        onOpenChange={(open) => !open && setDeletingChannelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the channel and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deletingChannelId && handleDelete(deletingChannelId)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// Channel Card
// ============================================

function ChannelCard({
  channel,
  onEdit,
  onDelete,
  onToggleArchive,
}: {
  channel: ChatChannel;
  onEdit: () => void;
  onDelete: () => void;
  onToggleArchive: () => void;
}) {
  const accessIcon =
    channel.access_level === 'restricted' ? (
      <Lock className="h-3.5 w-3.5" />
    ) : channel.access_level === 'public' ? (
      <Globe className="h-3.5 w-3.5" />
    ) : (
      <Users className="h-3.5 w-3.5" />
    );

  return (
    <Card className={cn(channel.is_archived && 'opacity-60')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{channel.name}</CardTitle>
            <Badge variant="outline" className="gap-1 text-xs">
              {accessIcon}
              {channel.access_level}
            </Badge>
            {!channel.is_active && (
              <Badge variant="destructive" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
              aria-label="Edit channel"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleArchive}
              aria-label={
                channel.is_archived ? 'Unarchive channel' : 'Archive channel'
              }
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete channel"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {channel.description && (
          <CardDescription>{channel.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>slug: {channel.slug}</span>
          {channel.topic && <span>topic: {channel.topic}</span>}
          {channel.access_level === 'restricted' && (
            <span>
              {channel.allowed_users.length} allowed user
              {channel.allowed_users.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Channel Form
// ============================================

interface ChannelFormData {
  name: string;
  slug: string;
  description: string;
  topic: string;
  accessLevel: ChannelAccessLevel;
  icon: string;
  color: string;
}

function ChannelForm({
  initialData,
  onSubmit,
}: {
  initialData?: ChatChannel;
  onSubmit: (data: ChannelFormData) => void;
}) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? ''
  );
  const [topic, setTopic] = useState(initialData?.topic ?? '');
  const [accessLevel, setAccessLevel] = useState<ChannelAccessLevel>(
    initialData?.access_level ?? 'authenticated'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!initialData) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 50)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) return;

    setIsSubmitting(true);
    await onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      topic: topic.trim(),
      accessLevel,
      icon: '',
      color: '',
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="channel-name">Name</Label>
        <Input
          id="channel-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="general"
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel-slug">Slug</Label>
        <Input
          id="channel-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="general"
          pattern="^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$"
          maxLength={50}
          required
        />
        <p className="text-xs text-muted-foreground">
          URL-safe identifier. Lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel-description">Description</Label>
        <Input
          id="channel-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this channel about?"
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel-topic">Topic</Label>
        <Input
          id="channel-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Current discussion topic"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel-access">Access Level</Label>
        <Select
          value={accessLevel}
          onValueChange={(v) => setAccessLevel(v as ChannelAccessLevel)}
        >
          <SelectTrigger id="channel-access">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHANNEL_ACCESS_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{level.label}</span>
                  <span className="text-muted-foreground text-xs">
                    — {level.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting || !name.trim() || !slug.trim()}>
          {isSubmitting
            ? 'Saving...'
            : initialData
              ? 'Update Channel'
              : 'Create Channel'}
        </Button>
      </DialogFooter>
    </form>
  );
}
