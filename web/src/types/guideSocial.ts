export type GuideEngagement = {
  like_count: number;
  comment_count: number;
  liked: boolean;
};

export type GuideComment = {
  id: string;
  post_id: string;
  author_id: string;
  author_label: string;
  content: string;
  created_at: string;
};
