'use server';

import { createClient } from './server';
import type { Workflow, WorkflowInsert, WorkflowUpdate } from '@/types/workflow';

/**
 * Create a new workflow
 */
export async function createWorkflow(
  data: WorkflowInsert,
): Promise<Workflow> {
  const supabase = await createClient();
  const { data: workflow, error } = await supabase
    .from('workflows')
    .insert({
      user_id: data.user_id,
      name: data.name || 'Untitled Workflow',
      description: data.description ?? null,
      definition: data.definition,
      thumbnail_url: data.thumbnail_url ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create workflow:', error);
    throw new Error(error.message);
  }

  return workflow as Workflow;
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflow(id: string): Promise<Workflow | null> {
  const supabase = await createClient();
  const { data: workflow, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to get workflow:', error);
    throw new Error(error.message);
  }

  return workflow as Workflow;
}

/**
 * Get all workflows for the current user
 */
export async function getUserWorkflows(): Promise<Workflow[]> {
  const supabase = await createClient();
  const { data: workflows, error } = await supabase
    .from('workflows')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to get user workflows:', error);
    // Don't throw for listing — just return empty array on failure
    return [];
  }

  return (workflows ?? []) as Workflow[];
}

/**
 * Update an existing workflow
 */
export async function updateWorkflow(
  id: string,
  updates: WorkflowUpdate,
): Promise<Workflow> {
  const supabase = await createClient();
  const { data: workflow, error } = await supabase
    .from('workflows')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update workflow:', error);
    throw new Error(error.message);
  }

  return workflow as Workflow;
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete workflow:', error);
    throw new Error(error.message);
  }

  return true;
}
