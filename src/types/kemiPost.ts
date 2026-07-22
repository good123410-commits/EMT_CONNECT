export type KemiPostSummary = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  views: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type KemiPost = KemiPostSummary & {
  content: string;
  is_published: boolean;
};
