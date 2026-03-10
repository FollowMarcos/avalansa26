import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getWallpaperById, updateWallpaper, deleteWallpaper } from '@/utils/supabase/wallpapers';
import { z } from 'zod/v4';

// View count debouncing: 1 view per IP+wallpaper per 60 seconds
const viewTracker = new Map<string, number>();
const VIEW_WINDOW_MS = 60_000;
const MAX_VIEW_ENTRIES = 10_000;

function shouldCountView(ip: string, wallpaperId: string): boolean {
  const key = `${ip}:${wallpaperId}`;
  const now = Date.now();
  const lastView = viewTracker.get(key);

  if (lastView && now - lastView < VIEW_WINDOW_MS) {
    return false;
  }

  viewTracker.set(key, now);

  // Cleanup old entries
  if (viewTracker.size > MAX_VIEW_ENTRIES) {
    const entries = Array.from(viewTracker.entries());
    entries.sort((a, b) => b[1] - a[1]);
    viewTracker.clear();
    for (const [k, v] of entries.slice(0, MAX_VIEW_ENTRIES / 2)) {
      viewTracker.set(k, v);
    }
  }

  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const wallpaper = await getWallpaperById(id);

  if (!wallpaper) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Increment view count (debounced)
  const ip = request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown';

  if (shouldCountView(ip, id)) {
    const supabase = await createClient();
    await supabase.rpc('increment_wallpaper_view', { wallpaper_uuid: id });
  }

  return NextResponse.json({ wallpaper });
}

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  is_public: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const { data: existing } = await supabase
      .from('wallpapers')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const wallpaper = await updateWallpaper(id, parsed.data);

    if (!wallpaper) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ wallpaper });
  } catch (error) {
    console.error('Wallpaper update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const { data: existing } = await supabase
      .from('wallpapers')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const deleted = await deleteWallpaper(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wallpaper delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
