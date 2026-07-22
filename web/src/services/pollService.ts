import { supabase } from '../lib/supabase';
import type { Poll } from '../types';

function mapPoll(row: unknown): Poll | null {
  if (!row || typeof row !== 'object') return null;
  return row as Poll;
}

function mapPollList(data: unknown): Poll[] {
  if (!Array.isArray(data)) return [];
  return data.map(mapPoll).filter((p): p is Poll => p !== null);
}

export async function fetchPublishedPolls(): Promise<Poll[]> {
  const { data, error } = await supabase.rpc('list_published_polls');
  if (error) throw error;
  return mapPollList(data);
}

export async function fetchPublishedPoll(id: string): Promise<Poll | null> {
  const { data, error } = await supabase.rpc('get_published_poll', { p_id: id });
  if (error) throw error;
  return mapPoll(data);
}

export async function castPollVote(pollId: string, optionId: string): Promise<Poll> {
  const { data, error } = await supabase.rpc('cast_poll_vote', {
    p_poll_id: pollId,
    p_option_id: optionId,
  });
  if (error) throw error;
  const poll = mapPoll(data);
  if (!poll) throw new Error('투표 처리에 실패했습니다.');
  return poll;
}

export function getPollStatusLabel(poll: Poll): string {
  if (!poll.is_published) return '비공개';
  if (poll.is_closed) return '마감';
  if (poll.ends_at && new Date(poll.ends_at) <= new Date()) return '종료';
  if (poll.is_votable) return '진행 중';
  return '마감';
}

export function formatPollEndsAt(endsAt: string | null): string {
  if (!endsAt) return '기한 없음';
  return new Date(endsAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
