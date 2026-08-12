import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  subscribeLocalCommunityMessages,
  subscribeLocalCommunityRooms,
} from '@/lib/realtimeSubscription';
import { supabase } from '@/lib/supabaseClient';
import type {
  LocalCommunityCategory,
  LocalCommunityMessage,
  LocalCommunityRoom,
} from '@/types/localCommunity';
import { generateAnonymousLabel } from '@/utils/localCommunityModeration';

export const LOCAL_COMMUNITY_ROOMS_TABLE = 'local_community_rooms';
export const LOCAL_COMMUNITY_MESSAGES_TABLE = 'local_community_messages';

const REGION_KEY = 'kemix_local_community_region_v2';
const LEGACY_AREA_KEY = 'kemix_local_community_area_v1';
const MESSAGE_REPORTS_KEY = 'kemix_local_community_message_reports_v1';

export type LocalCommunityRoomRow = {
  id: string;
  region_code: string;
  title: string;
  topic: string | null;
  category: LocalCommunityCategory | null;
  description: string | null;
  creator_label: string;
  message_count: number;
  participant_count: number;
  last_message_preview: string | null;
  last_message_at: string | null;
  created_at: string;
  is_active: boolean;
};

export type LocalCommunityMessageRow = {
  id: string;
  room_id: string;
  content: string;
  anonymous_label: string;
  created_at: string;
  report_count: number;
  is_blinded: boolean;
  author_id: string | null;
};

export class LocalCommunityChatServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalCommunityChatServiceError';
  }
}

function mapRoomRow(row: LocalCommunityRoomRow): LocalCommunityRoom {
  return {
    id: row.id,
    regionCode: row.region_code,
    title: row.title,
    topic: row.topic,
    category: row.category,
    description: row.description,
    creatorLabel: row.creator_label,
    messageCount: row.message_count,
    participantCount: row.participant_count,
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
  };
}

function mapMessageRow(row: LocalCommunityMessageRow): LocalCommunityMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    content: row.content,
    anonymousLabel: row.anonymous_label,
    createdAt: row.created_at,
    reportCount: row.report_count,
    isBlinded: row.is_blinded,
  };
}

function parseServiceError(error: { message?: string; code?: string }): string {
  const message = error.message ?? '요청을 처리하지 못했습니다.';
  if (message.includes('message_not_found_or_hidden')) {
    return '메시지를 찾을 수 없거나 이미 숨김 처리되었습니다.';
  }
  return message;
}

export async function loadSelectedRegionCode(): Promise<string | null> {
  const saved = await AsyncStorage.getItem(REGION_KEY);
  if (saved) return saved;
  return AsyncStorage.getItem(LEGACY_AREA_KEY);
}

export async function saveSelectedRegionCode(regionCode: string): Promise<void> {
  await AsyncStorage.setItem(REGION_KEY, regionCode);
}

async function loadReportedMessageIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(MESSAGE_REPORTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

async function saveReportedMessageId(messageId: string): Promise<void> {
  const set = await loadReportedMessageIds();
  set.add(messageId);
  await AsyncStorage.setItem(MESSAGE_REPORTS_KEY, JSON.stringify([...set]));
}

export async function fetchLocalCommunityRooms(regionCode: string): Promise<LocalCommunityRoom[]> {
  const { data, error } = await supabase
    .from(LOCAL_COMMUNITY_ROOMS_TABLE)
    .select('*')
    .eq('region_code', regionCode)
    .eq('is_active', true)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new LocalCommunityChatServiceError(parseServiceError(error));
  }

  return (data as LocalCommunityRoomRow[]).map(mapRoomRow);
}

export async function fetchLocalCommunityMessages(roomId: string): Promise<LocalCommunityMessage[]> {
  const { data, error } = await supabase
    .from(LOCAL_COMMUNITY_MESSAGES_TABLE)
    .select('*')
    .eq('room_id', roomId)
    .eq('is_blinded', false)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) {
    throw new LocalCommunityChatServiceError(parseServiceError(error));
  }

  return (data as LocalCommunityMessageRow[]).map(mapMessageRow);
}

export async function createLocalCommunityRoom(input: {
  regionCode: string;
  title: string;
  topic?: string;
  category?: LocalCommunityCategory;
  description?: string;
}): Promise<LocalCommunityRoom> {
  const title = input.title.trim();
  if (title.length < 2) {
    throw new LocalCommunityChatServiceError('방 제목을 2자 이상 입력해 주세요.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from(LOCAL_COMMUNITY_ROOMS_TABLE)
    .insert({
      region_code: input.regionCode,
      title,
      topic: input.topic?.trim() || null,
      category: input.category ?? null,
      description: input.description?.trim() || null,
      creator_label: generateAnonymousLabel(),
      created_by: user?.id ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new LocalCommunityChatServiceError(parseServiceError(error ?? { message: 'insert_failed' }));
  }

  return mapRoomRow(data as LocalCommunityRoomRow);
}

export async function sendLocalCommunityMessage(input: {
  roomId: string;
  content: string;
}): Promise<LocalCommunityMessage> {
  const trimmed = input.content.trim();
  if (!trimmed) {
    throw new LocalCommunityChatServiceError('메시지를 입력해 주세요.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from(LOCAL_COMMUNITY_MESSAGES_TABLE)
    .insert({
      room_id: input.roomId,
      content: trimmed,
      anonymous_label: generateAnonymousLabel(),
      author_id: user?.id ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new LocalCommunityChatServiceError(parseServiceError(error ?? { message: 'insert_failed' }));
  }

  return mapMessageRow(data as LocalCommunityMessageRow);
}

export async function reportLocalCommunityMessage(messageId: string): Promise<{
  alreadyReported: boolean;
  blinded: boolean;
}> {
  const reported = await loadReportedMessageIds();
  if (reported.has(messageId)) {
    return { alreadyReported: true, blinded: false };
  }

  const { data, error } = await supabase.rpc('report_local_community_message', {
    p_message_id: messageId,
  });

  if (error) {
    throw new LocalCommunityChatServiceError(parseServiceError(error));
  }

  const payload = data as { blinded?: boolean; is_blinded?: boolean } | null;
  const blinded = Boolean(payload?.blinded ?? payload?.is_blinded);

  await saveReportedMessageId(messageId);

  return { alreadyReported: false, blinded };
}

export function subscribeLocalCommunityRoomList(
  regionCode: string,
  onChange: () => void,
): () => void {
  return subscribeLocalCommunityRooms(regionCode, onChange);
}

export function subscribeLocalCommunityRoomMessages(
  roomId: string,
  onChange: () => void,
): () => void {
  return subscribeLocalCommunityMessages(roomId, onChange);
}

export function formatChatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRoomListTimestamp(iso: string | null): string {
  if (!iso) return '';
  return formatChatTimestamp(iso);
}
