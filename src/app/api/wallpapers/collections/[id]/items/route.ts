import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { addToCollection, removeFromCollection } from '@/utils/supabase/wallpapers';
import { z } from 'zod/v4';

const itemSchema = z.object({
  wallpaper_id: z.string().uuid(),
});

export async function POST(
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

    // Verify collection ownership
    const { data: collection } = await supabase
      .from('wallpaper_collections')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = itemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const added = await addToCollection(id, parsed.data.wallpaper_id);

    if (!added) {
      return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Add to collection error:', error);
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Verify collection ownership
    const { data: collection } = await supabase
      .from('wallpaper_collections')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = itemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const removed = await removeFromCollection(id, parsed.data.wallpaper_id);

    if (!removed) {
      return NextResponse.json({ error: 'Failed to remove' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove from collection error:', error);
    return NextResponse.json({ error: 'Failed to remove' }, { status: 500 });
  }
}
