import { supabase } from '@/lib/supabaseClient';
import type { KemixResource } from '@/types/kemixResource';

export async function fetchPublishedKemixResources(): Promise<KemixResource[]> {
  const { data, error } = await supabase.rpc('list_published_resources', { p_limit: 100 });
  if (error) throw new Error(error.message || '자료를 불러오지 못했습니다.');
  return (data ?? []) as KemixResource[];
}

export async function adminListKemixResources(): Promise<KemixResource[]> {
  const { data, error } = await supabase.rpc('admin_list_resources');
  if (error) throw new Error(parseResourceServiceError(error.message));
  return (data ?? []) as KemixResource[];
}

export async function adminDeleteKemixResource(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_resource', { p_id: id });
  if (error) throw new Error(parseResourceServiceError(error.message));
}

export async function adminSetKemixResourcePublished(
  resource: KemixResource,
  isPublished: boolean,
): Promise<KemixResource> {
  const { data, error } = await supabase.rpc('admin_upsert_resource', {
    p_id: resource.id,
    p_title: resource.title,
    p_description: resource.description,
    p_category: resource.category,
    p_file_url: resource.file_url,
    p_file_name: resource.file_name,
    p_file_size: resource.file_size,
    p_display_order: resource.display_order,
    p_is_published: isPublished,
  });
  if (error) throw new Error(parseResourceServiceError(error.message));
  if (!data) throw new Error('자료 공개 상태를 변경하지 못했습니다.');
  return data as KemixResource;
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

function parseResourceServiceError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('not authorized') || lower.includes('not_authorized')) {
    return 'DB 관리자 승인 계정만 자료를 등록할 수 있습니다.';
  }
  if (lower.includes('title is required')) {
    return '제목을 입력해 주세요.';
  }
  if (lower.includes('file_url is required')) {
    return '파일 URL을 입력해 주세요.';
  }
  if (lower.includes('resource not found')) {
    return '자료를 찾을 수 없습니다.';
  }
  return message || '자료 등록에 실패했습니다.';
}

export type UpsertKemixResourceInput = {
  title: string;
  description?: string;
  category?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  isPublished?: boolean;
};

export async function adminUpsertKemixResource(
  input: UpsertKemixResourceInput,
): Promise<KemixResource> {
  const { data, error } = await supabase.rpc('admin_upsert_resource', {
    p_title: input.title.trim(),
    p_description: input.description?.trim() ?? '',
    p_category: input.category?.trim() || 'general',
    p_file_url: input.fileUrl.trim(),
    p_file_name: input.fileName.trim(),
    p_file_size: input.fileSize ?? null,
    p_is_published: input.isPublished ?? true,
  });
  if (error) throw new Error(parseResourceServiceError(error.message));
  if (!data) throw new Error('자료가 저장되지 않았습니다. 잠시 후 다시 시도해 주세요.');
  return data as KemixResource;
}
