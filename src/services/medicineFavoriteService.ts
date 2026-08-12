import { supabase } from '@/lib/supabaseClient';

export const USER_FAVORITES_TABLE = 'user_favorites';

export type MedicineFavorite = {
  id: string;
  itemSeq: string;
  itemName: string;
  createdAt: string;
};

type MedicineFavoriteRow = {
  id: string;
  user_id: string;
  item_seq: string;
  item_name: string;
  created_at: string;
};

function mapRow(row: MedicineFavoriteRow): MedicineFavorite {
  return {
    id: row.id,
    itemSeq: row.item_seq,
    itemName: row.item_name,
    createdAt: row.created_at,
  };
}

function parseFavoriteError(message: string): string {
  if (message.includes('relation') && message.includes('user_favorites')) {
    return '즐겨찾기 DB가 설치되지 않았습니다. migration_v62_user_medicine_favorites.sql을 실행해 주세요.';
  }
  if (message.includes('JWT') || message.includes('not authenticated')) {
    return '로그인 후 즐겨찾기를 이용할 수 있습니다.';
  }
  return message;
}

export class MedicineFavoriteServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MedicineFavoriteServiceError';
  }
}

export async function fetchMedicineFavorites(): Promise<MedicineFavorite[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    throw new MedicineFavoriteServiceError('로그인 후 즐겨찾기를 이용할 수 있습니다.');
  }

  const { data, error } = await supabase
    .from(USER_FAVORITES_TABLE)
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new MedicineFavoriteServiceError(parseFavoriteError(error.message));
  }

  return ((data ?? []) as MedicineFavoriteRow[]).map(mapRow);
}

export async function addMedicineFavorite(itemSeq: string, itemName: string): Promise<void> {
  const normalizedSeq = itemSeq.trim();
  if (!normalizedSeq) {
    throw new MedicineFavoriteServiceError('품목 코드가 없어 즐겨찾기에 추가할 수 없습니다.');
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    throw new MedicineFavoriteServiceError('로그인 후 즐겨찾기를 이용할 수 있습니다.');
  }

  const { error } = await supabase.from(USER_FAVORITES_TABLE).insert({
    user_id: auth.user.id,
    item_seq: normalizedSeq,
    item_name: itemName.trim() || '의약품',
  });

  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      return;
    }
    throw new MedicineFavoriteServiceError(parseFavoriteError(error.message));
  }
}

export async function removeMedicineFavorite(itemSeq: string): Promise<void> {
  const normalizedSeq = itemSeq.trim();
  if (!normalizedSeq) return;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    throw new MedicineFavoriteServiceError('로그인 후 즐겨찾기를 이용할 수 있습니다.');
  }

  const { error } = await supabase
    .from(USER_FAVORITES_TABLE)
    .delete()
    .eq('user_id', auth.user.id)
    .eq('item_seq', normalizedSeq);

  if (error) {
    throw new MedicineFavoriteServiceError(parseFavoriteError(error.message));
  }
}

export async function toggleMedicineFavorite(
  itemSeq: string,
  itemName: string,
  currentlyFavorite: boolean,
): Promise<boolean> {
  if (currentlyFavorite) {
    await removeMedicineFavorite(itemSeq);
    return false;
  }
  await addMedicineFavorite(itemSeq, itemName);
  return true;
}
