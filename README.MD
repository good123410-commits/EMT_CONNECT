EMS_Connect (v1 - Android Release
Version)
대한민국 응급 의료 지도 및 구급대원 소통을 위한 초경량/고속 하이브리드 플랫폼입니다. v1
단계에서는 구글 플레이 스토어의 심사 허들을 최소화하고 빠른 출시를 달성하기 위해 '정보
제공 및 단순 수동 승인형 소통' 기능 위주로 슬림하게 구성하며, 직접 결제가 일어나는
비즈니스/매칭 기능 및 민감한 자동 인증 기능은 v2 업데이트로 보류합니다.

1. 프로젝트 개요 및 기술 스택
   ● 목적: 대국민 공공 안전 정보 제공 및 인증된 응급구조사(EMT) 간의 폐쇄형 전문 모바일
   앱 생태계 구축
   ● 프론트엔드 (앱): React Native + Expo + NativeWind (React Native용 Tailwind CSS)
   ● 백엔드/DB: Supabase (Auth, Database, Storage 사용)
   ● 개발 언어: TypeScript (엄격한 데이터 및 권한 처리를 위함)
   [중요] 백엔드 연동 환경 변수 (Supabase Credentials)
   SUPABASE_URL: https://cdkyoeskhrwrpxgbmpqu.supabase.co
   SUPABASE_ANON_KEY: sb_publishable_2QyLq5Vz-bkp0gMhpPjo9w_wvgIEzMV

2. 개발 기획 순서 흐름도 (v1 출시 특화 로드맵)
   단계 1: 프로젝트 초기화 및 Mobile 네이티브 레이아웃 구축
   ● 하단 탭 내비게이션(Bottom Tab Navigation) 구현:
   ○ 일반인 모드(기본 활성화): [Home/가이드], [Chemical/Drug], [Map], [Rewards] 총
   4개의 탭만 하단 바에 노출.
   ○ 철저한 은폐 및 조건부 렌더링 로직: 유저의 역할 상태 값(profiles.role)이 'public'인
   일반 유저일 때는 하단 탭 바에 5번째 PRO 탭이 아예 물리적으로 존재하지 않아야
   함 (숨김 처리).
   ○ PRO 모드(구급대원) 활성화: 유저가 인증되어 역할이 변경되면 (role ===
   'emt_certified'), 하단 탭 바 우측 끝에 5번째 [PRO] 탭이 마법처럼 생성(조건부
   렌더링)되어 진입할 수 있어야 함.

단계 2: 공공 및 공익 API 데이터 연동 (v1 정보 제공 중심)
초기 개발 및 구글 심사 패스를 위해, 복잡한 실시간 통신 대신 고속 검색이 가능하도록
최적화된 로컬 모의 데이터(mockData)를 적극 활용하여 UI 화면 전환 위주로 먼저 완성합니다.
● 생활 응급처치 가이드 모듈: 심정지(CPR), 기도폐쇄(하임리히), 골절 등 상황별 단계별

카드형 UI 구축 (검색 기능 지원).
● 약물/마약 정보 검색 모듈: 성분명/제품명 검색 기능 및 응급구조사 현장 처치 프로토콜
화면 배치.
● 위험물/유해화학물질 정보 모듈: UN 번호 및 물질명 검색. 물질별 유해성 등급, 초기 이격
거리 시각화.
● 초고속 응급 지도 모듈 (AED 및 실시간 응급실, 약국 정보):
○ 스마트폰 Geolocation API(GPS) 기반 최단 거리 지도 마킹.
○ 대용량 마커 렌더링 시 지연 로딩(Lazy Loading) 및 클러스터링을 적용하여 렉 없이
쌩쌩하게 돌아가는 렌더링 성능 확보.
● 사설구급차 매칭 우회 (전화 연결 대체): v1에서는 규제와 심사 지연을 피하기 위해
실시간 입찰/결제 매칭 시스템을 과감히 제거하고, 내 주변 구급차 업체의 목록을
보여주며 클릭 시 [즉시 전화 걸기(Call)]로 연결되는 단순 전화번호부 형태로 구현.
단계 3: 리워드 및 게이미피케이션 구조 배치 (추후 고도화 대비)
● 지갑(Wallet) UI 컴포넌트: 현재 보유 포인트(wallet_balance) 대시보드 마크업.
● 미니게임 탭 구조화: 걷기 미션, 일일 뽑기, 럭키 로또 등 템플릿 공간 선점.
● 보상형 광고 스터브 구현: '광고 보고 포인트 받기' 버튼 배치 및 타이머 시뮬레이션
이벤트 리스너 연결.
단계 4: 수파베이스(Supabase) 백엔드 연동 및 회원가입/로그인
● supabaseClient.ts 생성: 제공된 URL 및 ANON_KEY 환경 변수를 활용한 클라이언트
초기화.
● 인증(Auth) 모듈 연동: 이메일 회원가입 및 로그인 기능 구현 (가입 시 기본 role은
'public').
● 구급대원 수동 승인 프로세스 (구글 심사 우회 신의 한 수):
○ 구글의 엄격한 보안 검열을 피하기 위해 앱 내부에서 직접 주민번호나 면허 번호가
노출된 면허증 사진을 직접 업로드하는 민감한 프로세스를 v1에서는 제거합니다.
○ 사용자가 [승인 요청]을 누르면 앱 내에 별도 수집 없이 관리자 페이지의 대기
목록에만 추가되도록 처리하고, 실제 서류 검증은 외부 링크(구글 폼 등)나 이메일
접수로 우회 안내합니다.
○ 대표님(관리자)이 요청 목록에서 [승인] 버튼을 누르면 DB의 role이
'emt_certified'로 변경되면서 5번째 [PRO] 탭이 렌더링됩니다.

3. 데이터베이스(DB) 확장성 설계 명세 (Supabase
   PostgreSQL)
   -- 1. 사용자 프로필 및 지갑 관리
   CREATE TABLE profiles (
   id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
   name TEXT,
   role TEXT DEFAULT 'public' CHECK (role IN ('public',
   'emt_certified')),
   is_approved BOOLEAN DEFAULT false,

invitation_code_used TEXT,
wallet_balance NUMERIC DEFAULT 0.00,
created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
NOW())
);
-- 2. 응급구조사 자격 인증 관리 (수동 심사 지원 구조)
CREATE TABLE emt_verifications (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
document_url TEXT NOT NULL,
status TEXT DEFAULT 'pending' CHECK (status IN ('pending',
'approved', 'rejected')),
reviewer_notes TEXT,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
NOW())
);
-- 3. 통합 포인트 트랜잭션 (정산 로그)
CREATE TABLE point_transactions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
amount NUMERIC NOT NULL,
type TEXT CHECK (type IN ('ad_reward', 'survey_payout',
'group_buy_purchase', 'cash_out')),
reference_id UUID,
created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
NOW())
);
-- 4. 정책 설문조사 엔진 (1/N 분배용)
CREATE TABLE surveys (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
title TEXT NOT NULL,
total_budget NUMERIC NOT NULL,
participant_count INTEGER DEFAULT 0,
max_participants INTEGER NOT NULL,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
NOW())
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
status TEXT DEFAULT 'verifying' CHECK (status IN ('verifying',
'active', 'completed', 'cancelled')),
created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text,
NOW())
);

🚨 구글 플레이 스토어 심사 통과 대비 체크리스트
● 심사용 프리패스 테스트 계정: 수동 승인 단계를 거치지 않고 바로 '구급대원 전용 PRO
탭' 내부를 탐색할 수 있도록, 미리 role === 'emt_certified' 상태로 설정된 심사용 전용
계정을 구글에 제출해야 합니다.
● 면책 조항 필수 배치: "본 앱은 의학적 진단이나 조언을 대신할 수 없으며, 응급 상황 시
즉시 119에 신고하십시오"라는 면책 조항을 메인 및 지도 하단 등에 상시 노출하여
구글의 의료 정책 반려 사유를 방지합니다.
