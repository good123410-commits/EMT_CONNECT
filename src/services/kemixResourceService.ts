import { supabase } from '@/lib/supabaseClient';
import type { KemixResource } from '@/types/kemixResource';

export async function fetchPublishedKemixResources(): Promise<KemixResource[]> {
  const { data, error } = await supabase.rpc('list_published_resources', { p_limit: 100 });
  if (error) throw new Error(error.message || '자료를 불러오지 못했습니다.');
  return (data ?? []) as KemixResource[];
}

export async function fetchPublishedKemixResource(id: string): Promise<KemixResource> {
  const { data, error } = await supabase.rpc('get_published_resource', { p_id: id });
  if (error) throw new Error(error.message || '자료를 불러오지 못했습니다.');
  return data as KemixResource;
}

export function subscribeKemixResources(onChange: () => void): () => void {
  const channel = supabase
    .channel('kemix_resources_mobile')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kemix_resources' }, () =>
      onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export function formatResourceFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
