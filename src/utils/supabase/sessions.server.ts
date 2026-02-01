'use server';

import { createClient } from '@/utils/supabase/server';
import type { Session, SessionInsert, SessionUpdate, SessionWithCount } from '@/types/session';
import type { Generation } from '@/types/generation';

// Session inactivity threshold (30 minutes in milliseconds)
const SESSION_GAP_MS = 30 * 60 * 1000;

/**
 * Get or create an active session for the user.
 * - If an active session exists and last generation was < 30min ago, return it
 * - Otherwise, end current session and create a new one
 */
export async function getOrCreateSession(
  canvasId?: string
): Promise<Session | null> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Find the most recent active session (no ended_at)
  const { data: activeSession } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (activeSession) {
    // Check if the last generation in this session was recent enough
    const { data: lastGen } = await supabase
      .from('generations')
      .select('created_at')
      .eq('session_id', activeSession.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastGen) {
      const lastGenTime = new Date(lastGen.created_at).getTime();
      const now = Date.now();

      if (now - lastGenTime < SESSION_GAP_MS) {
        // Session is still active, return it
        return activeSession;
      }
    } else {
      // No generations yet, check if session was started recently
      const sessionStartTime = new Date(activeSession.started_at).getTime();
      if (Date.now() - sessionStartTime < SESSION_GAP_MS) {
        return activeSession;
      }
    }

    // Session is stale, end it
    await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', activeSession.id);
  }

  // Create a new session
  const sessionData: SessionInsert = {
    user_id: user.id,
    canvas_id: canvasId || null,
    started_at: new Date().toISOString(),
  };

  const { data: newSession, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error.message);
    return null;
  }

  return newSession;
}

/**
 * Create an explicit named session (user clicked "New Session")
 */
export async function createNamedSession(
  name: string,
  canvasId?: string
): Promise<Session | null> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // End any active sessions first
  await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('ended_at', null);

  // Create the new named session
  const sessionData: SessionInsert = {
    user_id: user.id,
    canvas_id: canvasId || null,
    name,
    started_at: new Date().toISOString(),
  };

  const { data: session, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) {
    console.error('Error creating named session:', error.message);
    return null;
  }

  return session;
}

/**
 * End a session (sets ended_at)
 */
export async function endSession(sessionId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    console.error('Error ending session:', error.message);
    return false;
  }

  return true;
}

/**
 * Get a single session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error.message);
    return null;
  }

  return session;
}

/**
 * Get user's sessions with generation counts and thumbnails
 */
export async function getUserSessions(
  limit: number = 50
): Promise<SessionWithCount[]> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get sessions ordered by most recent
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error || !sessions) {
    console.error('Error fetching sessions:', error?.message);
    return [];
  }

  // Get generation stats for each session
  const sessionsWithCounts: SessionWithCount[] = await Promise.all(
    sessions.map(async (session) => {
      // Get count and first image
      const { count } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id);

      // Get first image for thumbnail
      const { data: firstGen } = await supabase
        .from('generations')
        .select('image_url, created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      // Get last generation time
      const { data: lastGen } = await supabase
        .from('generations')
        .select('created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...session,
        generation_count: count ?? 0,
        first_image_url: firstGen?.image_url ?? null,
        last_generation_at: lastGen?.created_at ?? null,
      };
    })
  );

  return sessionsWithCounts;
}

/**
 * Rename a session
 */
export async function renameSession(
  sessionId: string,
  name: string
): Promise<Session | null> {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .update({ name })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error renaming session:', error.message);
    return null;
  }

  return session;
}

/**
 * Delete a session and optionally its generations
 */
export async function deleteSession(
  sessionId: string,
  deleteGenerations: boolean = false
): Promise<boolean> {
  const supabase = await createClient();

  if (deleteGenerations) {
    // Delete all generations in this session first
    const { error: genError } = await supabase
      .from('generations')
      .delete()
      .eq('session_id', sessionId);

    if (genError) {
      console.error('Error deleting session generations:', genError.message);
      return false;
    }
  }

  // Delete the session
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error deleting session:', error.message);
    return false;
  }

  return true;
}

/**
 * Get all generations for a session
 */
export async function getSessionGenerations(
  sessionId: string
): Promise<Generation[]> {
  const supabase = await createClient();

  const { data: generations, error } = await supabase
    .from('generations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching session generations:', error.message);
    return [];
  }

  return generations ?? [];
}

/**
 * Backfill sessions for existing generations without session_id.
 * Groups generations by 30-minute gaps and creates sessions.
 */
export async function backfillSessions(): Promise<number> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  // Get all generations without session_id, ordered by created_at
  const { data: generations, error } = await supabase
    .from('generations')
    .select('id, created_at')
    .eq('user_id', user.id)
    .is('session_id', null)
    .order('created_at', { ascending: true });

  if (error || !generations || generations.length === 0) {
    return 0;
  }

  let sessionsCreated = 0;
  let currentSessionId: string | null = null;
  let lastGenTime: number | null = null;

  for (const gen of generations) {
    const genTime = new Date(gen.created_at).getTime();

    // Check if we need a new session (first gen or gap > 30 min)
    if (!currentSessionId || !lastGenTime || genTime - lastGenTime > SESSION_GAP_MS) {
      // Create a new session
      const sessionData: SessionInsert = {
        user_id: user.id,
        started_at: gen.created_at,
      };

      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError || !newSession) {
        console.error('Error creating backfill session:', sessionError?.message);
        continue;
      }

      currentSessionId = newSession.id;
      sessionsCreated++;
    }

    // Assign generation to current session
    await supabase
      .from('generations')
      .update({ session_id: currentSessionId })
      .eq('id', gen.id);

    lastGenTime = genTime;
  }

  // End all backfilled sessions (they're historical)
  if (sessionsCreated > 0) {
    await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('ended_at', null);
  }

  return sessionsCreated;
}

/**
 * Check if backfill is needed (user has generations without sessions)
 */
export async function needsBackfill(): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .is('session_id', null);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}
