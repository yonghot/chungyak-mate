# 청약플러스 디자인 시스템

## 1. 디자인 철학 및 원칙

**시각적 아이덴티티**: "내 청약 경쟁력에 +를 더하는, 명확하고 신뢰감 있는 인터페이스"

### 디자인 원칙

1. **명확함 > 화려함**: 청약 정보는 정확한 전달이 최우선. 불필요한 장식 배제, 데이터 중심 UI
2. **신뢰감**: 금융/부동산 서비스에 어울리는 안정적 톤. 블루 계열 컬러와 일관된 레이아웃으로 전문성 전달
3. **일관성**: shadcn/ui 기반 통일된 컴포넌트 사용. 동일 패턴의 반복으로 학습 비용 최소화
4. **접근성**: 정보 밀도가 높은 서비스이므로 가독성 최우선. 충분한 대비, 명확한 계층 구조

---

## 2. 디자인 기술 스택

### shadcn/ui 기본 컴포넌트

| 카테고리 | 컴포넌트 |
|---------|----------|
| 입력 | Button, Input, Select, Calendar, Form, Label |
| 표시 | Card, Badge, Table, Progress, Skeleton, Avatar |
| 피드백 | Dialog, Toast(sonner), Alert, Tooltip |
| 레이아웃 | Tabs, Separator, Sheet, Accordion |
| 네비게이션 | NavigationMenu, DropdownMenu |

### 커스텀 컴포넌트

| 컴포넌트 | 용도 | 기반 |
|---------|------|------|
| `EligibilityBadge` | 적격/부적격/조건부 상태 표시 | Badge 확장 |
| `ScoreCard` | 청약 가점 항목별 점수 표시 | Card 확장 |
| `ProfileCard` | 사용자 청약 프로필 요약 | Card 확장 |

### +가치 분석 컴포넌트 (`components/features/value-analysis/`)

| 컴포넌트 | 용도 | 주요 Props |
|---------|------|-----------|
| `ValueGradeBadge` | A~F 등급 배지 (컬러 코딩) | grade, size |
| `ValueScoreCard` | 총점 요약 카드 (등급 + 점수 + 출처 + 신뢰도) | grade, totalScore, dataSource, confidence |
| `CategoryBreakdown` | 3대 카테고리 가중 점수 막대 차트 (펼침/접힘) | categories |
| `FactorList` | 11개 세부 팩터 점수 + 데이터 확보 상태 + 트렌드 | factors |

### 데이터 시각화 컴포넌트 (`components/ui/`)

| 컴포넌트 | 용도 | 주요 Props |
|---------|------|-----------|
| `TrendBadge` | 시세 방향성 배지 (▲상승/▼하락/─보합) | direction |
| `DataSourceBadge` | 데이터 출처 + 기준일 표시 | dataSource |
| `Collapsible` | 펼침/접힘 컨테이너 (React Context 기반) | open, onOpenChange |

### 모션 컴포넌트 (`components/ui/motion.tsx`)

| 컴포넌트 | 용도 | 주요 Props |
|---------|------|-----------|
| `FadeInUp` | 아래→위 페이드인 (whileInView) | delay, duration, once |
| `FadeIn` | 단순 페이드인 (whileInView) | delay, duration, once |
| `ScaleIn` | 스케일+페이드인 (whileInView) | delay, duration, once |
| `StaggerContainer` | 자식 순차 등장 래퍼 | staggerDelay, once |
| `StaggerItem` | StaggerContainer 내부 아이템 | className |
| `HoverLift` | 호버 시 리프트+스케일 | y(-4), scale(1.02) |
| `PageTransition` | 페이지 진입 애니메이션 | className |

### 사용하지 않는 컴포넌트

- `Carousel` — 청약 서비스에 슬라이드 UI 불필요
- `Menubar` — 네비게이션에 사용하지 않음 (모바일 탭바 + 데스크톱 사이드바 구조)

### 기타 스택

| 항목 | 선택 | 비고 |
|------|------|------|
| CSS | Tailwind CSS | 커스텀 테마 확장 |
| 아이콘 | lucide-react | shadcn/ui 기본 아이콘 세트 |
| 폰트 | Pretendard | 한글+영문 통합, CDN 로드 |
| 애니메이션 | framer-motion + Tailwind animate | 페이지 전환, 스크롤 등장, 호버 리프트, 순차 등장 |

---

## 3. 컬러 시스템

shadcn/ui의 CSS 변수(HSL) 방식으로 정의. 라이트 모드 우선 (다크모드는 MVP 이후).

### 기본 컬러

```css
:root {
  /* Primary — 블루 계열 (신뢰, 안정) */
  --primary: 217 91% 50%;           /* #1570EF — 메인 블루 */
  --primary-foreground: 0 0% 100%;  /* 흰색 텍스트 */

  /* Secondary — 슬레이트 계열 (보조) */
  --secondary: 215 20% 95%;         /* #F0F2F5 — 연한 슬레이트 */
  --secondary-foreground: 215 25% 27%; /* #344054 — 짙은 슬레이트 */

  /* Accent — 그린 계열 (적격/성공 강조) */
  --accent: 152 69% 41%;            /* #22A065 — 적격 그린 */
  --accent-foreground: 0 0% 100%;   /* 흰색 텍스트 */

  /* 배경 */
  --background: 0 0% 100%;          /* #FFFFFF */
  --foreground: 215 25% 15%;        /* #1D2939 — 본문 텍스트 */

  /* 뮤트 */
  --muted: 215 20% 96%;             /* #F2F4F7 */
  --muted-foreground: 215 16% 47%;  /* #667085 */

  /* 카드 */
  --card: 0 0% 100%;
  --card-foreground: 215 25% 15%;

  /* 보더 */
  --border: 215 20% 88%;            /* #D0D5DD */
  --input: 215 20% 88%;
  --ring: 217 91% 50%;              /* primary와 동일 */

  /* 라디우스 */
  --radius: 0.5rem;                 /* 8px */
}
```

### 시맨틱 컬러

| 상태 | HSL | HEX | 용도 |
|------|-----|-----|------|
| Success | `152 69% 41%` | #22A065 | 적격 판정, 완료, 긍정적 결과 |
| Error | `0 72% 51%` | #D92D20 | 부적격 판정, 오류, 필수 입력 누락 |
| Warning | `38 92% 50%` | #F59E0B | 조건부 적격, 주의사항, 기한 임박 |
| Info | `217 91% 50%` | #1570EF | 안내, 도움말, 추가 정보 |

### +가치 등급별 컬러 매핑

| 등급 | 배경색 | 텍스트색 | 보더색 | 의미 |
|------|--------|----------|--------|------|
| A | `bg-emerald-100` | `text-emerald-700` | `border-emerald-200` | 적극 권장 |
| B | `bg-blue-100` | `text-blue-700` | `border-blue-200` | 권장 |
| C | `bg-sky-100` | `text-sky-700` | `border-sky-200` | 보통 |
| D | `bg-yellow-100` | `text-yellow-700` | `border-yellow-200` | 주의 |
| E | `bg-orange-100` | `text-orange-700` | `border-orange-200` | 비권장 |
| F | `bg-red-100` | `text-red-700` | `border-red-200` | 기회 소진 경고 |

팩터 점수 비율별 텍스트색: ≥80% `text-emerald-600`, ≥60% `text-blue-600`, ≥40% `text-yellow-600`, ≥20% `text-orange-500`, <20% `text-red-500`

### 적격 상태별 컬러 매핑

| 상태 | 배지 색상 | 카드 좌측 보더 | 배경 (연한) |
|------|----------|---------------|------------|
| 적격 | Success Green | `border-l-4 border-green-500` | `bg-green-50` |
| 부적격 | Error Red | `border-l-4 border-red-500` | `bg-red-50` |
| 조건부 | Warning Amber | `border-l-4 border-amber-500` | `bg-amber-50` |

---

## 4. 타이포그래피

### 폰트

- **기본 폰트**: Pretendard (CDN 로드)
- **폴백**: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **코드**: "JetBrains Mono", monospace (필요 시)

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.min.css');

:root {
  --font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### 사이즈 스케일

| 레벨 | 크기 | px | 용도 |
|------|------|----|------|
| display | 3.75rem | 60px | 히어로 타이틀 (6xl) |
| display-sm | 3rem | 48px | 히어로 서브 타이틀 (5xl) |
| h1 | 2.25rem | 36px | 페이지 타이틀 |
| h2 | 1.875rem | 30px | 섹션 타이틀 |
| h3 | 1.5rem | 24px | 서브 섹션 |
| h4 | 1.25rem | 20px | 카드 타이틀 |
| body | 1rem | 16px | 본문 |
| sm | 0.875rem | 14px | 보조 텍스트, 레이블 |
| xs | 0.75rem | 12px | 캡션, 뱃지 텍스트 |

### 자간/행간

| 속성 | 값 | 적용 |
|------|-----|------|
| letter-spacing | -0.02em | 전체 (한글 최적) |
| line-height | 1.6 | 본문 |
| line-height | 1.3 | 제목 (h1~h4) |

### 폰트 웨이트

| 웨이트 | 값 | 용도 |
|--------|-----|------|
| Regular | 400 | 본문 |
| Medium | 500 | 레이블, 강조 텍스트 |
| Semibold | 600 | 서브 타이틀, 버튼 |
| Bold | 700 | 타이틀, 숫자 강조 |

---

## 5. 스페이싱 및 레이아웃

### 스페이싱 스케일 (4px 기반)

| 토큰 | 값 | 용도 |
|------|-----|------|
| 0.5 | 2px | 미세 간격 |
| 1 | 4px | 아이콘-텍스트 간격 |
| 2 | 8px | 인라인 요소 간격 |
| 3 | 12px | 컴팩트 패딩 |
| 4 | 16px | 기본 패딩, 카드 내부 |
| 5 | 20px | 섹션 내부 여백 |
| 6 | 24px | 카드 패딩, 섹션 간격 |
| 8 | 32px | 섹션 간 구분 |
| 10 | 40px | 페이지 섹션 간격 |
| 12 | 48px | 대형 섹션 간격 |
| 16 | 64px | 페이지 상하 여백 |

### 레이아웃

| 속성 | 값 | 비고 |
|------|-----|------|
| 컨테이너 최대 너비 | 1280px | 데스크톱 기준 |
| 컨테이너 패딩 | 16px (모바일) / 24px (데스크톱) | 좌우 여백 |
| 사이드바 너비 | 240px (데스크톱) | 접힌 상태 64px |
| 하단 탭바 높이 | 56px (모바일) | safe-area 고려 |

### 반응형 브레이크포인트

| 이름 | 값 | 대상 |
|------|-----|------|
| sm | 640px | 소형 모바일 |
| md | 768px | 태블릿 / 대형 모바일 |
| lg | 1024px | 소형 데스크톱 |
| xl | 1280px | 데스크톱 |

모바일 우선(mobile-first) 접근. 기본 스타일은 모바일, `md:` 이상에서 데스크톱 레이아웃 적용.

---

## 6. 컴포넌트 스타일 가이드

### Button

| Variant | 용도 | 비고 |
|---------|------|------|
| default | 주요 액션 (진단 시작, 저장) | primary 컬러 |
| destructive | 삭제, 초기화 | 빨간색 |
| outline | 보조 액션 | 보더만 |
| secondary | 덜 중요한 액션 | 슬레이트 배경 |
| ghost | 인라인 액션 | 배경 없음 |
| link | 텍스트 링크 | 밑줄 |

| Size | 높이 | 용도 |
|------|------|------|
| sm | 32px | 테이블 내 버튼, 보조 |
| default | 40px | 일반 버튼 |
| lg | 48px | CTA 버튼, 모바일 주요 액션 |

### Input / Form

- shadcn/ui `Form` + `react-hook-form` + `zod` 조합
- 에러 메시지: `text-red-500 text-sm`, 인풋 하단에 표시
- 필수 필드: 레이블 옆 빨간 별표 `*`
- 인풋 높이: 40px (default), 포커스 시 `ring-2 ring-primary`
- 비활성: `opacity-50 cursor-not-allowed`

### Card

- 둥근 모서리: `rounded-xl` (12px) — 업그레이드
- 그림자: `shadow-md` (기본), `shadow-lg` (호버 시)
- 패딩: `p-6` (24px)
- 호버 효과: `HoverLift` 래퍼 (y=-4, scale=1.02) + `shadow-xl` 전환
- 상단 그라데이션 바: `h-1.5 bg-gradient-to-r` (상태별 색상 강도 변화)
- **판정 결과 카드**: 좌측 보더 4px로 상태 표시

```
적격:    border-l-4 border-green-500 bg-green-50/50
부적격:  border-l-4 border-red-500 bg-red-50/50
조건부:  border-l-4 border-amber-500 bg-amber-50/50
```

### Dialog / Modal

- 오버레이: `bg-black/50 backdrop-blur-sm`
- 최대 너비: `max-w-[425px]`
- 패딩: `p-6`
- 둥근 모서리: `rounded-lg`
- 닫기: 우상단 X 버튼 + 오버레이 클릭

### Toast (sonner)

- 위치: 우하단 (`bottom-right`)
- 지속 시간: 5초
- 타입별 아이콘/색상 자동 적용 (success, error, warning, info)

### Table

- 용도: 단지 목록, 청약 일정, 가점 내역
- 호버: `hover:bg-muted/50` 행 강조
- 헤더: `sticky top-0 bg-background` 고정
- 정렬: 좌측 정렬 기본, 숫자는 우측 정렬

### Navigation

| 환경 | 구조 | 비고 |
|------|------|------|
| 모바일 | 하단 탭바 (4~5개 탭) | 글래스모피즘, 상단 인디케이터 |
| 데스크톱 | 좌측 사이드바 | 좌측 보더 활성 인디케이터 |
| 헤더 | 상단 바 | 글래스모피즘 (`bg-background/80 backdrop-blur-md`) |

**글래스모피즘 패턴** (헤더/모바일 탭바):
- `bg-background/80 backdrop-blur-md border-b`
- 반투명 배경으로 아래 콘텐츠가 은은하게 비침

**사이드바 활성 상태**:
- 좌측 보더 인디케이터: `w-0.5 bg-primary rounded-full`
- 활성 링크: `bg-primary/5 text-primary font-medium`
- 비활성 호버: `opacity-0 → opacity-100` 전환

**모바일 탭바 활성 상태**:
- 상단 인디케이터: `h-0.5 bg-primary` 라인
- 활성 탭: `text-primary scale-110` 트랜지션

탭바 아이콘 (lucide-react, 5탭 구성):
- 홈: `Home` → `/complexes`
- 추천: `Star` → `/recommend`
- +가치: `BarChart3` → `/value`
- 프로필: `User` → `/profile`
- 알림: `Bell` → `/notifications`

사이드바 메뉴 항목:
- 홈(단지 목록): `Home` → `/complexes`
- 맞춤추천: `Star` → `/recommend`
- +가치: `BarChart3` → `/value`
- 프로필: `User` → `/profile`
- 알림: `Bell` → `/notifications`

### Badge (EligibilityBadge)

| 상태 | 스타일 | 텍스트 |
|------|--------|--------|
| 적격 | `bg-green-100 text-green-700 border-green-200` | 적격 |
| 부적격 | `bg-red-100 text-red-700 border-red-200` | 부적격 |
| 조건부 | `bg-amber-100 text-amber-700 border-amber-200` | 조건부 |
| 미확인 | `bg-gray-100 text-gray-700 border-gray-200` | 미확인 |

### ScoreCard

- 항목별 점수 표시: 무주택 기간, 부양가족 수, 청약통장 가입 기간
- 총점 강조: `text-2xl font-bold text-primary`
- 만점 대비 비율: `Progress` 컴포넌트 활용
- 각 항목은 `Accordion`으로 상세 기준 확인 가능

### Skeleton

- 데이터 로딩 시 모든 카드/테이블에 스켈레톤 적용
- `animate-pulse` + `bg-muted rounded`
- 각 페이지별 전용 스켈레톤 컴포넌트 (카드 구조와 동일한 레이아웃)

### 빈 상태 (Empty State)

- 중앙 정렬 레이아웃: `flex flex-col items-center justify-center`
- 대형 아이콘: `h-16 w-16 rounded-full bg-muted` 안에 `h-8 w-8 text-muted-foreground`
- 제목 + 설명 + CTA 버튼 구조
- 배경: `rounded-xl bg-muted/30 px-6 py-16`

### 에러 상태 (Error State)

- 아이콘: `AlertTriangle` in `bg-destructive/10 rounded-full`
- 메시지: `text-destructive font-medium`
- 재시도 버튼: `Button variant="outline" size="sm"`
- 배경: `rounded-xl border border-destructive/30 bg-destructive/5`

---

## 7-1. 마이크로 인터랙션 가이드

### 페이지 전환 (`PageTransition`)
- `opacity: 0 → 1`, `y: 12 → 0`
- `duration: 0.3s`, `ease: easeOut`
- 모든 P0 페이지에 적용

### 스크롤 등장 (`FadeInUp`, `FadeIn`, `ScaleIn`)
- `whileInView` + `viewport={{ once: true, margin: '-50px' }}`
- 기본 duration: 0.5s, delay: 0~0.2s (캐스케이딩)
- 프로필 페이지: 섹션별 0/0.1/0.15/0.2s 딜레이로 순차 등장

### 순차 등장 (`StaggerContainer` + `StaggerItem`)
- 카드 목록, 알림 목록 등에 적용
- `staggerDelay`: 0.06~0.1s (목록 길이에 따라 조절)
- 카드 목록: 0.08s, 알림 목록: 0.06s

### 호버 리프트 (`HoverLift`)
- 카드 컴포넌트에 적용: `y: -4px`, `scale: 1.02`
- `whileTap: scale(0.98)` (터치 피드백)
- `transition: 0.2s`

### 모바일 메뉴 (`AnimatePresence`)
- 헤더 모바일 메뉴: 드롭다운 진입/퇴장 애니메이션
- `opacity + height` 전환

---

## 7. 레퍼런스

| 서비스 | URL | 참고 포인트 |
|--------|-----|------------|
| 청약홈 | https://www.applyhome.co.kr | 기능/데이터 구조 참고 (UI는 반면교사) |
| 토스 | https://toss.im | 금융 UI/UX, 깔끔한 정보 전달, 단계별 플로우 |
| 뱅크샐러드 | https://banksalad.com | 금융 상품 비교 UI, 카드형 레이아웃 |
| 직방 | https://www.zigbang.com | 부동산 정보 레이아웃, 지도 기반 탐색 |
| richgo.ai | https://richgo.ai | 부동산 AI 분석 UI, 시세 데이터 시각화, 마이크로 인터랙션, 세밀한 radius 스케일 |

---

## 7-2. 랜딩 페이지 구조

1. **스티키 네비게이션**: backdrop-blur, 스크롤 시 고정
2. **히어로 섹션**: 그라데이션 배경 (`from-blue-50 via-white to-emerald-50/30`), 6xl 그라데이션 타이틀, 듀얼 CTA, HeroVisual (3장 겹침 카드 프리뷰)
3. **통계 섹션**: 4개 수치 카운터 (`StaggerContainer`)
4. **기능 섹션**: 3개 HoverLift 카드 + 컬러 코딩된 아이콘
5. **체크리스트 섹션**: 2열 그리드, 6개 분석 항목
6. **CTA 섹션**: 블루 그라데이션 카드 + 화이트 버튼
7. **푸터**: 3열 레이아웃

## 7-3. 인증 페이지 구조

- **데스크톱**: 2분할 (좌: 브랜드 그라데이션 패널 + 기능 카드 + 통계, 우: 폼)
- **모바일**: 로고 중앙 + 폼
- 폼: `Card` + `CardHeader` + `CardContent` + `CardFooter` (shadcn/ui)
- 입력: shadcn/ui `Input` + `Label`, 에러 시 `AlertCircle` 아이콘
- 로딩: `Loader2` 스피너 + 버튼 비활성

---

## 9. 경쟁사 디자인 분석 — richgo.ai

> richgo.ai는 AI 기반 부동산 분석 서비스로, 청약플러스와 같은 부동산 데이터 도메인에 속한다.
> 아래 분석은 청약플러스의 +예측/+보호 기능 구현 시 적용 가능한 패턴을 중심으로 정리한다.

### 9.1 컬러 시스템 비교

| 항목 | richgo.ai | 청약플러스 | 비고 |
|------|-----------|-----------|------|
| Primary | `#0087FF` (순수 블루) | `#1570EF` (약간 짙은 블루) | 청약플러스가 더 진중한 톤 |
| 배경 Primary | `#FFFFFF` | `#FFFFFF` | 동일 |
| 배경 Secondary | `#F3F7FA` | `#F0F2F5` (`--secondary`) | 유사 (richgo가 약간 더 차가움) |
| 텍스트 Primary | `#21232B` | `#1D2939` | 유사한 짙은 다크 |
| 텍스트 Tertiary | `rgba(33,35,43,0.32)` | `#667085` (`--muted-foreground`) | richgo가 투명도 방식으로 더 유연 |
| 시세 상승 | `#00BC71` (선명한 그린) | `#22A065` (더 짙은 그린) | richgo가 채도 높음, 눈에 잘 띔 |
| 시세 하락 | `#FF0048` (선명한 레드) | `#D92D20` (다크 레드) | richgo가 경고감 강함 |
| Primary 배경 강조 | `rgba(0,135,255,0.06)` | 별도 정의 없음 | 청약플러스에 적용 검토 필요 |

**청약플러스 적용 포인트**: `rgba(0,135,255,0.06)` 수준의 극도로 연한 Primary 배경색은 카드 활성 상태, 선택된 필터, 현재 탐색 중인 항목 강조에 활용할 수 있다. `--primary/6` 형태로 CSS 변수에 추가한다.

### 9.2 데이터 시각화 컬러 시스템 — +예측 기능 적용

richgo.ai는 시세 방향성을 색상 하나로 즉각 전달하는 이분법적 컬러 체계를 사용한다. +예측 기능의 가격 트렌드 표시에 동일 원칙을 적용한다.

#### 방향성 컬러 정의

| 상태 | richgo.ai 값 | 청약플러스 적용값 | Tailwind 클래스 | 용도 |
|------|-------------|----------------|----------------|------|
| 상승 / 긍정 | `#00BC71` | `#00BC71` (richgo 값 그대로) | `text-emerald-500` 근사 | 가격 상승률, 시세 상승 화살표, 수익 예상 |
| 하락 / 부정 | `#FF0048` | `#FF0048` (richgo 값 그대로) | `text-rose-500` 근사 | 가격 하락률, 시세 하락 화살표, 손실 경고 |
| 보합 / 중립 | — | `#667085` (`--muted-foreground`) | `text-muted-foreground` | 횡보, 변동 없음 |

> **주의**: 이 컬러는 기존 시맨틱 컬러(Success/Error)와 분리 운영한다. 적격/부적격 판정에는 기존 `Success Green (#22A065)` / `Error Red (#D92D20)`를 유지한다. 데이터 방향성 표시 전용으로만 richgo 값을 사용한다.

#### 방향성 컬러 CSS 변수 추가 (제안)

```css
:root {
  /* 데이터 방향성 — +예측 기능 전용 */
  --trend-up: 153 100% 37%;      /* #00BC71 — 시세 상승 */
  --trend-down: 345 100% 50%;    /* #FF0048 — 시세 하락 */
  --trend-neutral: 215 16% 47%;  /* #667085 — 보합 */
}
```

#### 방향성 배지 스타일 (shadcn Badge 확장)

```
상승:  bg-emerald-50 text-[#00BC71] border-emerald-200  + ↑ 아이콘
하락:  bg-rose-50 text-[#FF0048] border-rose-200        + ↓ 아이콘
보합:  bg-gray-50 text-muted-foreground border-gray-200  + → 아이콘
```

### 9.3 Border Radius 스케일 보강

richgo.ai의 8단계 radius 스케일은 청약플러스의 단일 `--radius: 0.5rem` 정의보다 세밀하다.

| 단계 | richgo.ai (px) | 청약플러스 매핑 | Tailwind 클래스 | 적용 대상 |
|------|---------------|---------------|----------------|----------|
| XXSmall | 2px | `rounded-sm` 미만 | `rounded-[2px]` | 인라인 코드 태그, 뱃지 내부 상태 도트 |
| XSmall | 4px | `rounded` (4px) | `rounded` | 작은 배지, 태그, 입력 필드 하이라이트 |
| Small | 6px | `rounded-md` 근사 | `rounded-[6px]` | 버튼 sm, 선택된 필터 칩 |
| Medium | 8px | `rounded-lg` (8px) = `--radius` | `rounded-lg` | 기본 버튼, 입력 필드, 소형 카드 |
| Large | 12px | `rounded-xl` (12px) | `rounded-xl` | 일반 카드, 다이얼로그 |
| XLarge | 16px | `rounded-2xl` (16px) | `rounded-2xl` | 히어로 카드, 대형 모달 |
| XXLarge | 20px | `rounded-[20px]` | `rounded-[20px]` | 랜딩 섹션 배경 블록 |
| Full | 999px | `rounded-full` | `rounded-full` | 알림 도트, 아바타, 태그 칩 |

**현재 청약플러스 사용 패턴 vs 보강 방향**:
- 현재: 카드 `rounded-xl`, 버튼 `rounded-md`, 배지 `rounded-full`로만 구분
- 보강: 필터 칩/태그에 `rounded-[6px]`, 대형 랜딩 블록에 `rounded-2xl`, 랜딩 배경 강조에 `rounded-[20px]` 세분화 적용

### 9.4 구분선(Separator) 시스템 보강

richgo.ai는 구분선에 단계별 투명도를 적용하여 정보 계층을 세밀하게 표현한다.

| 단계 | richgo.ai 값 | 청약플러스 적용 | 용도 |
|------|-------------|---------------|------|
| Primary | `rgba(100,129,158,0.20)` | `border-border` (현재 `#D0D5DD`) | 카드 간 구분, 섹션 경계 |
| Secondary | `rgba(100,129,158,0.12)` | `border-border/60` | 카드 내부 항목 구분 |
| Tertiary | `rgba(100,129,158,0.08)` | `border-border/40` | 극도로 연한 내부 그루핑 선 |

shadcn `Separator` 컴포넌트에 `data-intensity` prop을 추가하거나, Tailwind `opacity` 조합으로 구현한다.

```
카드 간:     <Separator className="opacity-100" />          /* border-border */
카드 내부:   <Separator className="opacity-60" />           /* border-border/60 */
소그룹 내:   <Separator className="opacity-40" />           /* border-border/40 */
```

### 9.5 마이크로 인터랙션 패턴 — richgo.ai 참고

richgo.ai의 인터랙션 패턴 중 청약플러스에 적용 가능한 것을 정리한다.

#### 지도 마커 등장 (pinIntro)

```
transform: scale(0) → scale(1)
duration: 0.26s
easing: ease-out
```

청약플러스 적용: `/complexes` 지도 뷰(추후) 또는 단지 카드 리스트 첫 등장 시 유사 패턴 사용 가능. 현재 `ScaleIn` 컴포넌트(`framer-motion`)로 근사 구현 가능.

#### 탄성 호버 (Marker Hover)

```
transform: scale(1.1)
filter: contrast(1.2)
easing: cubic-bezier(0.175, 0.885, 0.155, 1.465)  /* Back easing — 튕기는 느낌 */
```

청약플러스 현재: `HoverLift`는 `y(-4) + scale(1.02)`의 차분한 리프트. richgo의 탄성 easing은 지도 마커나 알림 뱃지처럼 "주의를 끌어야 하는" 요소에만 선택적으로 적용한다.

| 인터랙션 | 현재 (`HoverLift`) | richgo 스타일 적용 대상 |
|---------|-------------------|----------------------|
| 일반 카드 호버 | `y(-4) scale(1.02)` 유지 | 변경 없음 |
| 알림 뱃지 등장 | — | `scale(0) → scale(1)`, 탄성 easing |
| 중요 CTA 버튼 호버 | `scale(1.02)` | 탄성 easing 검토 |

#### 바운스 루프 (danjiMarkerBounce)

```
translateY(0) ↔ translateY(-6px)
반복 애니메이션
```

청약플러스 적용: 사용자가 주목해야 할 알림(청약 마감 D-1 등)의 Bell 아이콘에 적용 검토.

#### 슬라이드업 패널 (previewIntro)

```
bottom: -150px → 0px
```

청약플러스 적용: 모바일에서 단지 상세 미리보기 Sheet(`shadcn Sheet`)의 진입 애니메이션과 동일 패턴. 현재 shadcn `Sheet`의 기본 slide-in 동작으로 이미 유사하게 구현되어 있음.

### 9.6 카드 디자인 패턴 비교

| 속성 | richgo.ai | 청약플러스 현재 | 검토 |
|------|-----------|--------------|------|
| 배경 | `#fff` | `#fff` | 동일 |
| 테두리 | `1px solid #aaa` | `border` (`#D0D5DD`) | richgo가 약간 더 진함. 청약플러스 유지 |
| Shadow | `0 0 10px rgba(0,0,0,0.16)` | `shadow-md` | richgo가 blur 방식의 균등한 그림자. `shadow-md`로 커버 가능 |
| Border Radius | 10px | `rounded-xl` (12px) | 청약플러스가 약간 더 둥근 편. 현재 유지 |
| white-space | `nowrap` (카드 내 데이터 수치) | 별도 정의 없음 | 가격/면적 수치 텍스트에 `whitespace-nowrap` 적용 권장 |

**신규 적용 권장**: 카드 내 숫자 데이터(가격, 면적, 경쟁률 등)에 `whitespace-nowrap` 추가. 좁은 화면에서 수치가 줄바꿈되어 읽기 어려워지는 문제를 방지한다.

### 9.7 스크롤바 스타일 (선택적 적용)

richgo.ai는 커스텀 스크롤바로 시각적 완성도를 높인다. 청약플러스의 데이터 목록(단지 목록, 알림 목록 등)에 선택적으로 적용한다.

```css
/* 데이터 목록 패널 전용 커스텀 스크롤바 */
.custom-scrollbar::-webkit-scrollbar {
  width: 7px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #fff;
  border: 1px solid var(--border);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(134, 151, 178, 0.5);
  border-radius: 3.5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #5e7ade;
}
```

적용 대상: 사이드바 메뉴 스크롤 영역, 단지 목록 패널, 알림 목록 패널.

### 9.8 폰트 시스템 비교 및 보완

| 항목 | richgo.ai | 청약플러스 현재 | 비고 |
|------|-----------|--------------|------|
| 기본 폰트 | SUIT Variable | Pretendard Variable | 둘 다 가변 폰트 CDN 방식. Pretendard 유지 |
| 특수 제목 폰트 | GmarketSansMedium | 없음 | 랜딩 히어로 제목에 적용 검토 가능 |
| 로딩 방식 | CDN | CDN | 동일 |

**GmarketSansMedium 적용 검토**: 랜딩 페이지 히어로 타이틀(`display`, `display-sm` 레벨)에 한해 GmarketSansMedium을 선택적으로 사용하면 브랜드 개성을 높일 수 있다. 기본 폰트(Pretendard)는 변경하지 않는다.

```css
/* 선택적 추가 — 랜딩 히어로 전용 */
@font-face {
  font-family: 'GmarketSans';
  src: url('https://cdn.jsdelivr.net/gh/webfontworld/gmarket/GmarketSansMedium.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
```

### 9.9 shadcn/ui 컴포넌트 매핑 테이블

richgo.ai의 주요 UI 패턴과 청약플러스의 shadcn/ui 구현 대응을 정리한다.

| richgo.ai 패턴 | 청약플러스 shadcn/ui 구현 | 우선순위 | 비고 |
|----------------|--------------------------|---------|------|
| 마커 윈도우 (지도 위 팝업) | `Popover` 또는 `HoverCard` | 지도 기능 구현 시 | `Popover`는 클릭, `HoverCard`는 호버 트리거 |
| 데이터 수치 카드 | `Card` + `Badge` (방향성 컬러) | +예측 구현 시 | 9.2절 방향성 컬러 시스템 적용 |
| 알림 세분화 토글 | `Switch` + `Form` | +보호 구현 시 | react-hook-form + zod와 조합 |
| 찜 목록 탭 (관심/비교) | `Tabs` | 단지 목록 개선 시 | shadcn `Tabs` 그대로 사용 |
| 프리뷰 패널 슬라이드업 | `Sheet` (side="bottom") | 모바일 상세 뷰 | 기본 slide-in 동작으로 커버 |
| 필터 칩 | `Badge` + `Button variant="outline"` | 단지 검색 필터 | `rounded-[6px]` 적용 (9.3절) |
| 시세 트렌드 차트 | `recharts` + 방향성 컬러 | +예측 구현 시 | recharts 미도입 시 CSS 막대 그래프 우선 |
| 클러스터 (지도 그룹 마커) | `Badge` (숫자 뱃지형) | 지도 기능 구현 시 | `rounded-full bg-primary text-white` |
| 단계별 슬라이더 | `Slider` (shadcn) | 가점 시뮬레이션 | 현재 미사용 → 가점 계산기에 적용 검토 |
| 단지 사진 캐러셀 | `Carousel` (shadcn) | 단지 상세 페이지 | 기존 "미사용"에서 **재검토**: 단지 사진 뷰에 적합 |

**Carousel 재검토 결과**: 기존에는 "슬라이드 UI 불필요"로 미사용 분류했으나, 단지 상세 페이지의 단지 사진, +예측 리포트의 차트 시퀀스 탐색에 Carousel이 적합한 UX를 제공할 수 있다. 단지 상세 구현 시 재평가한다.

---

## 8. 디자인 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-04 | 초기 디자인 시스템 정의 |
| 2026-03-08 | 전체 UI/UX 프리미엄 개선: framer-motion 도입, 글래스모피즘, 호버 리프트, 순차 등장 애니메이션, 랜딩 페이지 리디자인, 인증 2분할 레이아웃, 카드 rounded-xl + shadow-md 업그레이드, 네비게이션 인디케이터, Skeleton/에러/빈 상태 UI 개선 |
| 2026-03-10 | +가치 분석 UI 추가: ValueGradeBadge, ValueScoreCard, CategoryBreakdown, FactorList 4개 컴포넌트, A~F 등급 컬러 시스템, 팩터 점수 비율별 색상 |
| 2026-03-10 | +가치 UI 진입점 추가: 사이드바/모바일 5탭 네비에 +가치 메뉴, 단지 카드 등급 배지, 상세 페이지 CTA 버튼, /value 안내 랜딩 페이지 |
| 2026-03-11 | richgo.ai 경쟁사 분석 추가 (섹션 9): 컬러 비교, 방향성 데이터 컬러 시스템, radius 스케일 보강, 구분선 계층화, 마이크로 인터랙션 패턴, 카드 디자인 비교, 스크롤바 스타일, 폰트 비교, shadcn/ui 매핑 테이블 |
| 2026-03-11 | +가치 UI 고도화: TrendBadge, DataSourceBadge, Collapsible 3개 신규 컴포넌트 추가. ValueScoreCard에 신뢰도/출처, CategoryBreakdown에 펼침뷰, FactorList에 데이터확보 아이콘/트렌드 배지 반영. trend CSS 변수 적용 |
