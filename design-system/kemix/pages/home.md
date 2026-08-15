# Home Screen — KEMIX Override

> `design-system/kemix/MASTER.md`를 기본으로 하며, 아래만 홈 화면에 추가 적용한다.

## 정보 계층 (상→하)

1. **HomeEventBannerList** — 가로 스와이프 캐러셀 (공지·이벤트)
2. **HomeEmergencyHero** — 응급·구급 퀵메뉴 (1초 내 인지)
3. **HomeCommerceCuration** — 응급·건강 케어 제휴 카드

## 금지

- 홈 최상단에 세로로 쌓인 대형 정적 배너 이미지
- `text-xs` 이하 본문 라벨
- raw hex 색상 (`#dc2626` 등)

## 터치

- 퀵액션 타일: `minHeight` ≥ 64pt (44pt + 아이콘 영역)
- 케어 카드 전체: Pressable, `accessibilityLabel` 필수
