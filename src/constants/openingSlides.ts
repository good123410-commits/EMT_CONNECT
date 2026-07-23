import type { OpeningSlide } from '@/types/openingSlide';

/** 모바일 fallback — 웹 `public/assets/opening`과 동일한 Unsplash 대체 URL */
export const OPENING_SLIDES: OpeningSlide[] = [
  {
    id: 'local-01',
    image_url:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80',
    fallback_url:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80',
    title: '구급대원 현장',
    caption: '24시간 응급의료 최전선',
    display_order: 1,
    is_active: true,
    source: 'local',
  },
  {
    id: 'local-02',
    image_url:
      'https://images.unsplash.com/photo-1584433140859-d9baeafe2f6c?w=1920&q=80',
    fallback_url:
      'https://images.unsplash.com/photo-1584433140859-d9baeafe2f6c?w=1920&q=80',
    title: '응급구조사',
    caption: '현장에서 생명을 지키는 응급의료인',
    display_order: 2,
    is_active: true,
    source: 'local',
  },
  {
    id: 'local-03',
    image_url:
      'https://images.unsplash.com/photo-1519494026896-80bbe7fb15a6?w=1920&q=80',
    fallback_url:
      'https://images.unsplash.com/photo-1519494026896-80bbe7fb15a6?w=1920&q=80',
    title: '해상 응급대응',
    caption: '해경·해상 구조 현장',
    display_order: 3,
    is_active: true,
    source: 'local',
  },
  {
    id: 'local-04',
    image_url:
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1920&q=80',
    fallback_url:
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1920&q=80',
    title: '응급의료 시스템',
    caption: '병원·응급실 연계 네트워크',
    display_order: 4,
    is_active: true,
    source: 'local',
  },
  {
    id: 'local-05',
    image_url:
      'https://images.unsplash.com/photo-1526256262350-4da1644bbb71?w=1920&q=80',
    fallback_url:
      'https://images.unsplash.com/photo-1526256262350-4da1644bbb71?w=1920&q=80',
    title: '구조·이송',
    caption: '신속한 현장 대응과 이송',
    display_order: 5,
    is_active: true,
    source: 'local',
  },
];
