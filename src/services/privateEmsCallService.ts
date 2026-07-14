import {
  PRIVATE_EMS_CALLS_TABLE,
  supabase,
  type PrivateEmsCall,
  type PrivateEmsCallStatus,
} from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class PrivateEmsCallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrivateEmsCallError';
  }
}

export type CreatePrivateEmsCallInput = {
  requesterId: string;
  latitude: number;
  longitude: number;
  address?: string;
  notes?: string;
};

/** 일반 유저: 현재 위치 기반 사설 구급차 호출 요청 */
export async function requestPrivateEmsCall(
  input: CreatePrivateEmsCallInput,
): Promise<PrivateEmsCall> {
  const { data, error } = await supabase
    .from(PRIVATE_EMS_CALLS_TABLE)
    .insert({
      requester_id: input.requesterId,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address ?? null,
      notes: input.notes ?? null,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw new PrivateEmsCallError(error.message);
  return data as PrivateEmsCall;
}

/** 사설 구급차 운용자: 실시간 배차 콜 리스트 */
export async function fetchDispatchCallList(): Promise<PrivateEmsCall[]> {
  const { data, error } = await supabase
    .from(PRIVATE_EMS_CALLS_TABLE)
    .select('*')
    .in('status', ['pending', 'accepted', 'in_progress'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PrivateEmsCall[];
}

/** 일반 유저: 본인 호출 이력 */
export async function fetchMyEmsCalls(requesterId: string): Promise<PrivateEmsCall[]> {
  const { data, error } = await supabase
    .from(PRIVATE_EMS_CALLS_TABLE)
    .select('*')
    .eq('requester_id', requesterId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PrivateEmsCall[];
}

export async function updateEmsCallStatus(
  callId: string,
  status: PrivateEmsCallStatus,
  operatorId?: string,
): Promise<PrivateEmsCall> {
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (operatorId) payload.assigned_operator_id = operatorId;

  const { data, error } = await supabase
    .from(PRIVATE_EMS_CALLS_TABLE)
    .update(payload)
    .eq('id', callId)
    .select('*')
    .single();

  if (error) throw error;
  return data as PrivateEmsCall;
}

/** Realtime 구독: 배차 콜 리스트 즉시 동기화 */
export function subscribeToDispatchCalls(
  onUpdate: (calls: PrivateEmsCall[]) => void,
): RealtimeChannel {
  const channel = supabase
    .channel('private_ems_dispatch')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: PRIVATE_EMS_CALLS_TABLE },
      async () => {
        const calls = await fetchDispatchCallList();
        onUpdate(calls);
      },
    )
    .subscribe();

  void fetchDispatchCallList().then(onUpdate);
  return channel;
}

export function unsubscribeDispatchCalls(channel: RealtimeChannel): void {
  void supabase.removeChannel(channel);
}

export function getCallStatusLabel(status: PrivateEmsCallStatus): string {
  switch (status) {
    case 'pending':
      return '대기 중';
    case 'accepted':
      return '수락됨';
    case 'in_progress':
      return '이동 중';
    case 'completed':
      return '완료';
    case 'cancelled':
      return '취소됨';
    default:
      return status;
  }
}
