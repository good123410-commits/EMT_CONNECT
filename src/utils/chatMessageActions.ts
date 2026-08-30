import * as Clipboard from 'expo-clipboard';
import { Alert, Platform, Share } from 'react-native';
import type { ChatContextMenuMessage } from '@/types/chatReactions';

const SHORTCODE_BLOCK_RE = /:::[\s\S]*?:::/g;

export function showChatAlert(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function resolveChatMessageAuthorId(
  message: ChatContextMenuMessage,
  items: ReadonlyArray<{ id: string; authorId?: string | null }>,
): string | null | undefined {
  if (message.authorId) return message.authorId;
  return items.find((item) => item.id === message.id)?.authorId;
}

export function stripChatContentForCopy(content: string): string {
  return content.replace(SHORTCODE_BLOCK_RE, '').replace(/\s+/g, ' ').trim();
}

export function buildChatReplyQuote(content: string, anonymousLabel: string): string {
  const plain = stripChatContentForCopy(content);
  const lines = plain.split('\n').map((line) => line.trim()).filter(Boolean);
  const preview = lines.slice(0, 3).join('\n');
  return `> ${anonymousLabel}: ${preview}`;
}

export function buildChatReplyDraft(content: string, anonymousLabel: string): string {
  return `${buildChatReplyQuote(content, anonymousLabel)}\n\n`;
}

export async function copyChatMessageContent(content: string): Promise<void> {
  const plain = stripChatContentForCopy(content);
  if (!plain) {
    Alert.alert('복사할 내용 없음', '복사할 텍스트가 없습니다.');
    return;
  }
  await Clipboard.setStringAsync(plain);
  Alert.alert('복사 완료', '메시지가 클립보드에 복사되었습니다.');
}

export async function shareChatMessageContent(content: string, anonymousLabel: string): Promise<void> {
  const plain = stripChatContentForCopy(content);
  if (!plain) {
    Alert.alert('공유할 내용 없음', '공유할 텍스트가 없습니다.');
    return;
  }
  await Share.share({
    message: `${anonymousLabel}: ${plain}`,
  });
}
