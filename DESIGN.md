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

탭바 아이콘 (lucide-react):
- 홈: `Home`
- 자격진단: `ClipboardCheck`
- 단지검색: `Search`
- 마이페이지: `User`
- 설정: `Settings`

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

## 8. 디자인 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-04 | 초기 디자인 시스템 정의 |
| 2026-03-08 | 전체 UI/UX 프리미엄 개선: framer-motion 도입, 글래스모피즘, 호버 리프트, 순차 등장 애니메이션, 랜딩 페이지 리디자인, 인증 2분할 레이아웃, 카드 rounded-xl + shadow-md 업그레이드, 네비게이션 인디케이터, Skeleton/에러/빈 상태 UI 개선 |
