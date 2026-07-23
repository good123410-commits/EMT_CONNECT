export type OpeningSlide = {
  id: string;
  image_url: string;
  fallback_url?: string | null;
  title: string;
  caption?: string | null;
  display_order: number;
  is_active: boolean;
  source?: 'db' | 'local';
  created_at?: string;
  updated_at?: string;
};
