import { supabase } from '@/lib/supabaseClient';

export type DonationAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  purpose: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchActiveDonationAccounts(): Promise<DonationAccount[]> {
  const { data, error } = await supabase.rpc('list_active_donation_accounts');
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as DonationAccount[];
}
