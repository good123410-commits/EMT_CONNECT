# KEMIX Design System — MASTER

> 응급 의료 앱(KEMIX) UI의 단일 기준 문서.  
> 모든 화면·컴포넌트 수정 시 이 문서와 `src/theme/kemixSemantic.ts`를 우선 참조한다.

## 제품 맥락

| 항목 | 값 |
|------|-----|
| 제품 유형 | 응급 의료 · 위치 기반 시설 검색 (AED, 응급실, 약국, 소아) |
| 핵심 가치 | 신뢰, 즉시성, 가독성(야간·이동 중 사용) |
| 스택 | React Native · Expo · NativeWind · Pretendard |
| 테마 | `light` · `dark` · `beige` (`AppThemeMode`) |

## 토큰 아키텍처 (3계층)

```
Primitive (hex / rgba)
    ↓
Semantic (용도별 — background, text, status.*)
    ↓
Component (버튼·카드·세그먼트 variant)
```

- **Primitive**: `src/constants/appThemes.ts` — `AppColorPalette`
- **Semantic**: `src/theme/theme.ts` + `src/theme/kemixSemantic.ts`
- **Component**: `src/components/facility/*`, `SegmentControl`, `medicalListCardStyles.ts`

## 시맨틱 컬러

### Surface & Text (테마 대응)

| 토큰 | Tailwind | 용도 |
|------|----------|------|
| `background` | `bg-kemix-bg` | 화면 배경 |
| `cardBackground` | `bg-kemix-surface` | 카드·입력 필드 |
| `surfaceElevated` | `bg-kemix-elevated` | 모달·피커·세그먼트 트랙 |
| `text` | `text-kemix-text` | 본문·제목 |
| `subText` | `text-kemix-text-secondary` | 보조 라벨 |
| `mutedText` | `text-kemix-muted` | 메타·건수 |
| `border` | `border-kemix-border` | 기본 테두리 |
| `borderLight` | `border-kemix-border-light` | 구분선 |

### Status (의미 색 — `useThemedColors().status` / `src/theme/kemixSemantic.ts`)

| 토큰 경로 | 용도 | 사용 예 |
|-----------|------|---------|
| `semantic.status.gps.fg` | GPS·위치 기준 활성 텍스트/아이콘 | 현재 위치 기준 보기 |
| `semantic.status.gps.bg` | GPS 활성 배경 | GPS 버튼·세그먼트·지역 피커 선택 |
| `semantic.status.gps.border` | GPS 활성 테두리 | |
| `semantic.status.gps.icon` | GPS 아이콘 색 | ActivityIndicator |
| `semantic.status.night.fg` | 심야약국 우선 텍스트/아이콘 | 약국 야간 모드 |
| `semantic.status.night.bg` | 심야 모드 활성 배경 | |
| `semantic.status.night.border` | 심야 모드 활성 테두리 | |
| `semantic.status.night.icon` | 심야 아이콘 색 | |
| `semantic.status.open.*` | 영업 중 | 약국 리스트·배지 |
| `semantic.status.closed.*` | 영업 종료 | |
| `semantic.status.er.*` | 응급실 강조 | ER 카드·홈 퀵메뉴 |

**규칙:** 컴포넌트 내부에 `#dc2626`, `bg-red-50`, `text-blue-700` 등 raw 색상을 직접 쓰지 않는다.  
`useThemedColors().status` 또는 `kemix-*` 시맨틱 클래스를 사용한다.

## 타이포그래피

| 역할 | 크기 | line-height | 최소 사용 |
|------|------|-------------|-----------|
| Display | 28px | 36px | 화면 타이틀 |
| Title | 22px | 30px | 섹션 제목 |
| Headline | 18px | 26px | 카드 제목 |
| Body | 15px | 22px | 본문·버튼 라벨 |
| Caption | 13px | 18px | 보조 설명 |
| Label | 12px | 16px | 필드 라벨만 (본문 버튼 라벨 금지) |

- 본문·터치 라벨: **최소 13px (Caption)** — `text-xs`(12px)는 필드 라벨에만 허용.

## 간격 & 터치

| 토큰 | 값 | 용도 |
|------|-----|------|
| `spacing.screen` | 32px | 화면 좌우 (넓은 화면) |
| `spacing.content` | 16px | 목록·검색바 인셋 |
| `spacing.section` | 12–16px | 블록 간 gap |
| `radius.card` | 16px (`rounded-2xl`) | 카드 |
| `radius.control` | 12px (`rounded-xl`) | 입력·버튼 |
| `radius.pill` | 999px | 칩·세그먼트 |
| **`touch.min`** | **44pt** | 모든 Pressable 최소 높이 |

## 컴포넌트 패턴

### 세그먼트 토글
- **컴포넌트:** `SegmentControl`
- **용도:** 상호 배타적 2~3옵션 (예: 현재 위치 / 심야약국 우선)
- `accessibilityRole="tab"`, `accessibilityState={{ selected }}` 필수

### 지역 검색 바
- **컴포넌트:** `FacilitySearchBarComponent`
- **약국 전용 토글:** `PharmacyViewModeToggle` (SRP — 검색바와 분리)
- **지역 피커:** `RegionPickerModal` — `bg-kemix-elevated`, `text-kemix-text`

### 시설 리스트 카드
- **컴포넌트:** `MedicalFacilityListCard` + `medicalListCardStyles` variant
- variant는 시맨틱 status와 1:1 (`er`, `moonlight`, `pharmacy-night`, `pharmacy-open`)

### 상태 배지 (StatusPill)
- **컴포넌트:** `src/components/ui/StatusPill.tsx`
- **래퍼:** `MedicalFacilityStatusPill` (의료 시설 카드 호환)
- tone: `er` | `night` | `open` | `closed` | `info` | `partner` | `neutral` | `moonlight` | `pediatric`
- 색상은 `useThemedColors().status`에서만 파생

### 홈 화면
- **히어로:** `HomeEmergencyHero` — 응급 퀵메뉴 4종 + 위치 상태 + 응급 정보 CTA
- **케어 리스트:** `HomeCareListCard` + `HomeCommerceCuration`
- 테스트용 대형 이미지 배너는 홈 최상단에 배치하지 않음

## 접근성 체크리스트 (필수)

- [ ] 터치 영역 ≥ 44×44pt
- [ ] 본문 대비 ≥ 4.5:1 (라이트·다크·베이지 각각 확인)
- [ ] 아이콘-only 버튼에 `accessibilityLabel`
- [ ] 로딩 중 `ActivityIndicator` + 비활성 처리
- [ ] 모달 scrim `overlay` 토큰 (40–55% 불투명)

## 금지 사항 (Anti-patterns)

- 이모지를 구조적 아이콘으로 사용
- 화면마다 다른 GPS/야간 강조 색 (red-50 vs amber-50 혼용)
- 라이트 모드 전용 피커 스타일 (`bg-blue-50`)을 다크/베이지에 그대로 적용
- `FacilitySearchBarComponent`에 약국 전용 분기 로직 장기 유지 (→ `PharmacyViewModeToggle`)

## 페이지 오버라이드

화면별 예외는 `design-system/kemix/pages/<screen>.md`에 기록.  
없으면 이 MASTER 문서를 따른다.

---

*최초 생성: 2026-08-13 · ui-ux-pro-max + KEMIX 토큰 정렬*
