# 프로젝트 인수인계 문서

## 1. 프로젝트 개요
- **프로젝트명**: 배움달력 학습 앱
- **플랫폼**: React Native (Expo)
- **주요 기능**: 초등학생 학습 문제 풀이, 성장 분석, 시리얼 코드 관리

## 2. 기술 스택
- **프레임워크**: Expo SDK 54
- **라우팅**: expo-router
- **백엔드**: Firebase (Firestore)
- **상태관리**: AsyncStorage
- **언어**: TypeScript

## 3. 프로젝트 구조
```
app/
├── (auth)/          # 인증 관련 화면
│   ├── login.tsx
│   ├── create-profile.tsx
│   └── select-child.tsx
├── (tabs)/          # 메인 탭 화면
│   ├── home.tsx
│   ├── study.tsx
│   ├── growth.tsx
│   └── menu.tsx
├── study/           # 학습 관련
│   ├── questions.tsx
│   ├── result.tsx
│   └── complete.tsx
├── settings/        # 설정 화면
├── children/        # 자녀 관리
└── serial/          # 시리얼 입력

utils/
├── firebase.ts      # Firebase 설정
├── firestore.ts     # Firestore 헬퍼 함수
└── testAuth.ts      # 인증 테스트
```

## 4. 주요 기능

### 4.1 인증 시스템
- Google/Apple 소셜 로그인
- 부모 계정 생성 및 관리
- 자녀 프로필 관리

### 4.2 학습 시스템
- 과목별 문제 풀이
- 일일 학습 기록
- 정답/오답 저장

### 4.3 시리얼 코드 시스템
- 10자리 시리얼 코드 검증
- 배움회원/스카이회원 업그레이드
- 만료일 자동 체크

### 4.4 자녀 관리
- 무료 회원: 1명 활성
- 배움 회원: 시리얼 등록 시 잠금 해제
- 만료 시 자동 잠금 처리

## 5. Firebase 데이터 구조

### 5.1 Parents 컬렉션
```typescript
{
  email: string
  name: string
  tier: 'free' | 'baeum' | 'sky'
  maxChildren: number
  createdAt: Timestamp
  lastLoginAt: Timestamp
}
```

### 5.2 Children 서브컬렉션
```typescript
{
  name: string
  grade: number
  gender: 'male' | 'female'
  avatar: string
  tier: 'free' | 'baeum' | 'sky' | 'expired'
  serialCode: string
  serialExpiry: string
  serialCalendarYear: number
  isLocked: boolean
  gradeChangeCount: number
  subjects: string[]
  questionsPerSubject: number
}
```

### 5.3 Records 서브컬렉션
```typescript
{
  date: string (YYYY-MM-DD)
  subject: string
  questions: Array<{
    question: string
    answer: string
    userAnswer: string
    isCorrect: boolean
  }>
  solvedAt: Timestamp
}
```

### 5.4 Serials 컬렉션
```typescript
{
  code: string (문서 ID)
  isUsed: boolean
  usedBy: string (childId)
  expiry: string (YYYYMMDD)
  calendarYear: number
}
```

## 6. 주요 로직

### 6.1 자녀 잠금 시스템
- 무료 회원: 1명만 활성 (isLocked: false)
- 나머지 자녀: 잠금 상태 (isLocked: true)
- 시리얼 등록 시: 해당 자녀만 잠금 해제

### 6.2 시리얼 만료 체크
- 로그인 시 자동 실행 (`checkSerialExpiry`)
- 만료 시:
  - 무료 자녀 0명 → 첫 번째 만료 자녀를 무료 전환
  - 무료 자녀 1명 이상 → 만료 자녀 잠금 처리

### 6.3 학습 문제 생성
- `sampleProblems.ts`에서 샘플 문제 제공
- 실제 배포 시 백엔드 API 연동 필요

## 7. 환경 변수 (.env)
```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## 8. 주요 이슈 및 해결 방법

### 8.1 시리얼 재등록 시 잠금 해제
**문제**: 만료 후 재등록 시 isLocked가 해제되지 않음
**해결**: `upgradeChildTier` 함수에 `isLocked: false` 추가

### 8.2 무료 자녀 중복 활성
**문제**: 무료 자녀가 2명 이상 활성화
**해결**: `lockExcessFreeChildren` 함수로 1명만 유지

### 8.3 만료 체크 타이밍
**문제**: 만료 체크가 실시간으로 안 됨
**해결**: 로그인 시 + 자녀 선택 시 체크

## 9. 테스트 계정
```
테스트 부모 ID: test-parent-001
테스트 자녀 ID: test-child-001
테스트 시리얼: 26JH26A7K3
```

## 10. 배포 전 체크리스트
- [ ] Firebase 프로덕션 설정
- [ ] 실제 문제 API 연동
- [ ] Google/Apple 인증 설정
- [ ] 앱 아이콘 및 스플래시 화면
- [ ] 개인정보 처리방침
- [ ] 이용약관
- [ ] 푸시 알림 설정

## 11. 개선 사항
1. 오프라인 모드 지원
2. 학습 통계 고도화
3. 부모-자녀 연동 기능
4. 리워드 시스템
5. 친구 기능

## 12. 문의
- 개발자: [담당자 이름]
- 이메일: [이메일]
- 문서 작성일: 2026-02-24
