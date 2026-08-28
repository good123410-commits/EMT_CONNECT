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

export type UpsertDonationInput = {
  id?: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  purpose: string;
  display_order: number;
  is_active: boolean;
};

export async function fetchActiveDonationAccounts(): Promise<DonationAccount[]> {
  const { data, error } = await supabase.rpc('list_active_donation_accounts');
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as DonationAccount[];
}

export async function adminListDonationAccounts(): Promise<DonationAccount[]> {
  const { data, error } = await supabase.rpc('admin_list_donation_accounts');
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as DonationAccount[];
}

export async function adminUpsertDonationAccount(input: UpsertDonationInput): Promise<DonationAccount> {
  const { data, error } = await supabase.rpc('admin_upsert_donation_account', {
    p_id: input.id ?? null,
    p_bank_name: input.bank_name,
    p_account_number: input.account_number,
    p_account_holder: input.account_holder,
    p_purpose: input.purpose,
    p_display_order: input.display_order,
    p_is_active: input.is_active,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data as DonationAccount;
}

export async function adminDeleteDonationAccount(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_donation_account', { p_id: id });
  if (error) {
    throw new Error(error.message);
  }
}

export function subscribeDonationAccounts(onChange: () => void): () => void {
  const channel = supabase
    .channel('kemix_donation_accounts_mobile')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kemix_donation_accounts' }, () =>
      onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
