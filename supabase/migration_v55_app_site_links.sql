-- 앱 설정: 공식 웹사이트 URL · 후원 안내 문구
-- 선행: migration_v35_kemix_roles_site_settings.sql

INSERT INTO public.site_settings (key, title, content)
VALUES
  (
    'official_website',
    '공식 웹사이트',
    'https://kemix.kr'
  ),
  (
    'donation_notice',
    '후원 안내',
    'KEMIX는 응급구조사 교육·장비 지원 등 공익 목적으로 후원을 운영합니다. 아래 계좌로 후원해 주시면 응급의료 현장 혁신에 소중히 사용됩니다.'
  )
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
