import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  getUserWallpaperCollections,
  createWallpaperCollection,
} from '@/utils/supabase/wallpapers';
import { slugify } from '@/utils/wallpaper-validation';
import { z } from 'zod/v4';

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_public: z.boolean().optional(),
});

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collections = await getUserWallpaperCollections(user.id);
  return NextResponse.json({ collections });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCollectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    let slug = slugify(parsed.data.name);
    if (!slug) slug = `collection-${Date.now()}`;

    const collection = await createWallpaperCollection({
      user_id: user.id,
      slug,
      ...parsed.data,
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Failed to create collection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error('Collection create error:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}
