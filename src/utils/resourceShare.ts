import { Platform, Share } from 'react-native';
import { KEMIX_WEB_URL } from '@/constants/env';
import type { KemixResource } from '@/types/kemixResource';

function buildResourcesPageUrl(): string | null {
  const base = KEMIX_WEB_URL.trim().replace(/\/$/, '');
  if (!base) return null;
  return `${base}/download/resources`;
}

export function buildResourceShareMessage(resource: KemixResource): string {
  const description =
    resource.description?.trim() ||
    `${resource.file_name} 자료를 KEMIX 자료실에서 확인하세요.`;
  const lines = [resource.title, description, '', `다운로드: ${resource.file_url}`];
  const pageUrl = buildResourcesPageUrl();
  if (pageUrl) {
    lines.push('', `자료실: ${pageUrl}`);
  }
  return lines.join('\n');
}

/**
 * 카카오톡·메시지 등 공유 시트로 자료 링크 전달.
 * (웹의 Kakao JS SDK feed 템플릿과 동일 정보를 텍스트+URL로 공유)
 */
export async function shareResourceOnKakao(resource: KemixResource): Promise<void> {
  const message = buildResourceShareMessage(resource);
  const pageUrl = buildResourcesPageUrl();

  const result = await Share.share(
    Platform.OS === 'ios'
      ? {
          message,
          url: resource.file_url,
          title: resource.title,
        }
      : {
          message,
          title: resource.title,
        },
    {
      dialogTitle: '카카오톡으로 공유',
      subject: resource.title,
      ...(pageUrl ? { excludedActivityTypes: [] } : {}),
    },
  );

  if (result.action === Share.dismissedAction) {
    return;
  }
}
