/** KEMIX 자료실 — 웹 `kemix_resources` 테이블과 동일 모델 */
export type KemixResource = {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
