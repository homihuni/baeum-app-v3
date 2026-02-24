# 배움학습 앱 — 인수인계 문서 (2026.02.24 기준)

## 1. 앱 개요
배움학습은 초등학생 대상 AI 학습 앱으로, 부모가 자녀를 등록하고 시리얼 번호 기반으로 유료(배움) 회원을 활성화하는 구조입니다. Expo Router 기반 React Native 앱이며, 백엔드는 Firebase Firestore를 사용합니다.

## 2. 회원 등급 체계 (Tier System)

### 2-1. 등급 종류
| 등급 | tier 값 | 설명 |
|------|---------|------|
| 무료회원 | "free" | 기본 체험 등급. 자녀 1명만 활성 가능 |
| 배움회원 | "baeum" | 시리얼 번호 등록으로 활성화. 시리얼 유효기간 동안 학습 가능 |
| 스카이회원 | "sky" | 구독 기반 (현재 미개발) |
| 만료 | "expired" | 배움/스카이 회원의 시리얼 또는 구독 만료 시 전환되는 상태 |

### 2-2. 등급별 제한사항
| 항목 | 무료 | 배움 | 스카이 | 만료 |
|------|------|------|--------|------|
| 학습(문제풀기) | O (제한적) | O (전체) | O (전체) | X (잠금) |
| AI 학습코멘트 | X | O | O | X |
| 성장 리포트 | 기본만 | 전체 | 전체 | X |
| 활성 자녀 수 | 1명 | 시리얼당 1명 | 구독 범위 | 잠금 |

### 2-3. 핵심 정책
**무료회원 1명 제한 정책**: 무료(free) 등급 자녀는 최대 1명만 활성 상태로 유지 가능합니다. 2명 이상의 무료 자녀가 존재하면 1명만 활성, 나머지는 잠금 처리해야 합니다.

**시리얼 만료 시 처리 정책**: 배움회원의 시리얼이 만료되면 자동으로 `tier: "expired"`, `isLocked: true`로 전환됩니다. 무료로 자동 전환되지 않습니다. 단, 해당 부모 계정에 무료 자녀가 0명인 경우에만 만료된 자녀 1명을 무료로 전환합니다.

**잠긴 자녀 진입 차단 정책**: 잠긴 자녀(`isLocked: true` 또는 `tier: "expired"`)는 셀렉트 화면(select-child.tsx)에서 홈 화면 진입이 차단됩니다. 잠긴 자녀 클릭 시 자녀관리 화면으로 이동하여 시리얼 등록을 유도합니다.

## 3. Firestore 데이터 구조

### 3-1. Parents 컬렉션
```
Firestore > Parents > {parentId}
├── email: string
├── name: string
├── loginType: string ("google" 등)
├── maxChildren: number
├── createdAt: timestamp
├── lastLoginAt: timestamp
├── notificationSettings: map
│   ├── marketing: boolean
│   ├── nightMarketing: boolean
│   ├── notice: boolean
│   └── payment: boolean
└── Children (서브컬렉션)
    └── {childId}
        ├── name: string ("후니친구", "지훈이집중" 등)
        ├── avatar: string (이모지)
        ├── birthDate: string ("2018-06-20")
        ├── gender: string ("male"/"female")
        ├── grade: number (1~6)
        ├── tier: string ("free"/"baeum"/"sky"/"expired")
        ├── isLocked: boolean
        ├── isDeleted: boolean
        ├── serialCode: string (등록된 시리얼 코드)
        ├── serialExpiry: timestamp (시리얼 만료일)
        ├── serialCalendarYear: number (시리얼 연도)
        ├── serialNumber: string
        ├── questionsPerSubject: number (과목당 문제 수)
        ├── gradeChangeCount: number
        ├── subjects: array ["korean", "math", "integrated"]
        ├── createdAt: timestamp
        └── Records (서브컬렉션) — 학습 기록
```

### 3-2. Serials 컬렉션
```
Firestore > Serials > {serialCode} (문서 ID = 시리얼 코드)
├── calendarYear: number (2026 등)
├── expiry: timestamp (만료일, 예: 2027-02-28)
├── isUsed: boolean
├── usedBy: string (사용한 childId)
├── usedAt: string (사용 시점)
└── createdAt: string
```

**시리얼 코드 규칙**: 10자리 영숫자 (예: 26JH26A7K3, 26TEST0001). 입력 화면에서 10자리 유효성 검사를 수행합니다.

### 3-3. 현재 테스트 데이터
**부모**: test-parent-001 (테스트 부모, email: test@baeum.app)

**자녀**:
| 문서 ID | 이름 | tier | isLocked | 비고 |
|---------|------|------|----------|------|
| 4ObJ7IUKChKr7ivTMr4i | 후니친구 | free | false | 활성 무료회원 |
| ZREGv9wY2hlp6h8XVBS5 | 지훈이집중 | baeum | false | 시리얼 26JH26A7K3, 만료 2027-02-28 |
| DuJkdzCPltT7no7X8X8e | 후니형 | — | isDeleted: true | 삭제됨 |

**시리얼**:
| 문서 ID (코드) | calendarYear | expiry | isUsed | 비고 |
|---------------|--------------|--------|--------|------|
| 26JH26A7K3 | 2026 | 2027-02-28 | true | 지훈이집중에 등록됨 |
| 26TEST0001 | 2026 | 2027-02-28 | true | 후니친구에 사용됨 |
| JH26A7K3 | 2026 | 2027-02-28 | false | 8자리 (구형식, 사용 불가) |
| BAEUM-2026-TEST-001 | — | — | — | 초기 테스트용 |
| BAEUM-2026-TEST-002 | — | — | — | 초기 테스트용 |

## 4. 주요 파일 및 역할

### 4-1. 화면 파일
| 파일 | 역할 | 상태 |
|------|------|------|
| app/(auth)/select-child.tsx | 자녀 선택 화면 ("누가 공부할까요?"). 잠긴 자녀 회색 처리 + Expired 배지. 잠긴 자녀 클릭 시 자녀관리로 이동 | ✅ 완료 |
| app/(tabs)/home.tsx | 홈 화면. 프로필, 캘린더, 통계, 학습 버튼. 시리얼 만료 감지(checkExpiry) + 만료 팝업 | ✅ 완료 |
| app/(tabs)/study.tsx | 스터디 탭 (문제풀기) | ⚠️ 잠금 체크 미구현 |
| app/(tabs)/growth.tsx | 성장 리포트 탭 | ⚠️ 잠금 체크 미구현 |
| app/children/manage.tsx | 자녀 관리 화면. 잠긴 자녀 회색 카드 + 잠금 배지 + 시리얼 등록 버튼 | ✅ 완료 |
| app/serial/enter.tsx | 시리얼 번호 입력 화면. 10자리 검증, Firestore 시리얼 조회/등록, 뒤로가기 시 select-child로 이동 | ✅ 완료 |

### 4-2. 유틸리티 파일
| 파일 | 주요 함수 | 역할 | 상태 |
|------|-----------|------|------|
| utils/firestore.ts | checkSerialExpiry(parentId) | 시리얼 만료 체크. 만료 시 tier→expired, isLocked→true. 무료 자녀 0명이면 1명 무료 전환 | ✅ 완료 |
| utils/firestore.ts | upgradeChildTier(parentId, childId, serialData) | 시리얼 등록 시 자녀 업그레이드. tier→baeum, isLocked→false 설정 포함 | ✅ 완료 |
| utils/firestore.ts | lockExcessFreeChildren(parentId, selectedChildId) | 무료 자녀 2명 이상 시 선택된 1명 외 잠금 | ✅ 완료 (현재 사용되지 않을 수 있음) |

## 5. 핵심 흐름 (Flow)

### 5-1. 앱 진입 흐름
```
앱 시작
  → 로그인 확인
  → select-child.tsx ("누가 공부할까요?")
    → 활성 자녀 클릭 → 홈 화면 진입
    → 잠긴 자녀 클릭 → 자녀관리 화면 → 시리얼 등록 유도
```

### 5-2. 시리얼 만료 감지 흐름
```
홈 화면 로드 (useEffect)
  → checkExpiry() 호출
    → checkSerialExpiry(parentId) 실행
      → 각 자녀의 serialExpiry 확인
      → 만료된 자녀: tier → "expired", isLocked → true
      → 무료 자녀 0명이면: 만료 자녀 1명을 무료로 전환
    → 만료된 자녀 있으면: 만료 팝업 표시
    → 현재 선택된 자녀가 만료되었으면: 활성 무료 자녀로 자동 전환
```

### 5-3. 시리얼 등록 흐름
```
시리얼 입력 화면 (serial/enter.tsx)
  → 10자리 시리얼 코드 입력
  → Firestore Serials 컬렉션에서 조회
  → isUsed === false 확인
  → upgradeChildTier() 호출
    → 자녀 문서: tier → "baeum", isLocked → false, serialCode/Expiry 설정
    → 시리얼 문서: isUsed → true, usedBy → childId
  → "배움회원으로 업그레이드되었습니다" 팝업
  → 홈 화면 진입
```

### 5-4. 잠긴 자녀 차단 흐름
```
select-child.tsx
  → 자녀 목록 로드 (isLocked, tier 필드 포함)
  → 잠긴 자녀: 회색 카드 + "Expired" 배지
  → 잠긴 자녀 클릭: router.push('/children/manage')
  → 자녀관리에서 시리얼 등록 버튼 → serial/enter.tsx
  → 시리얼 입력 안 하고 뒤로가기 → router.replace('/(auth)/select-child')
```

## 6. 개발 완료 항목 (✅)

### 6-1. 시리얼 시스템
- Firestore Serials 컬렉션 설계 및 테스트 데이터 생성
- 시리얼 입력 화면 (app/serial/enter.tsx) — 10자리 검증, 조회, 등록
- 시리얼 등록 시 자녀 tier 업그레이드 + isLocked: false 해제
- 시리얼 만료 자동 감지 (checkSerialExpiry)
- 만료 시 tier: "expired", isLocked: true 자동 설정
- 무료 자녀 0명 시 만료 자녀 1명 자동 무료 전환

### 6-2. 자녀 선택/관리
- 자녀 선택 화면 잠금 표시 (회색 + Expired 배지)
- 잠긴 자녀 클릭 시 자녀관리로 이동 (홈 진입 차단)
- 자녀관리 화면 잠금 카드 UI + 시리얼 등록 버튼
- 시리얼 입력 후 뒤로가기 → 셀렉트 화면으로 이동

### 6-3. 홈 화면
- 시리얼 만료 팝업 표시 ("새 시리얼 등록" / "나중에 하기")
- 만료된 선택 자녀 → 활성 무료 자녀로 자동 전환
- 홈 화면 닉네임 실시간 반영 (useFocusEffect → useEffect로 변경)
- 프로필 헤더: 아바타, 이름, 학년, 등급 배지 (TIER_COLORS, TIER_LABELS)

### 6-4. 학년 관련
- 학년은 number 타입으로 저장 (1~6)
- 화면 표시 시 `{grade}학년` 형식으로 렌더링

## 7. 개발 필요 항목 (❌ 미완료)

### 7-1. 잠긴 자녀 학습 차단 (우선순위: 높음)
**현재 상태**: 잠긴 자녀로 셀렉트 화면 진입은 차단되지만, 이미 홈에 들어와 있는 상태에서 스터디/성장 탭 접근이 차단되지 않습니다.

**필요 작업**:
- `app/(tabs)/study.tsx`: 화면 로드 시 현재 자녀의 isLocked / tier === "expired" 체크. 잠금 상태면 학습 불가 안내 표시
- `app/(tabs)/growth.tsx`: 동일한 잠금 체크 추가
- **권장 구현**: 각 탭에서 useEffect로 AsyncStorage에서 childId 읽고 → Firestore에서 해당 자녀의 isLocked 확인 → 잠금이면 오버레이 또는 리다이렉트

### 7-2. 스카이 회원 구독 시스템 (우선순위: 중간)
**현재 상태**: 완전 미개발

**필요 작업**:
- 구독 결제 화면 개발
- 결제 연동 (인앱 결제 또는 외부 결제)
- 구독 상태 관리 (tier: "sky")
- 구독 취소/만료 시 처리 로직

### 7-3. 시리얼 입력 화면 UX 개선 (우선순위: 낮음)
- 이미 시리얼이 등록된 자녀가 시리얼 입력 화면에 들어가면 "인증완료" 상태 표시 → 이 상태에서 새 시리얼 재등록 가능하게 하거나 안내 문구 개선 필요
- 기존 시리얼 코드(JH26A7K3, 8자리)와 새 코드 형식(10자리) 간 호환 정리

### 7-4. 뒤로가기 처리 강화 (우선순위: 중간)
**현재 상태**: serial/enter.tsx의 뒤로가기는 `router.replace('/(auth)/select-child')`로 설정됨

**추가 필요**:
- app/children/manage.tsx의 뒤로가기도 select-child로 이동해야 할 수 있음 (잠긴 자녀가 자녀관리 → 뒤로 → 탭 화면 접근 방지)
- Android 하드웨어 백 버튼 처리 검토

### 7-5. 무료 자녀 2명 이상 처리 완성 (우선순위: 중간)
**현재 상태**: lockExcessFreeChildren 함수 존재하지만 현재 흐름에서 호출되는지 불확실

**필요 작업**:
- 자녀 추가 시 무료 자녀 수 체크 로직 확인
- 2명 이상 무료 자녀 존재 시 1명만 활성 유지 로직 점검

## 8. 알려진 이슈 및 주의사항

### 8-1. bolt.new 환경 제한
- **React Native Modal 컴포넌트**: bolt.new 웹 프리뷰에서 터치 이벤트가 차단됨. Modal 내부 버튼이 동작하지 않는 문제 발생. **해결**: Modal 대신 conditional View overlay 사용 또는 페이지 이동 방식으로 변경
- **Alert.alert**: bolt.new 웹 프리뷰에서 동작하지 않음. window.alert로 대체 가능하나 프로덕션에서는 사용 불가
- **useFocusEffect**: bolt.new 프리뷰에서 동작하지 않음. useEffect로 대체 완료

### 8-2. 데이터 일관성
- 테스트 과정에서 Firebase 데이터가 여러 번 수동 변경됨. 프로덕션 전 데이터 정합성 점검 필요
- isLocked 필드가 일부 자녀 문서에 존재하지 않을 수 있음. 코드에서 `data.isLocked || false` 방어 처리 완료
- tier 필드가 없는 자녀는 "free"로 간주 (`data.tier || 'free'`)

### 8-3. 시리얼 필드명 차이
- 초기 시리얼 문서(JH26A7K3)는 expiryDate 필드를 사용했으나, 최신 구조는 expiry 사용
- 코드에서 expiry 필드를 읽으므로 기존 시리얼 문서도 expiry로 통일 필요

## 9. 경우의 수 정리 (시나리오별 동작)

### 자녀 1명
| 시나리오 | 동작 |
|----------|------|
| 무료 1명 | 정상 이용 |
| 배움 1명, 시리얼 만료 | 무료로 자동 전환 (무료 자녀 0명이므로) → 정상 이용 |

### 자녀 2명
| 시나리오 | 동작 |
|----------|------|
| 무료1 + 배움1 정상 | 둘 다 활성 |
| 무료1 + 배움1 만료 | 무료1 유지, 배움1 → expired + 잠금 |
| 배움1 + 배움2 둘 다 만료 | 1명 무료 전환 + 활성, 나머지 1명 expired + 잠금 |
| 무료1 + 스카이1 구독 취소 | 무료1 유지, 스카이1 → expired + 잠금 |

### 자녀 3명
| 시나리오 | 동작 |
|----------|------|
| 동일 원칙 적용 | 무료 자녀 최대 1명만 활성 유지, 나머지 만료/잠금 자녀는 시리얼 등록 또는 구독 필요 |

## 10. 테스트 방법

### 시리얼 만료 테스트
1. Firebase에서 자녀 문서의 serialExpiry를 과거 날짜로 변경 (예: 2025-02-28)
2. tier를 "baeum", isLocked를 false로 설정
3. 앱 새로고침 → checkExpiry가 만료 감지 → tier→expired, isLocked→true 자동 변경
4. 홈 화면에 만료 팝업 표시 확인

### 시리얼 등록 테스트
1. Serials 컬렉션에 새 10자리 시리얼 문서 추가 (isUsed: false)
2. 자녀 문서를 isLocked: true, tier: "expired", serialCode: "" 으로 설정
3. 앱에서 셀렉트 화면 → 잠긴 자녀 클릭 → 자녀관리 → 시리얼 등록
4. 시리얼 코드 입력 → 등록 완료 → 잠금 해제 + 배움회원 전환 확인

### 잠금 진입 차단 테스트
1. 자녀를 isLocked: true, tier: "expired"로 설정
2. 셀렉트 화면에서 해당 자녀 클릭 → 자녀관리로 이동 확인 (홈 진입 안 됨)

## 11. 코드 수정 시 주의사항
- **useFocusEffect 사용 금지** — bolt.new에서 동작하지 않음. useEffect 사용
- **Modal 컴포넌트 주의** — bolt.new에서 터치 이벤트 차단 이슈. 필요 시 조건부 View overlay 또는 페이지 이동 방식 사용
- **Alert.alert 사용 금지 (bolt.new 환경)** — 프로덕션 빌드에서만 사용 가능
- **Firestore 필드 방어 처리** — `data.isLocked || false`, `data.tier || 'free'` 패턴 유지
- **시리얼 코드 10자리** — 모든 새 시리얼은 10자리 영숫자로 생성
- **자녀 문서 업데이트 시 isLocked 포함** — 특히 upgradeChildTier에서 반드시 `isLocked: false` 설정
