import { supabase } from '../lib/supabase';
import type { FundUsageReport } from '../types';

export async function fetchPublishedFundUsageReports(): Promise<FundUsageReport[]> {
  const { data, error } = await supabase.rpc('list_published_fund_usage_reports', { p_limit: 100 });
  if (error) throw error;
  return (data ?? []) as FundUsageReport[];
}

export async function fetchFundUsageReport(id: string): Promise<FundUsageReport> {
  const { data, error } = await supabase.rpc('get_fund_usage_report', { p_id: id });
  if (error) throw error;
  return data as FundUsageReport;
}

export async function adminListFundUsageReports(): Promise<FundUsageReport[]> {
  const { data, error } = await supabase.rpc('admin_list_fund_usage_reports');
  if (error) throw error;
  return (data ?? []) as FundUsageReport[];
}

export type UpsertFundUsageInput = {
  id?: string;
  title: string;
  content: string;
  summary?: string;
  amount_used?: number | null;
  receipt_image_url?: string;
  is_published: boolean;
};

export async function adminUpsertFundUsageReport(input: UpsertFundUsageInput): Promise<FundUsageReport> {
  const { data, error } = await supabase.rpc('admin_upsert_fund_usage_report', {
    p_id: input.id ?? null,
    p_title: input.title,
    p_content: input.content,
    p_summary: input.summary ?? null,
    p_amount_used: input.amount_used ?? null,
    p_receipt_image_url: input.receipt_image_url ?? null,
    p_is_published: input.is_published,
  });
  if (error) throw error;
  return data as FundUsageReport;
}

export async function adminDeleteFundUsageReport(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_fund_usage_report', { p_id: id });
  if (error) throw error;
}

export function subscribeFundUsageReports(onChange: () => void): () => void {
  const channel = supabase
    .channel('kemix_fund_usage_reports_web')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kemix_fund_usage_reports' }, () =>
      onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
