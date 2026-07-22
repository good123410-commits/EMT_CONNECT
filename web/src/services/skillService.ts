import { supabase } from '../lib/supabase';
import type { SkillNode } from './adminService';

export async function fetchPublishedSkillNodes(): Promise<SkillNode[]> {
  try {
    const { data, error } = await supabase.rpc('list_published_skill_nodes');
    if (error) return [];
    return (data ?? []) as SkillNode[];
  } catch {
    return [];
  }
}
