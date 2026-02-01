/**
 * Session Types
 *
 * Sessions group generations into logical work sessions.
 * Sessions are auto-detected via 30-min inactivity gaps,
 * or explicitly created by the user.
 */

export interface Session {
  id: string;
  user_id: string;
  canvas_id: string | null;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface SessionInsert {
  user_id: string;
  canvas_id?: string | null;
  name?: string | null;
  started_at: string;
  ended_at?: string | null;
}

export interface SessionUpdate {
  name?: string | null;
  ended_at?: string | null;
  canvas_id?: string | null;
}

/**
 * Session with computed generation statistics
 */
export interface SessionWithCount extends Session {
  generation_count: number;
  first_image_url: string | null;
  last_generation_at: string | null;
}
