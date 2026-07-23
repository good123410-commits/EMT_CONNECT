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

export function deriveFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split('/').pop() ?? '';
    const decoded = decodeURIComponent(segment);
    const name = decoded.split('?')[0].trim();
    return name.length > 0 ? name : 'download';
  } catch {
    return 'download';
  }
}

export async function adminUpsertResource(input: UpsertResourceInput): Promise<KemixResource> {
  const fileUrl = input.file_url.trim();
  if (!fileUrl) {
    throw new Error('파일을 업로드하거나 파일 URL을 입력해 주세요.');
  }

  const fileName = input.file_name.trim() || deriveFileNameFromUrl(fileUrl);

  const { data, error } = await supabase.rpc('admin_upsert_resource', {
    p_id: input.id ?? null,
    p_title: input.title.trim(),
    p_description: input.description.trim(),
    p_category: input.category,
    p_file_url: fileUrl,
    p_file_name: fileName,
    p_file_size: input.file_size ?? null,
    p_display_order: Number.isFinite(input.display_order) ? input.display_order : 0,
    p_is_published: input.is_published,
  });
  if (error) {
    const raw = error.message ?? '';
    if (raw.includes('file_url is required')) {
      throw new Error('파일을 업로드하거나 파일 URL을 입력해 주세요.');
    }
    if (raw.includes('title is required')) {
      throw new Error('제목을 입력해 주세요.');
    }
    if (raw.includes('not authorized')) {
      throw new Error('관리자 권한이 없습니다.');
    }
    throw error;
  }
  if (!data) {
    throw new Error('자료 저장에 실패했습니다. 관리자 권한과 필수 항목을 확인해 주세요.');
  }
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
