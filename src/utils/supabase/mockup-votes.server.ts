'use server';

import { createClient } from '@/utils/supabase/server';
import type { MockupVote, MockupVoteInsert, VoteType } from '@/types/mockup-vote';

/**
 * Get user's vote for a specific mockup
 */
export async function getMockupVote(mockupId: string): Promise<MockupVote | null> {
  const supabase = await createClient();

  const { data: vote, error } = await supabase
    .from('mockup_votes')
    .select('*')
    .eq('mockup_id', mockupId)
    .single();

  if (error) {
    // No vote found is expected
    return null;
  }

  return vote;
}

/**
 * Get all user's votes
 */
export async function getUserMockupVotes(): Promise<MockupVote[]> {
  const supabase = await createClient();

  const { data: votes, error } = await supabase
    .from('mockup_votes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching mockup votes:', error.message);
    return [];
  }

  return votes ?? [];
}

/**
 * Vote on a mockup (like/dislike with optional feedback)
 */
export async function voteMockup(
  mockupId: string,
  voteType: VoteType,
  feedback?: string
): Promise<MockupVote | null> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Upsert the vote
  const { data: vote, error } = await supabase
    .from('mockup_votes')
    .upsert(
      {
        user_id: user.id,
        mockup_id: mockupId,
        vote_type: voteType,
        feedback: feedback || null,
      },
      { onConflict: 'user_id,mockup_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error voting on mockup:', error.message);
    return null;
  }

  return vote;
}

/**
 * Remove vote from a mockup
 */
export async function removeVote(mockupId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('mockup_votes')
    .delete()
    .eq('mockup_id', mockupId);

  if (error) {
    console.error('Error removing vote:', error.message);
    return false;
  }

  return true;
}

/**
 * Update feedback on an existing vote
 */
export async function updateVoteFeedback(
  mockupId: string,
  feedback: string
): Promise<MockupVote | null> {
  const supabase = await createClient();

  const { data: vote, error } = await supabase
    .from('mockup_votes')
    .update({ feedback })
    .eq('mockup_id', mockupId)
    .select()
    .single();

  if (error) {
    console.error('Error updating feedback:', error.message);
    return null;
  }

  return vote;
}
