import { supabase } from '@/lib/supabaseClient';
import type { EmergencyTickerItem } from '@/types/emergencyTicker';

export const EMERGENCY_NOTICES_TABLE = 'kemix_home_emergency_notices';

type TickerRow = {
  message: string;
  source_type: string;
  priority: number;
  sort_order: number;
};

export class EmergencyTickerServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmergencyTickerServiceError';
  }
}

export async function fetchActiveEmergencyTickerItems(): Promise<EmergencyTickerItem[]> {
  const { data, error } = await supabase.rpc('list_active_emergency_ticker_messages');

  if (error) {
    throw new EmergencyTickerServiceError(error.message);
  }

  return ((data ?? []) as TickerRow[]).map((row) => ({
    message: row.message,
    sourceType: row.source_type,
    priority: row.priority,
    sortOrder: row.sort_order,
  }));
}
