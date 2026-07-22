import { supabase } from '../lib/supabase';
import type { FaqItem, MonthlyInterview } from '../types';

export type KemixPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  thumbnail_url: string | null;
  views: number;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  category: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type PostCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export type SkillNode = {
  id: string;
  level: 'foundation' | 'intermediate' | 'advanced' | 'expert';
  title: string;
  description: string;
  prerequisites: string[];
  recommended_courses: string;
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
  created_at: string;
};

export type AdminCommunityPost = {
  id: string;
  post_type: string;
  title: string | null;
  content: string;
  anonymous_label: string;
  likes: number;
  is_hot: boolean;
  is_hidden: boolean;
  is_notice: boolean;
  category_id: string | null;
  created_at: string;
};

export type AdminQuestion = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
};

function rpcError(err: { message: string }) {
  throw new Error(err.message);
}

// ── Interviews ──
export async function adminListInterviews(): Promise<MonthlyInterview[]> {
  const { data, error } = await supabase.rpc('admin_list_interviews');
  if (error) rpcError(error);
  return (data ?? []) as MonthlyInterview[];
}

export type UpsertInterviewInput = {
  id?: string;
  title: string;
  interviewee_name: string;
  interviewee_role?: string;
  excerpt?: string;
  content: string;
  thumbnail_url?: string;
  published_month: string;
  is_published: boolean;
  is_featured: boolean;
};

export async function adminUpsertInterview(input: UpsertInterviewInput) {
  const { data, error } = await supabase.rpc('admin_upsert_interview', {
    p_id: input.id ?? null,
    p_title: input.title,
    p_interviewee_name: input.interviewee_name,
    p_interviewee_role: input.interviewee_role ?? null,
    p_excerpt: input.excerpt ?? null,
    p_content: input.content,
    p_thumbnail_url: input.thumbnail_url ?? null,
    p_published_month: input.published_month,
    p_is_published: input.is_published,
    p_is_featured: input.is_featured,
  });
  if (error) rpcError(error);
  return data as MonthlyInterview;
}

export async function adminDeleteInterview(id: string) {
  const { error } = await supabase.rpc('admin_delete_interview', { p_id: id });
  if (error) rpcError(error);
}

// ── Guides (kemi_posts) ──
export async function adminListGuides(): Promise<KemixPost[]> {
  const { data, error } = await supabase.rpc('admin_list_kemi_posts', {
    p_include_unpublished: true,
    p_limit: 200,
    p_offset: 0,
  });
  if (error) rpcError(error);
  return (data ?? []) as KemixPost[];
}

export type UpsertGuideInput = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  thumbnail_url?: string;
  is_published: boolean;
  category: string;
  seo_title?: string;
  seo_description?: string;
};

export async function adminUpsertGuide(input: UpsertGuideInput) {
  const { data, error } = await supabase.rpc('admin_upsert_kemi_post', {
    p_id: input.id ?? null,
    p_title: input.title,
    p_slug: input.slug,
    p_content: input.content,
    p_thumbnail_url: input.thumbnail_url ?? null,
    p_is_published: input.is_published,
    p_seo_title: input.seo_title ?? input.title,
    p_seo_description: input.seo_description ?? null,
    p_category: input.category,
    p_summary: null,
  });
  if (error) rpcError(error);
  return data as KemixPost;
}

export async function adminDeleteGuide(id: string) {
  const { error } = await supabase.rpc('admin_delete_kemi_post', { p_id: id });
  if (error) rpcError(error);
}

// ── Guide categories ──
export async function adminListPostCategories(): Promise<PostCategory[]> {
  try {
    const { data, error } = await supabase.rpc('admin_list_post_categories');
    if (error) rpcError(error);
    return (data ?? []) as PostCategory[];
  } catch {
    return [];
  }
}

export async function adminUpsertPostCategory(input: {
  id?: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}) {
  const { data, error } = await supabase.rpc('admin_upsert_post_category', {
    p_id: input.id ?? null,
    p_name: input.name,
    p_slug: input.slug,
    p_display_order: input.display_order,
    p_is_active: input.is_active,
  });
  if (error) rpcError(error);
  return data as PostCategory;
}

export async function adminDeletePostCategory(id: string) {
  const { error } = await supabase.rpc('admin_delete_post_category', { p_id: id });
  if (error) rpcError(error);
}

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

// ── Community ──
export async function adminListCommunityCategories(): Promise<CommunityCategory[]> {
  const { data, error } = await supabase.rpc('admin_list_community_categories');
  if (error) rpcError(error);
  return (data ?? []) as CommunityCategory[];
}

export async function adminUpsertCommunityCategory(input: {
  id?: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}) {
  const { data, error } = await supabase.rpc('admin_upsert_community_category', {
    p_id: input.id ?? null,
    p_name: input.name,
    p_slug: input.slug,
    p_display_order: input.display_order,
    p_is_active: input.is_active,
  });
  if (error) rpcError(error);
  return data as CommunityCategory;
}

export async function adminDeleteCommunityCategory(id: string) {
  const { error } = await supabase.rpc('admin_delete_community_category', { p_id: id });
  if (error) rpcError(error);
}

export async function adminListCommunityPosts(): Promise<AdminCommunityPost[]> {
  const { data, error } = await supabase
    .from('ems_community_posts')
    .select('id, post_type, title, content, anonymous_label, likes, is_hot, is_hidden, is_notice, category_id, created_at')
    .eq('post_type', 'bamboo')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) rpcError(error);
  return (data ?? []) as AdminCommunityPost[];
}

export async function adminHideCommunityPost(id: string, hidden: boolean) {
  const { error } = await supabase.rpc('admin_set_community_post_hidden', {
    p_post_id: id,
    p_hidden: hidden,
  });
  if (error) rpcError(error);
}

export async function adminDeleteCommunityPost(id: string) {
  const { error } = await supabase.rpc('admin_delete_community_post', { p_post_id: id });
  if (error) rpcError(error);
}

export async function adminSetCommunityNotice(id: string, isNotice: boolean) {
  const { error } = await supabase
    .from('ems_community_posts')
    .update({ is_notice: isNotice })
    .eq('id', id);
  if (error) rpcError(error);
}

// ── Skills ──
export async function adminListSkillNodes(): Promise<SkillNode[]> {
  const { data, error } = await supabase.rpc('admin_list_skill_nodes');
  if (error) rpcError(error);
  return (data ?? []) as SkillNode[];
}

export async function adminUpsertSkillNode(input: {
  id?: string;
  level: SkillNode['level'];
  title: string;
  description: string;
  prerequisites: string[];
  recommended_courses: string;
  display_order: number;
  is_published: boolean;
}) {
  const { data, error } = await supabase.rpc('admin_upsert_skill_node', {
    p_id: input.id ?? null,
    p_level: input.level,
    p_title: input.title,
    p_description: input.description,
    p_prerequisites: input.prerequisites,
    p_recommended_courses: input.recommended_courses,
    p_display_order: input.display_order,
    p_is_published: input.is_published,
  });
  if (error) rpcError(error);
  return data as SkillNode;
}

export async function adminDeleteSkillNode(id: string) {
  const { error } = await supabase.rpc('admin_delete_skill_node', { p_id: id });
  if (error) rpcError(error);
}

// ── FAQ ──
export async function adminListFaqs(): Promise<FaqItem[]> {
  const { data, error } = await supabase.rpc('admin_list_faqs');
  if (error) rpcError(error);
  return (data ?? []) as FaqItem[];
}

export async function adminUpsertFaq(input: {
  id?: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_published: boolean;
}) {
  const { data, error } = await supabase.rpc('admin_upsert_faq', {
    p_id: input.id ?? null,
    p_question: input.question,
    p_answer: input.answer,
    p_category: input.category,
    p_display_order: input.display_order,
    p_is_published: input.is_published,
  });
  if (error) rpcError(error);
  return data as FaqItem;
}

export async function adminDeleteFaq(id: string) {
  const { error } = await supabase.rpc('admin_delete_faq', { p_id: id });
  if (error) rpcError(error);
}

// ── Q&A ──
export async function adminListQuestions(): Promise<AdminQuestion[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('id, user_id, title, content, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) rpcError(error);
  return (data ?? []) as AdminQuestion[];
}

export async function adminDeleteQuestion(id: string) {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) rpcError(error);
}

// ── Schedules ──
export async function adminListSchedules() {
  const { data, error } = await supabase.rpc('admin_list_schedules');
  if (error) rpcError(error);
  return (data ?? []) as import('../types').KemixSchedule[];
}

export type UpsertScheduleInput = {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
  location?: string;
  description?: string;
  tag_color?: string;
  is_published: boolean;
  display_order: number;
};

export async function adminUpsertSchedule(input: UpsertScheduleInput) {
  const { data, error } = await supabase.rpc('admin_upsert_schedule', {
    p_id: input.id ?? null,
    p_title: input.title,
    p_start_date: input.start_date,
    p_end_date: input.end_date,
    p_location: input.location ?? '',
    p_description: input.description ?? '',
    p_tag_color: input.tag_color ?? '#047857',
    p_is_published: input.is_published,
    p_display_order: input.display_order,
  });
  if (error) rpcError(error);
  return data as import('../types').KemixSchedule;
}

export async function adminDeleteSchedule(id: string) {
  const { error } = await supabase.rpc('admin_delete_schedule', { p_id: id });
  if (error) rpcError(error);
}

// ── Trainings ──
export async function adminListTrainings() {
  const { data, error } = await supabase.rpc('admin_list_trainings');
  if (error) rpcError(error);
  return (data ?? []) as import('../types').KemixTraining[];
}

export type UpsertTrainingInput = {
  id?: string;
  title: string;
  category: string;
  training_start?: string | null;
  training_end?: string | null;
  status: import('../types').TrainingStatus;
  apply_url?: string | null;
  attachment_url?: string | null;
  excerpt?: string | null;
  content: string;
  is_published: boolean;
  display_order: number;
};

export async function adminUpsertTraining(input: UpsertTrainingInput) {
  const { data, error } = await supabase.rpc('admin_upsert_training', {
    p_id: input.id ?? null,
    p_title: input.title,
    p_category: input.category,
    p_training_start: input.training_start ?? null,
    p_training_end: input.training_end ?? null,
    p_status: input.status,
    p_apply_url: input.apply_url ?? null,
    p_attachment_url: input.attachment_url ?? null,
    p_excerpt: input.excerpt ?? null,
    p_content: input.content,
    p_is_published: input.is_published,
    p_display_order: input.display_order,
  });
  if (error) rpcError(error);
  return data as import('../types').KemixTraining;
}

export async function adminDeleteTraining(id: string) {
  const { error } = await supabase.rpc('admin_delete_training', { p_id: id });
  if (error) rpcError(error);
}

// ── Training categories ──
export type TrainingCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
};

export async function adminListTrainingCategories(): Promise<TrainingCategory[]> {
  try {
    const { data, error } = await supabase.rpc('admin_list_training_categories');
    if (error) rpcError(error);
    return (data ?? []) as TrainingCategory[];
  } catch {
    return [];
  }
}

export async function adminUpsertTrainingCategory(input: {
  id?: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}) {
  const { data, error } = await supabase.rpc('admin_upsert_training_category', {
    p_id: input.id ?? null,
    p_name: input.name,
    p_slug: input.slug,
    p_display_order: input.display_order,
    p_is_active: input.is_active,
  });
  if (error) rpcError(error);
  return data as TrainingCategory;
}

export async function adminDeleteTrainingCategory(id: string) {
  const { error } = await supabase.rpc('admin_delete_training_category', { p_id: id });
  if (error) rpcError(error);
}

// ── Opening slides ──
export async function adminListOpeningSlides(): Promise<import('../types').OpeningSlide[]> {
  try {
    const { data, error } = await supabase.rpc('admin_list_opening_slides');
    if (error) rpcError(error);
    return ((data ?? []) as import('../types').OpeningSlide[]).map((row) => ({
      ...row,
      source: 'db' as const,
    }));
  } catch {
    return [];
  }
}

export type UpsertOpeningSlideInput = {
  id?: string;
  image_url: string;
  fallback_url?: string | null;
  title: string;
  caption?: string | null;
  display_order: number;
  is_active: boolean;
};

export async function adminUpsertOpeningSlide(input: UpsertOpeningSlideInput) {
  const { data, error } = await supabase.rpc('admin_upsert_opening_slide', {
    p_id: input.id ?? null,
    p_image_url: input.image_url,
    p_fallback_url: input.fallback_url ?? null,
    p_title: input.title,
    p_caption: input.caption ?? null,
    p_display_order: input.display_order,
    p_is_active: input.is_active,
  });
  if (error) rpcError(error);
  return data as import('../types').OpeningSlide;
}

export async function adminDeleteOpeningSlide(id: string) {
  const { error } = await supabase.rpc('admin_delete_opening_slide', { p_id: id });
  if (error) rpcError(error);
}

// ── About pages ──
export async function adminListAboutPages(): Promise<import('../types').KemixAboutPage[]> {
  const { data, error } = await supabase.rpc('admin_list_about_pages');
  if (error) rpcError(error);
  return (data ?? []) as import('../types').KemixAboutPage[];
}

export type UpsertAboutPageInput = {
  slug: import('../types').AboutPageSlug;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  content: string;
  is_published: boolean;
};

export async function adminUpsertAboutPage(input: UpsertAboutPageInput) {
  const { data, error } = await supabase.rpc('admin_upsert_about_page', {
    p_slug: input.slug,
    p_eyebrow: input.eyebrow,
    p_title: input.title,
    p_subtitle: input.subtitle ?? null,
    p_content: input.content,
    p_is_published: input.is_published,
  });
  if (error) rpcError(error);
  return data as import('../types').KemixAboutPage;
}

// ── About items (history / structure / dev-log) ──
export async function adminListAboutItems(
  pageSlug?: import('../types').AboutItemPageSlug,
): Promise<import('../types').KemixAboutItem[]> {
  const { data, error } = await supabase.rpc('admin_list_about_items', {
    p_page_slug: pageSlug ?? null,
  });
  if (error) rpcError(error);
  return (data ?? []) as import('../types').KemixAboutItem[];
}

export type UpsertAboutItemInput = {
  id?: string;
  page_slug: import('../types').AboutItemPageSlug;
  badge_label?: string | null;
  title: string;
  summary: string;
  content: string;
  display_order: number;
  is_published: boolean;
};

export async function adminUpsertAboutItem(input: UpsertAboutItemInput) {
  const { data, error } = await supabase.rpc('admin_upsert_about_item', {
    p_id: input.id ?? null,
    p_page_slug: input.page_slug,
    p_badge_label: input.badge_label ?? null,
    p_title: input.title,
    p_summary: input.summary,
    p_content: input.content,
    p_display_order: input.display_order,
    p_is_published: input.is_published,
  });
  if (error) rpcError(error);
  return data as import('../types').KemixAboutItem;
}

export async function adminDeleteAboutItem(id: string) {
  const { error } = await supabase.rpc('admin_delete_about_item', { p_id: id });
  if (error) rpcError(error);
}

// ── Users ──
export async function adminListUsers(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<import('../types').AdminUserRow[]> {
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_search: options?.search?.trim() || null,
    p_limit: options?.limit ?? 100,
    p_offset: options?.offset ?? 0,
  });
  if (error) rpcError(error);
  return ((data ?? []) as import('../types').AdminUserRow[]).map((row) => ({
    ...row,
    is_blocked: Boolean(row.is_blocked),
  }));
}

export async function adminSetUserRole(userId: string, role: import('../types').UserRole) {
  const { data, error } = await supabase.rpc('admin_set_user_role', {
    p_user_id: userId,
    p_role: role,
  });
  if (error) rpcError(error);
  return data as import('../types').AdminUserRow;
}

export async function adminSetUserBlocked(userId: string, blocked: boolean) {
  const { data, error } = await supabase.rpc('admin_set_user_blocked', {
    p_user_id: userId,
    p_blocked: blocked,
    p_reason: null,
  });
  if (error) rpcError(error);
  return data as import('../types').AdminUserRow;
}

// ── Polls ──
function mapPollList(data: unknown): import('../types').Poll[] {
  if (!Array.isArray(data)) return [];
  return data as import('../types').Poll[];
}

export async function adminListPolls(): Promise<import('../types').Poll[]> {
  const { data, error } = await supabase.rpc('admin_list_polls');
  if (error) rpcError(error);
  return mapPollList(data);
}

export type UpsertPollInput = {
  id?: string;
  title: string;
  description: string;
  is_published: boolean;
  ends_at: string | null;
  display_order: number;
  options: Array<{ id?: string; label: string; display_order: number }>;
};

export async function adminUpsertPoll(input: UpsertPollInput) {
  const { data, error } = await supabase.rpc('admin_upsert_poll', {
    p_id: input.id ?? null,
    p_title: input.title,
    p_description: input.description,
    p_is_published: input.is_published,
    p_ends_at: input.ends_at,
    p_display_order: input.display_order,
    p_options: input.options,
  });
  if (error) rpcError(error);
  return data as import('../types').Poll;
}

export async function adminDeletePoll(id: string) {
  const { error } = await supabase.rpc('admin_delete_poll', { p_id: id });
  if (error) rpcError(error);
}

export async function adminClosePoll(id: string, closed = true) {
  const { data, error } = await supabase.rpc('admin_close_poll', {
    p_id: id,
    p_closed: closed,
  });
  if (error) rpcError(error);
  return data as import('../types').Poll;
}
