import { supabase } from '../lib/supabase';
import type { FaqItem } from '../types';

export async function fetchPublishedFaqs(): Promise<FaqItem[]> {
  const { data, error } = await supabase.rpc('list_published_faqs');
  if (error) throw error;
  return (data ?? []) as FaqItem[];
}
