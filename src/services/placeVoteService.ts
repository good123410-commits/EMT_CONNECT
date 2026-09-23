import { supabase } from '@/lib/supabaseClient';
import type {
  PlaceVoteKind,
  PlaceVoteRequest,
  PlaceVoteSummary,
  PlaceVoteType,
} from '@/types/placeVote';
import { emptyPlaceVoteSummary } from '@/types/placeVote';

function parseSummary(raw: unknown): PlaceVoteSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const placeKind = row.place_kind;
  const placeId = row.place_id;
  if (
    typeof placeKind !== 'string' ||
    typeof placeId !== 'string' ||
    !['aed', 'shelter', 'pharmacy', 'er', 'pediatric'].includes(placeKind)
  ) {
    return null;
  }

  const myVote = row.my_vote;
  const parsedMyVote =
    myVote === 'like' || myVote === 'dislike' ? myVote : null;

  return {
    place_kind: placeKind as PlaceVoteKind,
    place_id: placeId,
    like_count: Number(row.like_count) || 0,
    dislike_count: Number(row.dislike_count) || 0,
    my_vote: parsedMyVote,
  };
}

export function getPlaceVoteErrorMessage(error: unknown): string {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';

  if (message.includes('login_required')) {
    return '로그인 후 이용 가능합니다';
  }
  if (message.includes('invalid_place_kind') || message.includes('invalid_place_id')) {
    return '유효하지 않은 장소입니다';
  }
  if (message.includes('invalid_vote_type')) {
    return '유효하지 않은 투표 유형입니다';
  }

  return '투표 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

export async function fetchPlaceVoteSummary(
  placeKind: PlaceVoteKind,
  placeId: string,
): Promise<PlaceVoteSummary> {
  const trimmedId = placeId.trim();
  if (!trimmedId) {
    return emptyPlaceVoteSummary(placeKind, placeId);
  }

  const { data, error } = await supabase.rpc('get_place_vote_summary', {
    p_place_kind: placeKind,
    p_place_id: trimmedId,
  });

  if (error) throw error;

  return parseSummary(data) ?? emptyPlaceVoteSummary(placeKind, trimmedId);
}

export async function fetchPlaceVoteSummaries(
  requests: PlaceVoteRequest[],
): Promise<PlaceVoteSummary[]> {
  const normalized = requests
    .map((request) => ({
      place_kind: request.place_kind,
      place_id: request.place_id.trim(),
    }))
    .filter((request) => request.place_id.length > 0);

  if (normalized.length === 0) return [];

  const { data, error } = await supabase.rpc('get_place_vote_summaries', {
    p_requests: normalized,
  });

  if (error) throw error;

  if (!Array.isArray(data)) return [];

  return data
    .map((row) => parseSummary(row))
    .filter((row): row is PlaceVoteSummary => row !== null);
}

export async function togglePlaceVote(
  placeKind: PlaceVoteKind,
  placeId: string,
  voteType: PlaceVoteType,
): Promise<PlaceVoteSummary> {
  const trimmedId = placeId.trim();
  if (!trimmedId) {
    throw new Error('invalid_place_id');
  }

  const { data, error } = await supabase.rpc('toggle_place_vote', {
    p_place_kind: placeKind,
    p_place_id: trimmedId,
    p_vote_type: voteType,
  });

  if (error) throw error;

  return parseSummary(data) ?? emptyPlaceVoteSummary(placeKind, trimmedId);
}
