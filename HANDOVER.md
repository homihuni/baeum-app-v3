# 🎓 배움학습 앱 — 외부 AI 전달용 개발 가이드

> **작성일**: 2026-03-12
> **목적**: 외부 AI(ChatGPT, Claude, Cursor 등)가 프로젝트를 이어받아 작업할 수 있도록 모든 개발 패턴과 규칙을 문서화

---

## 📋 1. 프로젝트 개요

### 핵심 개념
**배움학습**은 초등학생 대상 AI 학습 앱으로, 부모가 자녀를 등록하고 시리얼 번호 기반으로 유료(배움) 회원을 활성화하는 구조입니다.

- **플랫폼**: Expo Router 기반 React Native 앱 (SDK 54, Router 6)
- **데이터베이스**: Firebase Firestore
- **인증**: Firebase Auth (이메일/비밀번호)
- **타겟**: 초등학생 1~6학년 및 학부모

### 주요 기능
1. **문제 풀이**: 과목별(국어/수학/통합교과/과학/사회/영어) 객관식/OX/주관식 문제
2. **성장 리포트**: AI 기반 학습 분석 및 피드백 (배움/스카이 회원 전용)
3. **학습 달력**: 월별 학습 현황 캘린더
4. **시리얼 관리**: 10자리 시리얼 코드로 배움회원 활성화
5. **자녀 관리**: 학부모가 여러 자녀 등록 및 관리

---

## 🛠️ 2. 기술 스택

### 필수 라이브러리
```json
{
  "expo": "^54.0.10",
  "expo-router": "~6.0.8",
  "firebase": "^12.9.0",
  "react-native": "0.81.4",
  "react": "19.1.0",
  "@react-native-async-storage/async-storage": "^2.2.0"
}
```

### ⚠️ 제약사항 (반드시 준수!)

| 항목 | 금지 | 허용 |
|------|------|------|
| **스타일링** | ❌ NativeWind, Tailwind | ✅ **StyleSheet.create만 사용** |
| **에러 처리** | ❌ Alert.alert | ✅ **UI에 에러 메시지 표시** |
| **날짜** | ❌ 하드코딩 ("2026-03-12") | ✅ **동적 계산 (KST 기준)** |
| **네비게이션** | ❌ useFocusEffect 단독 사용 | ✅ **useEffect + useFocusEffect 조합** |
| **데이터베이스** | ❌ Supabase, 기타 | ✅ **Firebase Firestore만 사용** |
| **Modal** | ❌ React Native Modal (bolt.new에서 터치 차단 이슈) | ✅ **조건부 View overlay 권장** |
| **코멘트** | ❌ 코드에 주석 추가 금지 | ✅ **코드는 자체 설명적으로 작성** |

---

## 🔑 3. 회원 등급 체계 (Tier System)

### 3-1. 등급 종류

| 등급 | tier 값 | 설명 |
|------|---------|------|
| **무료회원** | `"free"` | 기본 체험 등급. 자녀 1명만 활성 가능 |
| **배움회원** | `"baeum"` | 시리얼 번호 등록으로 활성화. 시리얼 유효기간 동안 학습 가능 |
| **스카이회원** | `"sky"` | 구독 기반 (현재 미개발) |
| **만료** | `"expired"` | 배움/스카이 회원의 시리얼 또는 구독 만료 시 전환되는 상태 |

### 3-2. 등급별 제한사항

| 항목 | 무료 | 배움 | 스카이 | 만료 |
|------|------|------|--------|------|
| 학습(문제풀기) | O (3문제) | O (5문제) | O (10문제) | X (잠금) |
| AI 학습코멘트 | X | O (하루 피드백) | O (하루+월간) | X |
| 성장 리포트 | 기본만 | 전체 | 전체 | X |
| 활성 자녀 수 | 1명 | 시리얼당 1명 | 구독 범위 | 잠금 |

### 3-3. 핵심 정책

**🔒 무료회원 1명 제한 정책**
무료(free) 등급 자녀는 최대 1명만 활성 상태로 유지 가능합니다. 2명 이상의 무료 자녀가 존재하면 1명만 활성, 나머지는 잠금 처리해야 합니다.

**⏰ 시리얼 만료 시 처리 정책**
배움회원의 시리얼이 만료되면 자동으로 `tier: "expired"`, `isLocked: true`로 전환됩니다. 무료로 자동 전환되지 않습니다. 단, 해당 부모 계정에 무료 자녀가 0명인 경우에만 만료된 자녀 1명을 무료로 전환합니다.

**🚫 잠긴 자녀 진입 차단 정책**
잠긴 자녀(`isLocked: true` 또는 `tier: "expired"`)는 셀렉트 화면(select-child.tsx)에서 홈 화면 진입이 차단됩니다. 잠긴 자녀 클릭 시 자녀관리 화면으로 이동하여 시리얼 등록을 유도합니다.

---

## 🗂️ 4. Firestore 데이터 구조

### 4-1. Parents 컬렉션

```
Firestore > Parents > {parentId}
├── email: string
├── name: string
├── loginType: string ("google" 등)
├── tier: string ("free"/"baeum"/"sky") — 부모 계정 tier
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
        ├── avatar: string (이모지, 예: "🍓")
        ├── birthDate: string ("2018-06-20")
        ├── gender: string ("male"/"female")
        ├── grade: number (1~6)
        ├── tier: string ("free"/"baeum"/"sky"/"expired")
        ├── isLocked: boolean
        ├── isDeleted: boolean
        ├── serialCode: string (등록된 시리얼 코드)
        ├── serialExpiry: string (시리얼 만료일, 예: "2027-02-28")
        ├── serialCalendarYear: number (시리얼 연도, 예: 2026)
        ├── serialNumber: string
        ├── questionsPerSubject: number (과목당 문제 수)
        ├── gradeChangeCount: number
        ├── subjects: array ["korean", "math", "integrated"]
        ├── createdAt: timestamp
        └── Records (서브컬렉션) — 학습 기록
            └── {recordId}
                ├── subject: string ("korean", "math", etc.)
                ├── date: string ("2026-03-12") — KST 기준
                ├── totalQuestions: number
                ├── correctCount: number
                ├── wrongCount: number
                ├── score: number (0~100점)
                ├── completedAt: timestamp
                └── solvedAt: timestamp
```

### 4-2. Serials 컬렉션

```
Firestore > Serials > {serialCode} (문서 ID = 시리얼 코드)
├── calendarYear: number (2026 등)
├── expiry: string ("2027-02-28")
├── isUsed: boolean
├── usedBy: string (사용한 childId)
├── usedAt: string (사용 시점)
└── createdAt: string
```

**시리얼 코드 규칙**: 10자리 영숫자 (예: `26JH26A7K3`, `26TEST0001`)
입력 화면에서 10자리 유효성 검사를 수행합니다.

### 4-3. Problems 컬렉션

```
Firestore > Problems > {problemId}
├── grade: number (1~6)
├── subject: string ("korean", "math", etc.)
├── type: string ("multiple_choice", "ox", "short_answer")
├── question: string
├── options: array [선택지1, 선택지2, ...] — mcq/ox만
├── answer: number (options 배열 인덱스) 또는 string (주관식 정답)
├── explanation: string
├── difficulty: string ("easy", "medium", "hard")
├── unit: string
└── isActive: boolean
```

### 4-4. Banners 컬렉션

```
Firestore > Banners > {bannerId}
├── imageUrl: string
├── linkType: string ("url" | "screen")
├── linkValue: string
├── startDate: string ("2026-03-01")
├── endDate: string ("2026-03-31")
├── isActive: boolean
└── order: number
```

---

## 📁 5. 주요 파일 및 역할

### 5-1. 화면 파일

| 파일 경로 | 역할 | 상태 |
|-----------|------|------|
| `app/(auth)/login.tsx` | 로그인 화면 | ✅ 완료 |
| `app/(auth)/select-child.tsx` | 자녀 선택 화면 ("누가 공부할까요?"). 잠긴 자녀 회색 처리 + Expired 배지 | ✅ 완료 |
| `app/(tabs)/home.tsx` | 홈 화면. 프로필, 배너, 달력, 통계, 학습 버튼 | ✅ 완료 |
| `app/(tabs)/study.tsx` | 스터디 탭 (문제 풀기 시작) | ⚠️ 잠금 체크 미구현 |
| `app/(tabs)/growth.tsx` | 성장 리포트 탭 (AI 피드백, 통계) | ⚠️ 잠금 체크 미구현 |
| `app/(tabs)/menu.tsx` | 메뉴 탭 | ✅ 완료 |
| `app/study/questions.tsx` | 문제 풀이 화면 | ✅ 완료 |
| `app/study/complete.tsx` | 학습 완료 화면 | ✅ 완료 |
| `app/study/result.tsx` | 결과 화면 | ✅ 완료 |
| `app/children/manage.tsx` | 자녀 관리 화면. 잠긴 자녀 회색 카드 + 시리얼 등록 버튼 | ✅ 완료 |
| `app/serial/enter.tsx` | 시리얼 번호 입력 화면 | ✅ 완료 |

### 5-2. 유틸리티 파일

| 파일 경로 | 주요 함수 | 역할 |
|-----------|-----------|------|
| `utils/firebase.ts` | Firebase 초기화 | Firebase config 및 초기화 |
| `utils/firestore.ts` | `checkSerialExpiry(parentId)` | 시리얼 만료 체크. 만료 시 tier→expired, isLocked→true |
| `utils/firestore.ts` | `upgradeChildTier(...)` | 시리얼 등록 시 자녀 업그레이드 |
| `utils/firestore.ts` | `createRecord(...)` | 학습 기록 저장 (KST 기준 날짜) |
| `utils/firestore.ts` | `getChildren(parentId)` | 부모의 자녀 목록 조회 |

---

## 🎨 6. 핵심 개발 패턴

### 패턴 1: KST 기준 날짜 생성

**문제**: Firestore에 학습 기록 저장 시 UTC 기준으로 날짜가 저장되면 한국 시간대에서 날짜가 하루 차이날 수 있습니다.

**해결**: KST(UTC+9) 기준으로 날짜를 계산하여 저장합니다.

**코드 예시**:
```typescript
// 한국 시간(KST, UTC+9) 기준 오늘 날짜 생성
const now = new Date();
const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
const kstDate = new Date(kstTime);
const dateStr = kstDate.getUTCFullYear() + '-' +
                String(kstDate.getUTCMonth() + 1).padStart(2, '0') + '-' +
                String(kstDate.getUTCDate()).padStart(2, '0');

console.log("저장할 dateStr:", dateStr); // "2026-03-12"
```

**재사용 가이드**:
- 학습 기록 저장 시: `utils/firestore.ts`의 `createRecord` 함수 참고
- 홈 화면 통계 조회 시: `app/(tabs)/home.tsx`의 `loadMonthlyData` 함수 참고
- 성장 리포트 조회 시: `app/(tabs)/growth.tsx`의 `loadData` 함수 참고

**주의사항**:
- ❌ `new Date().toISOString().split('T')[0]` (UTC 기준 - 한국에서 하루 차이)
- ✅ 위 코드 패턴 사용 (KST 기준)

---

### 패턴 2: AI 피드백 태그 파싱

**파일**: `app/(tabs)/growth.tsx`
**함수**: `parseAIComment(text: string)`

**입력 형식**:
```
[요약] 오늘은 수학 3문제를 풀었어요
[수학] 곱셈 문제를 잘 풀었어요
[과학] 식물 문제에서 어려움이 있었어요
[응원] 꾸준히 잘하고 있어요!
[팁] 틀린 문제를 다시 풀어보세요
```

**출력 구조**:
```typescript
interface ParsedComment {
  summary?: string;
  subjects: { name: string; content: string }[];
  encouragement?: string;
  tip?: string;
  hasStructure: boolean;
}
```

**코드 예시**:
```typescript
function parseAIComment(text: string) {
  try {
    const lines = text.split('\n').filter(line => line.trim());
    let summary = '';
    const subjects: { name: string; content: string }[] = [];
    let encouragement = '';
    let tip = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('[요약]')) {
        summary = line.replace('[요약]', '').trim();
      } else if (line.startsWith('[통합교과]') || line.startsWith('[국어]') ||
                 line.startsWith('[수학]') || line.startsWith('[과학]') ||
                 line.startsWith('[사회]') || line.startsWith('[영어]')) {
        const match = line.match(/\[(.*?)\](.*)/);
        if (match) {
          subjects.push({ name: match[1], content: match[2].trim() });
        }
      } else if (line.startsWith('[응원]')) {
        encouragement = line.replace('[응원]', '').trim();
      } else if (line.startsWith('[팁]')) {
        tip = line.replace('[팁]', '').trim();
      }
    }

    return { summary, subjects, encouragement, tip, hasStructure: summary || subjects.length > 0 };
  } catch (error) {
    return { summary: '', subjects: [], encouragement: '', tip: '', hasStructure: false };
  }
}
```

**재사용 가이드**:
이 패턴을 다른 곳에 적용할 때는:
1. 태그명만 변경 (예: `[요약]` → `[분석]`)
2. 파싱 로직 구조는 유지
3. **Fallback 처리 반드시 포함** (`hasStructure` 확인 후 원본 텍스트 표시)

**렌더링 예시**:
```typescript
const renderDailyAIComment = () => {
  const parsed = parseAIComment(aiDailyComment);

  // 파싱 실패 시 원본 텍스트 표시 (fallback)
  if (!parsed.hasStructure) {
    return <Text style={styles.aiTextPaid}>{aiDailyComment}</Text>;
  }

  // 구조화된 표시
  return (
    <View>
      {parsed.summary ? (
        <>
          <Text style={styles.aiSummaryText}>📊 {parsed.summary}</Text>
          {parsed.subjects.length > 0 && <View style={styles.aiDivider} />}
        </>
      ) : null}

      {parsed.subjects.map((subject, index) => (
        <Text key={index} style={styles.aiSubjectText}>
          • {subject.name}: {subject.content}
        </Text>
      ))}

      {parsed.encouragement ? (
        <>
          {parsed.subjects.length > 0 && <View style={styles.aiDivider} />}
          <Text style={styles.aiEncouragementText}>💪 {parsed.encouragement}</Text>
        </>
      ) : null}

      {parsed.tip ? (
        <>
          <View style={styles.aiDivider} />
          <Text style={styles.aiTipText}>💡 {parsed.tip}</Text>
        </>
      ) : null}
    </View>
  );
};
```

---

### 패턴 3: Firebase 쿼리

**기본 구조**:
```typescript
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

// 1. Collection 참조
const collectionRef = collection(db, 'CollectionName');

// 2. 쿼리 생성
const q = query(
  collectionRef,
  where('field', '==', value),
  orderBy('createdAt', 'desc'),
  limit(10)
);

// 3. 실행
const snapshot = await getDocs(q);
const data = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

**자녀 학습 기록 조회 예시**:
```typescript
const parentId = await AsyncStorage.getItem('parentId');
const childId = await AsyncStorage.getItem('childId');

const recordsRef = collection(db, 'Parents', parentId, 'Children', childId, 'Records');
const monthStr = "2026-03"; // 예시

const q = query(
  recordsRef,
  where('date', '>=', monthStr + '-01'),
  where('date', '<=', monthStr + '-31')
);

const snapshot = await getDocs(q);
snapshot.forEach((doc) => {
  const data = doc.data();
  console.log(data.subject, data.score);
});
```

**단일 문서 조회 예시**:
```typescript
const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
if (childDoc.exists()) {
  const childData = childDoc.data();
  console.log(childData.name, childData.tier);
}
```

---

### 패턴 4: 에러 처리 (UI 표시)

**금지**:
```typescript
// ❌ Alert.alert 사용 금지 (bolt.new 환경에서 동작 안 함)
Alert.alert('오류', '데이터를 불러올 수 없습니다');
```

**올바른 방법**:
```typescript
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(true);

// 데이터 로드
const loadData = async () => {
  try {
    setLoading(true);
    setError(null);

    // Firestore 조회
    const data = await fetchData();

    setLoading(false);
  } catch (err) {
    console.log('데이터 로드 실패:', err);
    setError('데이터를 불러올 수 없습니다. 다시 시도해주세요.');
    setLoading(false);
  }
};

// UI 렌더링
return (
  <View style={styles.container}>
    {loading && <ActivityIndicator size="large" color="#7ED4C0" />}

    {error && (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadData}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    )}

    {!loading && !error && (
      <Text>데이터 표시</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#7ED4C0',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
});
```

---

### 패턴 5: AsyncStorage 사용

**저장**:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('parentId', parentId);
await AsyncStorage.setItem('childId', childId);
await AsyncStorage.setItem('childName', childName);
await AsyncStorage.setItem('childGrade', String(grade));
await AsyncStorage.setItem('childTier', tier);
```

**조회**:
```typescript
const parentId = await AsyncStorage.getItem('parentId');
const childId = await AsyncStorage.getItem('childId');
const childName = await AsyncStorage.getItem('childName');
const childGrade = await AsyncStorage.getItem('childGrade');
const childTier = await AsyncStorage.getItem('childTier');

if (!parentId || !childId) {
  // 로그인 필요
  router.replace('/(auth)/login');
  return;
}
```

**삭제**:
```typescript
await AsyncStorage.removeItem('childId');
```

---

### 패턴 6: 날짜 기반 시드 셔플 (문제 순서 고정)

**목적**: 같은 날짜에는 같은 순서로 문제를 제공하여, 하루에 여러 번 접속해도 동일한 문제 세트를 보여줍니다.

**파일**: `app/study/questions.tsx`

**코드 예시**:
```typescript
// 날짜 기반 시드 셔플 함수
const seededShuffle = (array: any[], seed: number) => {
  const arr = [...array];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// KST 기준 오늘 날짜로 시드 생성
const getTodaySeed = (subject: string) => {
  const now = new Date();
  const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
  const kstDate = new Date(kstTime);
  const dateStr = kstDate.getUTCFullYear() + '' +
                  String(kstDate.getUTCMonth() + 1).padStart(2, '0') +
                  String(kstDate.getUTCDate()).padStart(2, '0');

  // 날짜 + 과목을 조합하여 시드 생성 (같은 날이라도 과목별로 다른 문제 세트)
  let hash = 0;
  const seedStr = dateStr + subject;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) || 1;
};

// 사용 예시
const todaySeed = getTodaySeed('math'); // "20260312math" → 숫자 시드
const shuffled = seededShuffle(allProblems, todaySeed);
const selected = shuffled.slice(0, maxQuestions);
```

**재사용 가이드**:
- 같은 날짜에 같은 순서가 필요한 모든 리스트에 적용 가능
- `getTodaySeed`의 인자를 변경하여 다른 카테고리별로 시드 생성 가능

---

### 패턴 7: 시리얼 만료 체크 및 자동 전환

**파일**: `utils/firestore.ts`
**함수**: `checkSerialExpiry(parentId: string)`

**규칙**:
1. 배움/스카이 만료 시 → `tier: "expired"`, `isLocked: true`
2. 단, 무료 자녀가 0명이면 → 만료된 자녀 중 1명만 `tier: "free"`, `isLocked: false`로 전환
3. 무료는 항상 1명만 활성

**코드 흐름**:
```typescript
export async function checkSerialExpiry(parentId: string) {
  const childrenRef = collection(db, 'Parents', parentId, 'Children');
  const snap = await getDocs(childrenRef);

  const now = new Date();
  const expiredChildren: { id: string; name: string }[] = [];
  let freeCount = 0;

  // 1. 만료된 자녀 찾기
  snap.forEach((childDoc) => {
    const data = childDoc.data();
    if (data.isDeleted === true) return;

    if (data.tier === 'free' && data.isLocked !== true) {
      freeCount++;
    }

    if (data.tier === 'baeum' && data.serialExpiry) {
      const expiryDate = new Date(data.serialExpiry + 'T23:59:59');
      if (now > expiryDate) {
        expiredChildren.push({ id: childDoc.id, name: data.name || '자녀' });
      }
    }
  });

  // 2. 만료된 자녀 처리
  for (const expired of expiredChildren) {
    if (freeCount === 0) {
      // 무료가 0명이면 첫 번째 만료 자녀를 무료로 전환
      await updateDoc(doc(db, 'Parents', parentId, 'Children', expired.id), {
        tier: 'free',
        isLocked: false,
        serialCode: '',
        serialExpiry: null,
      });
      freeCount++;
    } else {
      // 무료가 이미 있으면 잠금 처리
      await updateDoc(doc(db, 'Parents', parentId, 'Children', expired.id), {
        tier: 'expired',
        isLocked: true,
      });
    }
  }

  return {
    expiredChildren: expiredChildren.map(c => c.name),
    hasExpired: expiredChildren.length > 0,
  };
}
```

**호출 위치**:
- `app/(tabs)/home.tsx`의 `useEffect`에서 `checkExpiry()` 호출
- 홈 화면 로드 시 자동으로 만료 체크 수행

---

## 🚀 7. 자주 하는 작업 가이드

### 작업 1: 새 화면 추가

**단계**:
1. `app/` 디렉토리 하위에 파일 생성 (예: `app/myscreen.tsx`)
2. 기본 구조 작성:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function MyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text>My Screen</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});
```
3. 다른 화면에서 이동:
```typescript
router.push('/myscreen');
```

---

### 작업 2: Firebase 컬렉션 추가

**단계**:
1. `utils/firestore.ts`에 인터페이스 정의:
```typescript
export interface MyData {
  id: string;
  name: string;
  createdAt: any;
}
```

2. CRUD 함수 생성:
```typescript
export const createMyData = async (data: Omit<MyData, 'id'>) => {
  const ref = doc(collection(db, 'MyCollection'));
  await setDoc(ref, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
};

export const getMyData = async () => {
  const snapshot = await getDocs(collection(db, 'MyCollection'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MyData));
};
```

3. 화면에서 사용:
```typescript
import { getMyData } from '../../utils/firestore';

const loadData = async () => {
  const data = await getMyData();
  console.log(data);
};
```

---

### 작업 3: AI 피드백 형식 추가

**단계**:
1. `parseAIComment` 함수에 새 태그 추가:
```typescript
} else if (line.startsWith('[새태그]')) {
  newField = line.replace('[새태그]', '').trim();
}
```

2. 인터페이스 업데이트:
```typescript
interface ParsedComment {
  summary?: string;
  subjects: { name: string; content: string }[];
  encouragement?: string;
  tip?: string;
  newField?: string; // 추가
  hasStructure: boolean;
}
```

3. 렌더링 로직 추가:
```typescript
{parsed.newField ? (
  <Text style={styles.newFieldText}>🆕 {parsed.newField}</Text>
) : null}
```

---

### 작업 4: 새 과목 추가

**단계**:
1. `SUBJECT_LABELS` 상수 업데이트 (모든 관련 파일):
```typescript
const SUBJECT_LABELS: Record<string, string> = {
  korean: '국어',
  math: '수학',
  integrated: '통합교과',
  science: '과학',
  social: '사회',
  english: '영어',
  art: '미술', // 추가
};
```

2. `createChild` 함수에서 `subjects` 배열 업데이트:
```typescript
subjects: data.grade <= 2
  ? ['korean', 'math', 'integrated', 'art']
  : ['korean', 'math', 'science', 'social', 'english', 'art'],
```

3. Firestore `Problems` 컬렉션에 새 과목 문제 추가

---

## 📝 8. 테스트 데이터

### 부모 계정
- **ID**: `test-parent-001`
- **Email**: `test@baeum.app`

### 자녀 계정

| 문서 ID | 이름 | tier | isLocked | serialCode |
|---------|------|------|----------|------------|
| `4ObJ7IUKChKr7ivTMr4i` | 후니친구 | free | false | - |
| `ZREGv9wY2hlp6h8XVBS5` | 지훈이집중 | baeum | false | 26JH26A7K3 |

### 시리얼 코드

| 코드 | calendarYear | expiry | isUsed |
|------|--------------|--------|--------|
| `26JH26A7K3` | 2026 | 2027-02-28 | true |
| `26TEST0001` | 2026 | 2027-02-28 | false |

---

## ⚠️ 9. 알려진 이슈 및 주의사항

### 9-1. bolt.new 환경 제한

**React Native Modal 컴포넌트**
bolt.new 웹 프리뷰에서 터치 이벤트가 차단됨. Modal 내부 버튼이 동작하지 않는 문제 발생.
**해결**: Modal 대신 conditional View overlay 사용 또는 페이지 이동 방식으로 변경

**Alert.alert**
bolt.new 웹 프리뷰에서 동작하지 않음.
**해결**: UI에 에러 메시지 표시 (패턴 4 참고)

**useFocusEffect**
bolt.new 프리뷰에서 동작하지 않음.
**해결**: `useEffect`와 `useFocusEffect` 조합 사용 (home.tsx 참고)

### 9-2. 데이터 일관성

- `isLocked` 필드가 일부 자녀 문서에 존재하지 않을 수 있음 → `data.isLocked || false` 방어 처리
- `tier` 필드가 없는 자녀는 `"free"`로 간주 → `data.tier || 'free'`

### 9-3. 시리얼 필드명 차이

초기 시리얼 문서는 `expiryDate` 필드 사용, 최신 구조는 `expiry` 사용
→ 코드에서 `expiry` 필드를 읽으므로 기존 문서도 `expiry`로 통일 필요

---

## 🔧 10. 개발 필요 항목 (미완료)

### 10-1. 잠긴 자녀 학습 차단 (우선순위: 높음)

**현재 상태**: 잠긴 자녀로 셀렉트 화면 진입은 차단되지만, 이미 홈에 들어와 있는 상태에서 스터디/성장 탭 접근이 차단되지 않습니다.

**필요 작업**:
- `app/(tabs)/study.tsx`: 화면 로드 시 현재 자녀의 `isLocked` / `tier === "expired"` 체크. 잠금 상태면 학습 불가 안내 표시
- `app/(tabs)/growth.tsx`: 동일한 잠금 체크 추가

**권장 구현**:
```typescript
useEffect(() => {
  const checkLock = async () => {
    const parentId = await AsyncStorage.getItem('parentId');
    const childId = await AsyncStorage.getItem('childId');
    if (!parentId || !childId) return;

    const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
    if (childDoc.exists()) {
      const data = childDoc.data();
      if (data.isLocked === true || data.tier === 'expired') {
        setIsLocked(true);
        // UI에 잠금 오버레이 표시 또는 자녀관리로 리다이렉트
      }
    }
  };

  checkLock();
}, []);
```

### 10-2. 스카이 회원 구독 시스템 (우선순위: 중간)

**현재 상태**: 완전 미개발

**필요 작업**:
- 구독 결제 화면 개발
- 결제 연동 (인앱 결제 또는 외부 결제)
- 구독 상태 관리 (`tier: "sky"`)
- 구독 취소/만료 시 처리 로직

### 10-3. 시리얼 입력 화면 UX 개선 (우선순위: 낮음)

이미 시리얼이 등록된 자녀가 시리얼 입력 화면에 들어가면 "인증완료" 상태 표시 필요

---

## 📚 11. 참고 자료

### 주요 상수

**Tier 라벨 및 색상**:
```typescript
const TIER_LABELS: Record<string, string> = {
  free: '무료회원',
  baeum: '배움회원',
  sky: '스카이회원',
};

const TIER_COLORS: Record<string, string> = {
  free: '#E0E0E0',
  baeum: '#4ECDC4',
  sky: '#87CEEB',
};

const TIER_TEXT_COLORS: Record<string, string> = {
  free: '#666666',
  baeum: '#FFFFFF',
  sky: '#333333',
};
```

**과목 라벨**:
```typescript
const SUBJECT_LABELS: Record<string, string> = {
  korean: '국어',
  math: '수학',
  integrated: '통합교과',
  science: '과학',
  social: '사회',
  english: '영어',
};
```

### 네비게이션 경로

```typescript
router.push('/(auth)/login');           // 로그인
router.push('/(auth)/select-child');    // 자녀 선택
router.push('/(tabs)/home');            // 홈
router.push('/(tabs)/study');           // 스터디
router.push('/(tabs)/growth');          // 성장
router.push('/(tabs)/menu');            // 메뉴
router.push('/children/manage');        // 자녀 관리
router.push('/serial/enter');           // 시리얼 입력
router.push({
  pathname: '/study/questions',
  params: { subject: 'math', grade: '3', tier: 'baeum' }
});                                     // 문제 풀이
```

---

## 🎯 12. 외부 AI 작업 시작 템플릿

외부 AI(ChatGPT, Claude, Cursor 등)에게 전달하는 프롬프트 예시:

```
나는 Expo 기반 초등학생 학습 앱을 개발 중입니다.

아래는 프로젝트 개발 가이드입니다:

---
[이 HANDOVER.md 전체 내용 붙여넣기]
---

현재 작업이 필요한 파일:

[작업할 파일 내용 붙여넣기]

---

요청사항:
[구체적인 작업 내용]

조건:
1. 기존 개발 패턴 준수 (특히 KST 날짜 계산, AI 피드백 파싱)
2. StyleSheet.create만 사용 (NativeWind 금지)
3. Alert 사용 금지 (UI 에러 표시)
4. Firestore 쿼리 패턴 유지
```

---

## ✅ 13. 변경 이력

### 2026-03-12
- [작성] 외부 AI 전달용 HANDOVER.md 초안 작성
- [추가] 핵심 개발 패턴 7가지 문서화
- [추가] 자주 하는 작업 가이드 4가지
- [추가] 테스트 데이터 및 참고 자료

---

**이 문서를 외부 AI에게 전달하면, 프로젝트의 모든 규칙과 패턴을 이해하고 기존 코드 스타일을 유지하면서 작업을 이어갈 수 있습니다.**
