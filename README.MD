# EMS_Connect (응급구조사 폐쇄형 커뮤니티 및 대국민 안전 플랫폼)
## 개발 및 기획 프로세스 안내 가이드 (Cursor v2.5 - 마스터 통합본)

본 문서는 개발 툴(Cursor AI)을 활용하여 'EMS_Connect' 모바일 어플리케이션을 단계별로 빌드하기 위한 마스터 기획 흐름도 및 기술 명세서입니다.

---

## 1. 프로젝트 개요 및 기술 스택
- **목적:** 대국민 공공 안전 정보 제공 및 인증된 응급구조사(EMT) 간의 폐쇄형 전문 모바일 앱 생태계 구축.
- **프론트엔드 (앱):** React Native + Expo + NativeWind (React Native용 Tailwind CSS)
- **백엔드/DB:** Supabase (Auth, Database, Storage 사용)
- **개발 언어:** TypeScript (엄격한 정산 데이터 및 권한 처리를 위함)

## [중요] 백엔드 연동 환경 변수 (Supabase Credentials)
- **SUPABASE_URL:** `https://cdkyoeskhrwrpxgbmpqu.supabase.co`
- **SUPABASE_ANON_KEY:** `sb_publishable_2QyLq5Vz-bkp0gMhpPjo9w_wvgIEzMV`

---

## 2. 개발 기획 순서 흐름도 (Step-by-Step Roadmap)

### 단계 1: 프로젝트 초기화 및 Mobile 네이티브 레이아웃 구축
- [ ] **환경 세팅:** React Native + Expo 환경 구성.
- [ ] **하단 탭 내비게이션(Bottom Tab Navigation) 구현:**
  - **일반인 모드(기본 활성화):** [Home/가이드], [Chemical/Drug], [Map], [Rewards] 총 4개의 탭만 하단 바에 노출.
  - **★ 철저한 은폐 로직:** 유저의 역할 상태 값(`profiles.role`)이 `'public'`인 일반 유저일 때는 하단 탭 바에 5번째 PRO 탭이 아예 물리적으로 존재하지 않아야 함 (숨김 처리).
  - **PRO 모드 활성화:** 유저가 인증을 완료하여 역할이 변경되면 (`role === 'emt_certified'`), 하단 탭 바 우측 끝에 5번째 **[PRO] 탭이 마법처럼 생성(조건부 렌더링)**되어 진입할 수 있어야 함.

### 단계 2: 공공 및 공익 API 데이터 연동 (Public 모드 기능 구체화)
국가 공공데이터포털 및 공인 기관 API 연동 스펙을 프론트엔드에 매칭합니다.
- *주의: 초기 개발 단계에서는 실제 외부 API 연동을 미루고, 검색 시 유기적으로 작동하는 가짜 데이터(mockData)를 활용하여 UI 화면 전환 위주로 완성할 것.*
1. **생활 응급처치 가이드 모듈**
   - 심정지(CPR), 기도폐쇄(하임리히), 골절 등 상황별 단계별 카드형 UI 구축.
2. **약물/마약 정보 검색 모듈 (식약처 DB 연동 가상 설계)**
   - 성분명/제품명 검색 기능 및 응급구조사 현장 처치 프로토콜 화면 배치.
3. **위험물/유해화학물질 정보 모듈 (화학물질안전원 API / ERG 기준 가상 설계)**
   - UN 번호 및 물질명 검색. 물질별 유해성 등급, 초기 이격 거리 시각화.
4. **AED 및 실시간 응급실 가동 현황 모듈 (공공데이터포털 API 가상 설계)**
   - 스마트폰 Geolocation API(GPS) 기반 최단 거리 AED 위치 지도 마킹 및 리스트업 뼈대.

### 단계 3: 리워드 및 게이미피케이션 구조 배치 (추후 고도화 대비)
- [ ] **지갑(Wallet) UI 컴포넌트:** 현재 보유 포인트(`wallet_balance`) 대시보드 마크업.
- [ ] **미니게임 탭 구조화:** 걷기 미션, 일일 뽑기, 럭키 로또 등 템플릿 공간 선점 (세부 게임 로직은 뼈대만 구축하고 오늘은 스킵).
- [ ] **보상형 광고(AdMob 등) 스터브 구현:** '광고 보고 포인트 받기' 버튼 배치 및 5초/30초 타이머 시뮬레이션 이벤트 리스너 연결.

### 단계 4: 수파베이스(Supabase) 백엔드 연동 및 회원가입/로그인 구현
상단에 명시된 자격 증명을 사용하여 실시간 인증 및 보안 게이트키핑을 연동합니다.
- [ ] **`supabaseClient.ts` 생성:** URL 및 ANON_KEY 환경 변수를 활용한 클라이언트 초기화.
- [ ] **인증(Auth) 모듈 연동:** 이메일 회원가입 및 로그인 기능 구현 (가입 시 기본 role은 'public').
- [ ] **PRO 공간 진입 장벽 (Gatekeeping):** - 일반인 탭(마이페이지 또는 Rewards 공간 등) 내에 '초대장 코드 입력 및 자격증 업로드' 기능 구현.
  - 자격증 이미지 파일 업로드를 위한 Supabase Storage(버킷명: `verifications`) 연결 뼈대 작성.

---

## 3. 데이터베이스(DB) 확장성 설계 명세 (Supabase PostgreSQL)

```sql
-- 1. 사용자 프로필 및 지갑 관리
CREATE TABLE profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'public' CHECK (role IN ('public', 'emt_certified')),
    is_approved BOOLEAN DEFAULT false,
    invitation_code_used TEXT,
    wallet_balance NUMERIC DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. 응급구조사 자격 인증 관리
CREATE TABLE emt_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. 통합 포인트 트랜잭션 (정산 로그)
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('ad_reward', 'survey_payout', 'group_buy_purchase', 'cash_out')),
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. 정책 설문조사 엔진 (1/N 분배용)
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    total_budget NUMERIC NOT NULL,
    participant_count INTEGER DEFAULT 0,
    max_participants INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. 전문가 검증형 공동구매 관리
CREATE TABLE group_buys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    original_price NUMERIC,
    discount_price NUMERIC NOT NULL,
    min_threshold INTEGER NOT NULL,
    current_orders INTEGER DEFAULT 0,
    status TEXT DEFAULT 'verifying' CHECK (status IN ('verifying', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);