import { supabase } from '@/lib/supabaseClient';
import type { ChatMessage } from '@/data/paramedicMockData';
import {
  EmsCommunityServiceError,
  fetchChatMessages,
  mapRowToChat,
  type EmsCommunityPostRow,
} from '@/services/emsCommunityService';

export const EMS_CHAT_ROOMS_TABLE = 'ems_chat_rooms';

export type EmsChatRoom = {
  id: string;
  roomName: string;
  region: string | null;
  category: string | null;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type EmsChatRoomRow = {
  id: string;
  room_name: string;
  region: string | null;
  category: string | null;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type CreateChatRoomInput = {
  roomName: string;
  region?: string;
  category?: string;
  description?: string;
};

function parseChatRoomError(message: string): string {
  if (message.includes('room_not_found')) {
    return '채팅방을 찾을 수 없습니다.';
  }
  if (message.includes('not_authorized_admin')) {
    return '승인된 DB 관리자만 채팅방을 폐쇄할 수 있습니다.';
  }
  if (message.includes('relation') && message.includes('ems_chat_rooms')) {
    return '채팅방 DB가 설치되지 않았습니다. migration_v17_ems_chat_rooms.sql을 실행해 주세요.';
  }
  if (message.includes('room_not_active') || message.includes('is_ems_chat_room_active')) {
    return '폐쇄된 채팅방에는 메시지를 보낼 수 없습니다.';
  }
  return message;
}

export function mapRowToChatRoom(row: EmsChatRoomRow): EmsChatRoom {
  return {
    id: row.id,
    roomName: row.room_name,
    region: row.region,
    category: row.category,
    description: row.description,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  };
}

export async function fetchActiveChatRooms(): Promise<EmsChatRoom[]> {
  const { data, error } = await supabase
    .from(EMS_CHAT_ROOMS_TABLE)
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new EmsCommunityServiceError(parseChatRoomError(error.message));
  }

  return ((data ?? []) as EmsChatRoomRow[]).map(mapRowToChatRoom);
}

export async function fetchAllChatRooms(): Promise<EmsChatRoom[]> {
  const { data, error } = await supabase
    .from(EMS_CHAT_ROOMS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new EmsCommunityServiceError(parseChatRoomError(error.message));
  }

  return ((data ?? []) as EmsChatRoomRow[]).map(mapRowToChatRoom);
}

export async function adminCreateChatRoom(input: CreateChatRoomInput): Promise<EmsChatRoom> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    throw new EmsCommunityServiceError('로그인 후 채팅방을 생성할 수 있습니다.');
  }

  const payload = {
    room_name: input.roomName.trim(),
    region: input.region?.trim() || null,
    category: input.category?.trim() || null,
    description: input.description?.trim() || null,
    is_active: true,
    created_by: auth.user.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(EMS_CHAT_ROOMS_TABLE)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new EmsCommunityServiceError(parseChatRoomError(error.message));
  }

  return mapRowToChatRoom(data as EmsChatRoomRow);
}

export async function adminDeactivateChatRoom(roomId: string): Promise<EmsChatRoom> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('admin_deactivate_ems_chat_room', {
    p_room_id: roomId,
  });

  if (!rpcError && rpcData) {
    if (__DEV__) {
      console.log('[ChatRoom] adminDeactivateChatRoom RPC success', { roomId, rpcData });
    }
    return mapRowToChatRoom(rpcData as EmsChatRoomRow);
  }

  if (rpcError && !rpcError.message.toLowerCase().includes('could not find the function')) {
    console.error('[ChatRoom] adminDeactivateChatRoom RPC failed', {
      roomId,
      message: rpcError.message,
      code: rpcError.code,
      details: rpcError.details,
      hint: rpcError.hint,
    });
    throw new EmsCommunityServiceError(parseChatRoomError(rpcError.message));
  }

  if (__DEV__ && rpcError) {
    console.warn('[ChatRoom] RPC unavailable, falling back to direct update', rpcError.message);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(EMS_CHAT_ROOMS_TABLE)
    .update({
      is_active: false,
      closed_at: now,
      updated_at: now,
    })
    .eq('id', roomId)
    .select('*');

  if (error) {
    console.error('[ChatRoom] adminDeactivateChatRoom update failed', {
      roomId,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new EmsCommunityServiceError(parseChatRoomError(error.message));
  }

  const rows = (data ?? []) as EmsChatRoomRow[];
  if (!rows.length) {
    console.error('[ChatRoom] adminDeactivateChatRoom no rows updated — check RLS/admin role', {
      roomId,
    });
    throw new EmsCommunityServiceError(
      '채팅방을 폐쇄하지 못했습니다. DB 관리자 승인 상태와 migration_v18_admin_deactivate_chat_room.sql 적용 여부를 확인해 주세요.',
    );
  }

  if (__DEV__) {
    console.log('[ChatRoom] adminDeactivateChatRoom direct update success', { roomId });
  }

  return mapRowToChatRoom(rows[0]);
}

export async function fetchChatRoomMessages(roomId: string): Promise<ChatMessage[]> {
  return fetchChatMessages(roomId);
}

export async function adminFetchChatRoomMessages(roomId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('ems_community_posts')
    .select('*')
    .eq('post_type', 'chat')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) {
    throw new EmsCommunityServiceError(parseChatRoomError(error.message));
  }

  return ((data ?? []) as EmsCommunityPostRow[]).map(mapRowToChat);
}
