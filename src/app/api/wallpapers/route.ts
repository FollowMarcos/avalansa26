import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getPublicWallpapers, createWallpaper } from '@/utils/supabase/wallpapers';
import { slugify } from '@/utils/wallpaper-validation';
import type { WallpaperBrowseFilters, WallpaperInsert, ResolutionFilter, WallpaperSortOption } from '@/types/wallpaper';
import { z } from 'zod/v4';

const createWallpaperSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  image_url: z.string().url(),
  image_path: z.string().min(1),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  file_size: z.number().int().min(1),
  mime_type: z.string().min(1),
  aspect_ratio: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  collection_id: z.string().uuid().optional(),
  is_public: z.boolean().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const filters: WallpaperBrowseFilters = {
    page: parseInt(searchParams.get('page') ?? '1', 10),
    limit: parseInt(searchParams.get('limit') ?? '20', 10),
    tag: searchParams.get('tag') ?? undefined,
    collection: searchParams.get('collection') ?? undefined,
    resolution: (searchParams.get('resolution') as ResolutionFilter) ?? undefined,
    sort: (searchParams.get('sort') as WallpaperSortOption) ?? undefined,
    search: searchParams.get('search') ?? undefined,
    userId: searchParams.get('user') ?? undefined,
  };

  const result = await getPublicWallpapers(filters);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createWallpaperSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { tags, collection_id, ...wallpaperData } = parsed.data;

    // Generate slug from title
    let slug = slugify(wallpaperData.title);
    if (!slug) slug = `wallpaper-${Date.now()}`;

    // Check for slug uniqueness per user and append suffix if needed
    const { data: existing } = await supabase
      .from('wallpapers')
      .select('id')
      .eq('user_id', user.id)
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const insertData: WallpaperInsert = {
      ...wallpaperData,
      user_id: user.id,
      slug,
    };

    const wallpaper = await createWallpaper(insertData, tags ?? []);

    if (!wallpaper) {
      return NextResponse.json(
        { error: 'Failed to create wallpaper' },
        { status: 500 }
      );
    }

    // Add to collection if specified
    if (collection_id) {
      await supabase
        .from('wallpaper_collection_items')
        .insert({ wallpaper_id: wallpaper.id, collection_id });
    }

    return NextResponse.json({ wallpaper }, { status: 201 });
  } catch (error) {
    console.error('Wallpaper create error:', error);
    return NextResponse.json(
      { error: 'Failed to create wallpaper' },
      { status: 500 }
    );
  }
}
