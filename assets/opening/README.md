# KEMIX Opening / Hero 슬라이드 이미지

이 폴더의 이미지는 **오프닝 몽타주**와 **홈 히어로 슬라이더**에서 사용됩니다.

## 파일명 (권장)

| 파일 | 설명 |
|------|------|
| `slide-01-paramedic.jpg` | 구급대원 현장 |
| `slide-02-emt.jpg` | 응급구조사 |
| `slide-03-coast-guard.jpg` | 해상 응급·해경 |
| `slide-04-hospital.jpg` | 응급의료 시스템 |
| `slide-05-rescue.jpg` | 구조·이송 |

- 권장 해상도: **1920×1080** 이상 (JPG/WEBP)
- 파일이 없으면 `src/constants/openingSlides.ts`의 `fallback_url`(원격)이 자동 사용됩니다.
- Supabase DB에 슬라이드가 등록되면 **DB 이미지가 최우선** 적용됩니다.
