import { supabase } from '../lib/supabase';
import type { KemixResource } from '../types';

export async function fetchPublishedResources(): Promise<KemixResource[]> {
  const { data, error } = await supabase.rpc('list_published_resources', { p_limit: 100 });
  if (error) throw error;
  return (data ?? []) as KemixResource[];
}

export async function fetchPublishedResource(id: string): Promise<KemixResource> {
  const { data, error } = await supabase.rpc('get_published_resource', { p_id: id });
  if (error) throw error;
  return data as KemixResource;
}

export async function adminListResources(): Promise<KemixResource[]> {
  const { data, error } = await supabase.rpc('admin_list_resources');
  if (error) throw error;
  return (data ?? []) as KemixResource[];
}

export type UpsertResourceInput = {
  id?: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size?: number | null;
  display_order: number;
  is_published: boolean;
};

export async function adminUpsertResource(input: UpsertResourceInput): Promise<KemixResource> {
  const { data, error } = await supabase.rpc('admin_upsert_resource', {
    p_id: input.id ?? null,
    p_title: input.title,
    p_description: input.description,
    p_category: input.category,
    p_file_url: input.file_url,
    p_file_name: input.file_name,
    p_file_size: input.file_size ?? null,
    p_display_order: input.display_order,
    p_is_published: input.is_published,
  });
  if (error) throw error;
  return data as KemixResource;
}

export async function adminDeleteResource(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_resource', { p_id: id });
  if (error) throw error;
}

export function subscribeResources(onChange: () => void): () => void {
  const channel = supabase
    .channel('kemix_resources_web')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kemix_resources' }, () =>
      onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
