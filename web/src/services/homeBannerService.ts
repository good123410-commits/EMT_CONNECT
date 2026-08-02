import { supabase } from '../lib/supabase';

export type HomeBanner = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  linkUrl: string;
};

type HomeEventBannerRow = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_url: string;
};

function mapRow(row: HomeEventBannerRow): HomeBanner {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
  };
}

export async function fetchActiveHomeEventBanners(): Promise<HomeBanner[]> {
  const { data, error } = await supabase.rpc('list_active_home_event_banners');
  if (error) throw error;
  return ((data ?? []) as HomeEventBannerRow[]).map(mapRow);
}
