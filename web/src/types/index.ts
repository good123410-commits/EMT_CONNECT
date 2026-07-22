export type UserRole =
  | 'user'
  | 'associate_member'
  | 'regular_member'
  | 'sub_admin'
  | 'super_admin'
  | 'hospital'
  | 'paramedic'
  | 'private_ems'
  | 'admin';

export type ProfileJobRole = 'paramedic' | 'hospital' | 'private_ems' | 'user';

export type UserProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  name: string | null;
  nickname: string | null;
  phone: string | null;
  company_name: string | null;
  profile_completed?: boolean;
  is_approved: boolean;
  is_blocked?: boolean;
  created_at: string;
};

export type ProfileSetupInput = {
  nickname: string;
  name?: string;
  phone?: string;
  role: ProfileJobRole;
  company_name?: string;
};

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

export type MonthlyInterview = {
  id: string;
  title: string;
  interviewee_name: string;
  interviewee_role: string | null;
  excerpt: string | null;
  content: string;
  thumbnail_url: string | null;
  published_month: string;
  is_published: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_published: boolean;
  created_at: string;
};

export type InquiryStatus = 'pending' | 'answered';

export type KemixInquiry = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  admin_answer: string | null;
  status: InquiryStatus;
  answered_at: string | null;
  answered_by: string | null;
  created_at: string;
  updated_at: string;
};

export type KemixSchedule = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
  tag_color: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type TrainingStatus = 'recruiting' | 'closed' | 'upcoming';

export type KemixTraining = {
  id: string;
  title: string;
  category: string;
  training_start: string | null;
  training_end: string | null;
  status: TrainingStatus;
  apply_url: string | null;
  attachment_url: string | null;
  excerpt: string | null;
  content: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

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

export type AboutPageSlug = 'vision' | 'history' | 'structure' | 'dev-log';

export type AboutItemPageSlug = 'history' | 'structure' | 'dev-log';

export type KemixAboutPage = {
  id?: string;
  slug: AboutPageSlug;
  eyebrow: string;
  title: string;
  subtitle: string | null;
  content: string;
  is_published: boolean;
  updated_at?: string;
  created_at?: string;
};

export type KemixAboutItem = {
  id: string;
  page_slug: AboutItemPageSlug;
  badge_label: string | null;
  title: string;
  summary: string;
  content: string;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CommunityCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
};

export type CommunityReaction = 'like' | 'dislike';

export type CommunityPost = {
  id: string;
  post_type: string;
  title: string | null;
  summary: string | null;
  content: string;
  anonymous_label: string;
  likes: number;
  dislikes?: number;
  is_hot: boolean;
  author_id: string | null;
  created_at: string;
  is_hidden?: boolean;
  is_notice?: boolean;
  category_id?: string | null;
  category_slug?: string | null;
  category_name?: string | null;
  comment_count?: number;
  my_reaction?: CommunityReaction | null;
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

export type ReactionCounts = {
  likes: number;
  dislikes: number;
  my_reaction: CommunityReaction | null;
};

export type PaginatedPosts = {
  posts: CommunityPost[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type SiteSettingKey = 'privacy_policy' | 'terms_of_service' | 'service_info';

export type SiteSetting = {
  key: SiteSettingKey | string;
  title: string;
  content: string;
  updated_at: string;
};

export type AdminUserRow = UserProfile;

export type PollOption = {
  id: string;
  poll_id: string;
  label: string;
  display_order: number;
  vote_count?: number;
};

export type Poll = {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  is_closed: boolean;
  ends_at: string | null;
  closed_at: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  is_votable?: boolean;
  total_votes?: number;
  my_vote_option_id?: string | null;
  options: PollOption[];
};
