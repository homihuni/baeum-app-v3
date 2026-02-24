# CHANGELOG — 배움학습 앱 변경 이력

---

## 2026-02-24 (초기 구축)

### 시리얼 시스템 구축
- Firestore Serials 컬렉션 설계 (10자리 코드, calendarYear, expiry, isUsed)
- 시리얼 입력 화면 개발 (app/serial/enter.tsx)
- upgradeChildTier 함수에 isLocked: false 추가

### 시리얼 만료 처리
- checkSerialExpiry 함수 개발 (utils/firestore.ts)
- 만료 시 tier → "expired", isLocked → true 자동 전환
- 무료 자녀 0명이면 만료 자녀 1명 무료 전환
- 홈 화면 만료 팝업 + 무료 자녀 자동 전환

### 자녀 선택 화면 잠금 처리
- select-child.tsx에 잠긴 자녀 회색 처리 + Expired 배지
- 잠긴 자녀 클릭 시 자녀관리로 이동 (홈 진입 차단)
- 시리얼 입력 화면 뒤로가기 → select-child로 이동

### 자녀관리 연동
- 잠긴 자녀 카드 회색 + 잠금 배지
- 잠긴 자녀 클릭 시 시리얼 등록 팝업

### 홈 화면 수정
- useFocusEffect → useEffect 변경 (bolt.new 호환)
- 닉네임 실시간 반영
- 만료 팝업 Modal

### 알려진 미완료 항목
- study.tsx 잠금 체크 미구현
- growth.tsx 잠금 체크 미구현
- 스카이 회원 구독 시스템 미개발
- children/manage.tsx 뒤로가기 처리 검토 필요

---

## 작성 규칙
- 날짜별로 최신순 상단 배치
- 각 항목에 수정한 파일명 포함
- 미완료/이슈는 별도 섹션으로 기록
- 새 AI 세션 시작 시: "HANDOVER.md와 CHANGELOG.md를 먼저 읽고 작업해줘"
