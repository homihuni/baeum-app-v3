# 배움학습 앱 — 앱 개발 하네스 v1.0
# 파일: CLAUDE.md
# 최종 수정: 2026-04-11
# 작성자: 정호 (1인 개발 운영)

---

## 1. 프로젝트 개요

배움학습은 대한민국 초등학교 1~6학년 대상 교과과정 학습 앱이다.
부모가 가입하고 자녀 프로필을 등록하여 학습하는 구조이며,
시리얼 번호 기반 유료(배움) 회원과 구독 기반(스카이) 회원을 운영한다.

- 앱 이름: 배움학습
- 플랫폼: iOS + Android 동시 출시
- 출시 목표: 2026년 8월 (단축) / 최종 2026년 11월
- 예상 사용자: 약 5,000명
- 운영 형태: 1인 비개발자 운영 (AI 기반 개발)

### 과목 구조
- 1~2학년: 국어, 수학, 통합교과 (3과목)
  - 1학년 1학기 통합교과: 학교, 사람들, 우리나라, 탐험
  - 1학년 2학기: 하루, 약속, 상상, 이야기
  - 2학년 1학기: 나, 자연, 마을, 세계
  - 2학년 2학기: 계절, 인물, 물건, 기억
- 3~6학년: 국어, 영어, 수학, 과학, 사회 (5과목)

---

## 2. 기술 스택 (변경 금지)

- Expo SDK 54 + Expo Router 6 (파일 기반 라우팅)
- TypeScript 5.9, React 19.1, React Native 0.81.5
- Firebase 12.9 (Firestore, Auth, Functions) — Blaze 종량제
- react-native-reanimated 4.1
- lucide-react-native, @expo/vector-icons
- react-native-safe-area-context
- @react-native-async-storage/async-storage
- 빌드/배포: EAS Build + EAS Submit
- 코드 관리: GitHub
- 결제 (예정): RevenueCat SDK
- 푸시 알림 (예정): Expo Notifications + FCM

---

## 3. 코딩 규칙 (모든 코드에 적용)

1. 모든 코드는 TypeScript로 작성
2. 컴포넌트는 함수형 + React.FC
3. SafeAreaView는 반드시 react-native-safe-area-context에서 import
4. Firebase import는 utils/firebase.ts에서
5. 상태 관리: useState, useContext (외부 라이브러리 금지)
6. 새 페이지는 app/ 폴더에 파일 생성 (Expo Router)
7. 모든 함수에 한국어 주석 필수 (비개발자 유지보수)
8. 하나의 컴포넌트는 하나의 역할만
9. 에러는 반드시 try-catch로 처리, UI에 에러 메시지 표시
10. 스타일은 StyleSheet.create만 사용 (NativeWind/Tailwind 금지)
11. Alert.alert 사용 금지 → UI 에러 표시 패턴 사용
12. 날짜는 항상 KST(UTC+9) 기준 동적 계산 (하드코딩 금지)
13. 파일 수정 시 전체 코드 제공 (부분 수정 금지)
14. 새 기능 추가 시 기존 코드에 영향 최소화

---

## 4. 회원 등급 체계 (Tier System)

### 등급 종류
| 등급 | tier 값 | 설명 |
|------|---------|------|
| 무료회원 | "free" | 기본 체험. 자녀 1명만 활성 |
| 배움회원 | "baeum" | 시리얼 번호 등록. 유효기간 동안 학습 |
| 스카이회원 | "sky" | 월 구독 (자녀 1명당 월 1,900원, 최대 3명) |
| 만료 | "expired" | 시리얼/구독 만료 시 자동 전환 |

### 등급별 기능 제한
| 항목 | 무료 | 배움 | 스카이 | 만료 |
|------|------|------|--------|------|
| 학습(문제풀기) | O (3문제) | O (5문제) | O (10문제+5추가) | X (잠금) |
| 과목 선택 | 1~2학년 전과목 / 3~6학년 1과목 | 전과목 | 전과목 | X |
| AI 학습코멘트 | X | O (하루 피드백) | O (하루+월간) | X |
| 성장 리포트 | 기본만 | 전체 | 전체+정밀분석 | X |
| 활성 자녀 수 | 1명 | 시리얼당 1명 (최대 3명) | 구독 범위 (최대 3명) | 잠금 |

### 등급 전환 흐름
- 무료→배움: 시리얼번호 입력
- 무료→스카이: 구독 결제
- 배움→스카이: 구독 결제 (시리얼 DB 유지)
- 스카이→배움: 구독 해지 후 유효 시리얼 있으면 자동 전환
- 스카이→무료: 구독 해지 + 시리얼 만료/없음
- 배움→expired: 시리얼 만료 시 자동 전환

### 핵심 정책
- 무료회원 자녀는 계정당 1명만 활성 허용
- 시리얼 만료 시 → tier: "expired", isLocked: true
- 무료 자녀가 0명이면 만료 자녀 1명을 무료로 자동 전환
- 잠긴 자녀는 홈 화면 진입 차단 → 자녀관리로 이동 유도

---

## 5. 시리얼번호 정책

- 형식: 10자리 영숫자 (예: 26JH26A7K3)
- 1회 등록 후 재사용 불가
- 탈퇴 시 영구 폐기
- 배움→스카이 업그레이드 후 다시 배움으로 변경 시, 기존 시리얼은 만료 전까지 사용 가능

---

## 6. 자녀 관리 정책

- 부모 1계정에 자녀 최대 3명 (1:N 구조)
- 무료 자녀는 계정당 1명만 허용
- 삭제는 소프트 삭제 (isDeleted: true, deletedAt)
- 삭제 후 24시간 쿨다운
- 최소 1명 자녀 등록 필수
- 현재 선택된 자녀는 삭제 불가

---

## 7. 문제 출제 정책

- DB에서 문제를 가져오는 단일 구조
- 문제 형태: 객관식 4지선다, OX 1문, 4학년 이상 주관식 1문(단답)
- 하루 기준: 자정(00:00) 리셋
- 날짜 기반 시드 셔플: 매일 다른 문제, 같은 날은 같은 문제
- 중도 이탈 시 해당 과목 처음부터 재시작
- 문제 생성 원칙: 교과서/문제집/기출 복사 재가공 절대 금지, 모든 문제는 새롭게 창작

---

## 8. Firestore 데이터 구조

### 8-1. Parents 컬렉션
Parents > {parentId}
- email: string
- name: string
- loginType: string ("google" 등)
- tier: string ("free"/"baeum"/"sky")
- maxChildren: number
- createdAt: timestamp
- lastLoginAt: timestamp
- notificationSettings: map (marketing, nightMarketing, notice, payment)

### 8-2. Children 서브컬렉션
Parents > {parentId} > Children > {childId}
- name: string
- avatar: string ("avatar_03" 등)
- birthDate: string ("2019-12-25")
- gender: string ("male"/"female")
- grade: number (1~6)
- tier: string ("free"/"baeum"/"sky"/"expired")
- isLocked: boolean
- isDeleted: boolean
- serialCode: string
- serialExpiry: string ("2027-02-28")
- serialCalendarYear: number
- serialNumber: string
- questionsPerSubject: number
- gradeChangeCount: number
- subjects: array ["korean", "math", "integrated"]
- createdAt: timestamp

### 8-3. Records 서브컬렉션
Parents > {parentId} > Children > {childId} > Records > {recordId}
- subject: string
- date: string ("2026-03-12") — KST 기준
- totalQuestions: number
- correctCount: number
- wrongCount: number
- score: number (0~100)
- completedAt: timestamp
- solvedAt: timestamp

### 8-4. Serials 컬렉션
Serials > {serialCode}
- calendarYear: number
- expiry: string ("2027-02-28")
- isUsed: boolean
- usedBy: string (childId)
- usedAt: string
- createdAt: string

### 8-5. Problems 컬렉션
Problems > {problemId}
- grade: number (1~6)
- subject: string
- type: string ("multiple_choice", "ox", "short_answer")
- question: string
- options: array
- answer: number 또는 string
- explanation: string
- difficulty: string ("easy"/"medium"/"hard")
- unit: string
- isActive: boolean

### 8-6. Banners 컬렉션
Banners > {bannerId}
- imageUrl: string
- linkType: string ("url"/"screen")
- linkValue: string
- startDate: string
- endDate: string
- isActive: boolean
- order: number

### 8-7. Notices 컬렉션
Notices > {noticeId} (노션 공개 페이지 연동 예정)

---

## 9. 현재 구현 상태

### 완료
- app/(auth)/login.tsx — Google 로그인 적용
- app/(auth)/create-profile.tsx — 프로필 생성
- app/(auth)/select-child.tsx — 자녀 선택 (잠긴 자녀 회색+Expired 배지)
- app/(tabs)/home.tsx — 홈 (프로필, 배너, 달력, 통계)
- app/(tabs)/study.tsx — 과목 선택
- app/study/questions.tsx — 문제 풀이
- app/study/complete.tsx — 학습 완료
- app/study/result.tsx — 결과
- app/children/manage.tsx — 자녀 관리 (잠긴 자녀 회색+시리얼 버튼)
- app/serial/enter.tsx — 시리얼 입력
- app/(tabs)/menu.tsx — 메뉴
- app/settings/ — 설정

### 미완료 (우선순위)
- P0: 성장 리포트 완성 (AI 분석 추가)
- P0: 공지 노션 연동 (웹뷰)
- P0: 소셜 로그인 (Apple 필수, Kakao 2차)
- P0: 잠긴 자녀 study/growth 탭 차단
- P1: 아이콘/스플래시 디자인
- P1: 에러/네트워크 처리 강화
- P2: 학부모 대시보드 (부모용 리포트)
- P2: 푸시 알림/리마인더
- P2: 구독 결제 (스카이/RevenueCat)
- P2: 회원탈퇴 로직

---

## 10. 핵심 개발 패턴

### 패턴 1: KST 기준 날짜
const now = new Date();
const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
const kstDate = new Date(kstTime);
const dateStr = kstDate.getUTCFullYear() + '-' +
                String(kstDate.getUTCMonth() + 1).padStart(2, '0') + '-' +
                String(kstDate.getUTCDate()).padStart(2, '0');
// 금지: new Date().toISOString().split('T')[0]

### 패턴 2: 에러 처리 (UI 표시)
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
// try-catch로 감싸고, catch에서 setError 호출
// 금지: Alert.alert

### 패턴 3: Firebase 쿼리
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../utils/firebase';
const recordsRef = collection(db, 'Parents', parentId, 'Children', childId, 'Records');

### 패턴 4: AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('parentId', parentId);
const parentId = await AsyncStorage.getItem('parentId');

### 패턴 5: 날짜 기반 시드 셔플
// 같은 날짜에는 같은 순서로 문제 제공
// seededShuffle 함수 + getTodaySeed 함수 조합
// 참고: app/study/questions.tsx

### 패턴 6: 시리얼 만료 체크
// 배움/스카이 만료 시 → tier: "expired", isLocked: true
// 무료 자녀 0명이면 → 만료 자녀 1명을 무료로 전환
// 참고: utils/firestore.ts > checkSerialExpiry
// 호출 위치: home.tsx useEffect

---

## 11. 앱 디자인 가이드

### 컬러 팔레트
- 메인(민트): #7ED4C0
- 포인트(핑크): #F5A5B8
- 서브(스카이): #87CEEB
- 배경(화이트): #FFFFFF
- 배경보조(그레이): #F5F5F5
- 텍스트(다크그레이): #333333

### 등급 뱃지 색상
- 무료: 그레이
- 배움: 민트 (#7ED4C0)
- 스카이: 스카이블루 (#87CEEB)

### UX 원칙 (초등학생 대상)
- 큰 터치 영역 (최소 44x44)
- 밝고 친근한 색상
- 직관적 아이콘 + 텍스트 병행
- 1~2학년은 한글 위주, 영어 최소화

---

## 12. Agent Teams 역할 정의

### 시니어 개발자 (Senior Developer)
- 역할: 코드 작성, 리뷰, 버그 수정
- 원칙: 이 CLAUDE.md의 코딩 규칙 100% 준수
- 출력: 전체 파일 코드 + 파일 경로 + 필요한 패키지 설치 명령어

### UX/UI 디자이너 (UX/UI Designer)
- 역할: 화면 레이아웃, 컴포넌트 설계, 사용성 검토
- 원칙: 초등학생(6~13세) 사용 앱. 큰 터치 영역, 밝은 색상, 직관적 아이콘
- 출력: 화면 구성안 + StyleSheet 코드 + 사용성 체크리스트

### QA 테스터 (QA Tester)
- 역할: 코드 검증, 에러 시나리오 체크, Firestore 데이터 정합성 확인
- 원칙: 모든 코드에 대해 엣지 케이스 검증 (빈 데이터, 네트워크 오류, 만료 상태)
- 출력: 테스트 시나리오 목록 + 발견된 이슈 + 수정 제안

### 서비스 기획자 (Service Planner)
- 역할: 기능 요구사항 정리, 유저 플로우 설계, 정책 설계, 스토어 심사 대응
- 원칙: 초등학생 학부모 관점에서 사용 편의성 최우선
- 출력: 기능 명세서 + 유저 플로우 + 정책 문서

---

## 13. 화면 설계 (총 31개)

### 그룹 A 진입 (5): 스플래시, 소셜 로그인, 프로필 생성, 프로필 로딩, 자녀 선택
### 그룹 B 학습 (7): 홈, 과목 선택, 객관식, OX, 주관식(4학년+), 정답오답+AI해설, 학습완료
### 그룹 C 업그레이드 (4): 업그레이드 팝업, 회원등급 관리, 시리얼 입력, 구독 결제
### 그룹 D 리포트 (2): 성장 탭(아이용), 학습 리포트(부모용)
### 그룹 E 설정 (12): 설정 메뉴, 자녀 관리, 알림 설정, 1:1문의(3), 약관, 개인정보, 탈퇴, 공지(2), 전체메뉴
### 그룹 F 특수 (5): iOS 푸시 권한, 시리얼 만료, 졸업 안내, 네트워크 오류, 앱 업데이트

---

## 14. 스토어 심사 체크리스트

### Apple App Store
- Apple 로그인 필수
- Kids Category 연령 구분
- 외부 링크에 Parental Gate
- 개인정보처리방침 URL
- 테스트 계정 정보 제공

### Google Play Store
- Families Policy 준수
- COPPA 준수
- 대상 연령 설정
- Target API Level 35+

---

## 15. 운영 전략

- 공지/FAQ/약관: 노션 공개 페이지 + 앱 웹뷰
- 1:1 문의: 카카오톡 채널
- 시리얼/회원 관리: Firebase 콘솔 → Sheets 연동(확장)
- 대시보드: 회원 1,000명+ 이후 간단 웹 어드민

---

## 16. AI 작업 요청 규칙

작업 요청 시 반드시 포함:
1. 작업 대상 파일 경로
2. 현재 상태 (되어있는 것 / 안 되는 것)
3. 원하는 결과 (구체적으로)
4. 참고할 기존 파일 (있으면)

AI 응답 규칙:
1. 코드는 전체 파일 제공 (부분 수정 금지)
2. 파일 경로 명시
3. 새 패키지 필요 시 설치 명령어 포함
4. 모든 함수에 한국어 주석
5. 변경 사항 요약 (무엇을 왜 바꿨는지)
6. 코드 수정 작업 완료 후 git add, commit, push 실행. 커밋 메시지는 [기능명] 설명 형식 (예: [반응형] 모달 4개 width 반응형 적용)

---

## 17. 버전 관리

- 이 CLAUDE.md 파일은 프로젝트와 함께 버전 관리한다
- 상단 [변경 이력]에 날짜와 변경 내용을 기록한다
- 버전 규칙: 구조 변경 = 소수점 앞자리 (v2.0), 내용 추가/수정 = 소수점 뒷자리 (v1.1)
- CHANGELOG.md에 앱 코드 변경 내용도 별도 기록
- 커밋 메시지: [기능명] 설명 (예: [성장리포트] AI 분석 연동 추가)
