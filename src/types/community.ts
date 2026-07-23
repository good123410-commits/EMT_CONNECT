export type CommunityReaction = 'like' | 'dislike';

export type CommunityCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
};

export type CommunityPost = {
  id: string;
  post_type: string;
  title: string | null;
  summary: string | null;
  content: string;
  anonymous_label: string;
  likes: number;
  dislikes: number;
  is_hot: boolean;
  author_id: string | null;
  created_at: string;
  is_hidden: boolean;
  is_notice: boolean;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  comment_count: number;
  my_reaction: CommunityReaction | null;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  anonymous_label: string;
  content: string;
  likes: number;
  dislikes: number;
  created_at: string;
  my_reaction: CommunityReaction | null;
};

export type PaginatedPosts = {
  posts: CommunityPost[];
  totalCount: number;
  page: number;
  pageSize: number;
};
