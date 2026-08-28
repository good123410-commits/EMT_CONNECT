import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';

const STORAGE_KEY = 'ems_connect_chat_participation_v1';
const MAX_STORED_ROOMS = 80;

type ParticipationStore = {
  ems: string[];
  local: string[];
};

async function readStore(): Promise<ParticipationStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ems: [], local: [] };
    const parsed = JSON.parse(raw) as Partial<ParticipationStore>;
    return {
      ems: Array.isArray(parsed.ems) ? parsed.ems.filter(Boolean) : [],
      local: Array.isArray(parsed.local) ? parsed.local.filter(Boolean) : [],
    };
  } catch {
    return { ems: [], local: [] };
  }
}

async function writeStore(store: ParticipationStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function trimIds(ids: string[]): string[] {
  return [...new Set(ids)].slice(-MAX_STORED_ROOMS);
}

export async function registerEmsChatRoomParticipation(roomId: string): Promise<void> {
  if (!roomId) return;
  const store = await readStore();
  store.ems = trimIds([...store.ems, roomId]);
  await writeStore(store);
}

export async function registerLocalChatRoomParticipation(roomId: string): Promise<void> {
  if (!roomId) return;
  const store = await readStore();
  store.local = trimIds([...store.local, roomId]);
  await writeStore(store);
}

export async function getParticipatedEmsChatRoomIds(): Promise<string[]> {
  const store = await readStore();
  return store.ems;
}

export async function getParticipatedLocalChatRoomIds(): Promise<string[]> {
  const store = await readStore();
  return store.local;
}

/** 서버에 메시지를 남긴 EMS 채팅방 ID 병합 */
export async function syncEmsChatParticipationFromServer(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('ems_community_posts')
    .select('room_id')
    .eq('author_id', userId)
    .eq('post_type', 'chat')
    .not('room_id', 'is', null)
    .limit(200);

  if (error) {
    if (__DEV__) {
      console.warn('[chatParticipation] server sync failed', error.message);
    }
    return getParticipatedEmsChatRoomIds();
  }

  const remoteIds = (data ?? [])
    .map((row) => String(row.room_id ?? ''))
    .filter(Boolean);

  const store = await readStore();
  store.ems = trimIds([...store.ems, ...remoteIds]);
  await writeStore(store);
  return store.ems;
}
