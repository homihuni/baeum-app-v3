import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp } from '../../utils/responsive';

const SUBJECT_LABELS: Record<string,string> = {
  korean:'국어', math:'수학', integrated:'통합교과',
  science:'과학', social:'사회', english:'영어'
};

export default function GrowthScreen() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(true);
  // 잠금 상태 (isLocked: true 또는 tier: "expired" 인 경우)
  const [isLocked, setIsLocked] = useState(false);
  const [todayStats, setTodayStats] = useState<Record<string,{correct:number,wrong:number}>>({});
  const [monthlyStats, setMonthlyStats] = useState({accessDays:0,totalProblems:0,correctCount:0,average:0});
  const [streakDays, setStreakDays] = useState(0);
  const [aiDailyComment, setAiDailyComment] = useState('');
  const [aiDailyLoading, setAiDailyLoading] = useState(false);
  const [aiMonthlyComment, setAiMonthlyComment] = useState('');
  const [aiMonthlyLoading, setAiMonthlyLoading] = useState(false);
  const [showFreeModal, setShowFreeModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 자녀 데이터 로드 및 잠금 상태 체크
  const loadData = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      if (!parentId || !childId) return;

      const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
      let currentTier = 'free';

      if (childDoc.exists()) {
        const childData = childDoc.data();
        if (childData.name) setChildName(childData.name);

        // 잠금 상태 체크: isLocked가 true이거나 tier가 expired이면 화면 차단
        if (childData.isLocked === true || childData.tier === 'expired') {
          setIsLocked(true);
          return;
        } else {
          setIsLocked(false);
        }

        if (childData.tier) {
          currentTier = childData.tier;
          setTier(childData.tier);
        } else {
          const parentDoc = await getDoc(doc(db, 'Parents', parentId));
          if (parentDoc.exists()) {
            currentTier = parentDoc.data()?.tier || 'free';
            setTier(currentTier);
          }
        }
      }

      const now = new Date();
      const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const todayStr = kstNow.toISOString().split('T')[0];
      const monthStr = todayStr.substring(0, 7);

      const recordsRef = collection(db, 'Parents', parentId, 'Children', childId, 'Records');
      const allSnap = await getDocs(recordsRef);
      const allRecords: any[] = [];
      allSnap.forEach((d) => allRecords.push(d.data()));

      // 오늘 기록
      const todayRecords = allRecords.filter(r => r.date === todayStr);
      const todayMap: Record<string,{correct:number,wrong:number}> = {};
      todayRecords.forEach((data) => {
        const subj = data.subject || 'unknown';
        if (!todayMap[subj]) todayMap[subj] = {correct:0, wrong:0};
        todayMap[subj].correct += data.correctCount || 0;
        todayMap[subj].wrong += data.wrongCount || 0;
      });
      setTodayStats(todayMap);

      // 이번달 기록
      const monthRecords = allRecords.filter(r => r.date && r.date.startsWith(monthStr));
      const daysSet = new Set<string>();
      let total = 0, correct = 0, totalScore = 0, scoreCount = 0;
      monthRecords.forEach((data) => {
        if (data.date) daysSet.add(data.date);
        total += data.totalQuestions || 0;
        correct += data.correctCount || 0;
        if (data.score !== undefined) { totalScore += data.score; scoreCount++; }
      });
      const avg = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
      setMonthlyStats({accessDays: daysSet.size, totalProblems: total, correctCount: correct, average: avg});

      // 연속 학습 계산
      let streak = 0;
      const checkDate = new Date(kstNow);
      for (let i = 0; i < 30; i++) {
        const ds = checkDate.toISOString().split('T')[0];
        if (daysSet.has(ds)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        } else {
          break;
        }
      }
      setStreakDays(streak);

      // AI 피드백
      const hasTodayLearning = todayRecords.length > 0;
      if (currentTier === 'baeum' || currentTier === 'sky') {
        await loadDailyAIComment(parentId, childId, todayStr, hasTodayLearning, currentTier);
      }
      if (currentTier === 'sky') {
        await loadMonthlyAIComment(parentId, childId, monthStr);
      }

    } catch (error) {
      console.log('Growth load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyAIComment = async (parentId: string, childId: string, todayStr: string, hasTodayLearning: boolean, currentTier: string) => {
    try {
      if (!hasTodayLearning) {
        setAiDailyComment('오늘 학습 기록이 없습니다. 문제를 풀면 AI 분석을 받을 수 있어요!');
        return;
      }
      const aiCommentRef = doc(db, 'Parents', parentId, 'Children', childId, 'AIComments', todayStr);
      const aiCommentSnap = await getDoc(aiCommentRef);
      if (aiCommentSnap.exists()) {
        setAiDailyComment(aiCommentSnap.data().analysis || '');
        return;
      }
      setAiDailyLoading(true);
      const childStoreName = await AsyncStorage.getItem('childName');
      const childGrade = await AsyncStorage.getItem('childGrade');
      const response = await fetch('https://us-central1-baeum-app.cloudfunctions.net/generateAIComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { childId, childName: childStoreName || '학생', grade: childGrade || '1', tier: currentTier, parentId } })
      });
      const result = await response.json();
      const data = result.result;
      if (data?.success && data?.analysis) {
        setAiDailyComment(data.analysis);
      } else {
        setAiDailyComment('AI 분석을 생성하는데 실패했습니다.');
      }
    } catch (error) {
      setAiDailyComment('AI 분석을 불러올 수 없습니다.');
    } finally {
      setAiDailyLoading(false);
    }
  };

  const loadMonthlyAIComment = async (parentId: string, childId: string, monthStr: string) => {
    try {
      const aiMonthlyRef = doc(db, 'Parents', parentId, 'Children', childId, 'AIMonthly', monthStr);
      const aiMonthlySnap = await getDoc(aiMonthlyRef);
      if (aiMonthlySnap.exists()) {
        setAiMonthlyComment(aiMonthlySnap.data().analysis || '');
        return;
      }
      setAiMonthlyLoading(true);
      const childStoreName = await AsyncStorage.getItem('childName');
      const childGrade = await AsyncStorage.getItem('childGrade');
      const response = await fetch('https://us-central1-baeum-app.cloudfunctions.net/generateMonthlyAIComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { childId, childName: childStoreName || '학생', grade: childGrade || '1', parentId, month: monthStr } })
      });
      const result = await response.json();
      const data = result.result;
      if (data?.success && data?.analysis) {
        setAiMonthlyComment(data.analysis);
      } else {
        setAiMonthlyComment('AI 월간 분석을 생성하는데 실패했습니다.');
      }
    } catch (error) {
      setAiMonthlyComment('AI 월간 분석을 불러올 수 없습니다.');
    } finally {
      setAiMonthlyLoading(false);
    }
  };

  const parseAIComment = (text: string) => {
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
          if (match) subjects.push({ name: match[1], content: match[2].trim() });
        } else if (line.startsWith('[응원]')) {
          encouragement = line.replace('[응원]', '').trim();
        } else if (line.startsWith('[팁]')) {
          tip = line.replace('[팁]', '').trim();
        }
      }
      return { summary, subjects, encouragement, tip, hasStructure: !!(summary || subjects.length > 0) };
    } catch {
      return { summary: '', subjects: [], encouragement: '', tip: '', hasStructure: false };
    }
  };

  const renderDailyAIComment = () => {
    if (tier === 'free' || tier === 'expired') {
      return (
        <View style={styles.aiCommentContainer}>
          <Text style={styles.aiTextFree}>오늘 학습 기록이 있으면 여기에 AI 분석이 표시됩니다.</Text>
          <View style={styles.blurContainer}>
            <Text style={styles.dummyText}>
              과목별 상세 분석 내용이 여기에 표시됩니다...{'\n'}
              더 자세한 학습 분석과 맞춤 코멘트를 확인할 수 있어요.{'\n'}
              배움회원이 되면 AI가 학습 패턴을 분석해드려요.
            </Text>
            <View style={styles.blurOverlay} />
            <View style={styles.lockMessageContainer}>
              <Ionicons name="lock-closed" size={16} color="#7ED4C0" />
              <Text style={styles.lockText1}>배움회원 이상 업그레이드 하면</Text>
              <Text style={styles.lockText2}>AI 맞춤 학습 분석을 볼 수 있어요</Text>
            </View>
          </View>
        </View>
      );
    }
    if (aiDailyLoading) {
      return (
        <View style={styles.aiLoadingContainer}>
          <ActivityIndicator size="small" color="#7ED4C0" />
          <Text style={styles.aiLoadingText}>AI가 분석 중입니다...</Text>
        </View>
      );
    }
    if (!aiDailyComment) return null;

    const parsed = parseAIComment(aiDailyComment);
    if (!parsed.hasStructure) {
      return <Text style={styles.aiTextPaid}>{aiDailyComment}</Text>;
    }
    return (
      <View>
        {parsed.summary ? (
          <>
            <Text style={styles.aiSummaryText}>📊 {parsed.summary}</Text>
            {parsed.subjects.length > 0 && <View style={styles.aiDivider} />}
          </>
        ) : null}
        {parsed.subjects.map((subject, index) => (
          <Text key={index} style={styles.aiSubjectText}>• {subject.name}: {subject.content}</Text>
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

  const renderMonthlyAIComment = () => {
    if (tier !== 'sky') {
      return (
        <View style={styles.upgradeCard}>
          <Ionicons name="lock-closed" size={24} color="#7ED4C0" style={{marginBottom: 8}} />
          <Text style={styles.upgradeText}>스카이 회원 전용 기능입니다</Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/settings/grade')}
          >
            <Text style={styles.upgradeButtonText}>업그레이드</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (aiMonthlyLoading) {
      return (
        <View style={styles.aiLoadingContainer}>
          <ActivityIndicator size="small" color="#7ED4C0" />
          <Text style={styles.aiLoadingText}>월간 분석을 생성하고 있어요...</Text>
        </View>
      );
    }
    if (!aiMonthlyComment) {
      return <Text style={styles.emptyText}>월간 분석 데이터가 없습니다.</Text>;
    }
    return <Text style={styles.aiTextPaid}>{aiMonthlyComment}</Text>;
  };

  const handleReportPress = () => {
    if (tier === 'free') {
      setShowFreeModal(true);
    } else {
      router.push('/growth/report');
    }
  };

  // 로딩 화면
  if (loading) {
    return (
      <SafeLayout showHeader headerTitle="성장 리포트">
        <ActivityIndicator size="large" color="#7ED4C0" style={{marginTop: 100}} />
      </SafeLayout>
    );
  }

  // 잠긴 자녀 안내 화면
  if (isLocked) {
    return (
      <SafeLayout showHeader headerTitle="성장 리포트">
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={56} color="#9E9E9E" style={styles.lockedIcon} />
          <Text style={styles.lockedTitle}>학습이 제한된 계정입니다</Text>
          <Text style={styles.lockedSubtitle}>시리얼 번호를 등록하거나{'\n'}업그레이드하세요</Text>
          <TouchableOpacity
            style={styles.lockedButton}
            onPress={() => router.push('/children/manage')}
          >
            <Text style={styles.lockedButtonText}>자녀관리로 이동</Text>
          </TouchableOpacity>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout showHeader headerTitle="성장 리포트">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* 자녀 이름 서브타이틀 */}
        <Text style={styles.subtitle}>{childName || '학생'}의 학습 현황</Text>

        {/* AI 하루 피드백 */}
        <View style={styles.aiCard}>
          <Text style={styles.cardTitleSmall}>🤖 AI 하루 피드백</Text>
          {renderDailyAIComment()}
        </View>

        {/* AI 월간 종합 분석 */}
        {(tier === 'baeum' || tier === 'sky') && (
          <View style={styles.aiCard}>
            <Text style={styles.cardTitleSmall}>📈 AI 종합 분석 (월간)</Text>
            {renderMonthlyAIComment()}
          </View>
        )}

        {/* 오늘의 학습 */}
        <View style={styles.cardSmall}>
          <Text style={styles.cardTitleSmall}>📊 오늘의 학습</Text>
          {Object.keys(todayStats).length === 0 ? (
            <Text style={styles.emptyText}>오늘 아직 학습 기록이 없어요</Text>
          ) : (
            Object.entries(todayStats).map(([subj, stat]) => (
              <View key={subj} style={styles.subjectRow}>
                <Text style={styles.subjectNameSmall}>{SUBJECT_LABELS[subj] || subj}</Text>
                <View style={styles.subjectStats}>
                  <Text style={styles.correctTextSmall}>✅ {stat.correct}</Text>
                  <Text style={styles.wrongTextSmall}>❌ {stat.wrong}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 월간 통계 */}
        <View style={styles.cardSmall}>
          <Text style={styles.cardTitleSmall}>📅 {new Date().getMonth() + 1}월 학습 통계</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValueSmall}>{monthlyStats.accessDays}일</Text>
              <Text style={styles.statLabelSmall}>학습일</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValueSmall}>{monthlyStats.totalProblems}개</Text>
              <Text style={styles.statLabelSmall}>문제풀이수</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValueSmall, {color:'#7ED4C0'}]}>{monthlyStats.average}점</Text>
              <Text style={styles.statLabelSmall}>평균 정답률</Text>
            </View>
          </View>
        </View>

        {/* 연속 학습 */}
        <View style={styles.cardSmall}>
          <Text style={styles.cardTitleSmall}>🔥 연속 학습</Text>
          <Text style={styles.streakValueSmall}>{streakDays}일 연속 학습 중!</Text>
          <Text style={styles.streakSubSmall}>
            {streakDays >= 7 ? '일주일 넘게 연속 학습 중! 대단해요! 🎉'
              : streakDays >= 3 ? '잘하고 있어요! 7일 연속에 도전해봐요!'
              : '매일 꾸준히 학습해봐요!'}
          </Text>
        </View>

        {/* 버튼들 — marginHorizontal: wp(4) 반응형 */}
        <TouchableOpacity style={styles.reportBtn} onPress={handleReportPress}>
          <Text style={styles.reportText}>상세 리포트 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.membershipBtn}
          onPress={() => router.push('/settings/grade')}
        >
          <Text style={styles.membershipText}>회원 등급 안내</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 무료회원 차단 모달 */}
      <Modal
        visible={showFreeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFreeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="lock-closed" size={32} color="#7ED4C0" style={{marginBottom: 12}} />
            <Text style={styles.modalMessage}>
              상세 리포트는 배움회원 이상만{'\n'}이용할 수 있어요.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowFreeModal(false)}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  // 스크롤 — paddingHorizontal: wp(5) 반응형
  scroll: { paddingHorizontal: wp(5), paddingTop: 20, paddingBottom: 100 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },

  // 잠금 화면 — paddingHorizontal: wp(8) 반응형
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  lockedIcon: {
    marginBottom: 20,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  lockedSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  lockedButton: {
    backgroundColor: '#7ED4C0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minWidth: 180,
    alignItems: 'center',
  },
  lockedButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // AI 카드
  aiCard: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 12 },
  aiCommentContainer: {},
  aiTextFree: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 8 },
  blurContainer: { position: 'relative', marginTop: 8 },
  dummyText: { fontSize: 14, color: '#DDD', lineHeight: 22 },
  blurOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.85)' },
  lockMessageContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', gap: 4 },
  lockText1: { fontSize: 13, color: '#666', textAlign: 'center' },
  lockText2: { fontSize: 13, color: '#7ED4C0', fontWeight: 'bold', textAlign: 'center' },
  aiTextPaid: { fontSize: 14, color: '#444', lineHeight: 22 },
  aiLoadingContainer: { alignItems: 'center', paddingVertical: 12 },
  aiLoadingText: { fontSize: 12, color: '#999', marginTop: 8 },
  aiSummaryText: { fontSize: 15, fontWeight: 'bold', color: '#333', lineHeight: 22, marginBottom: 8 },
  aiDivider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10 },
  aiSubjectText: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 4 },
  aiEncouragementText: { fontSize: 14, fontWeight: 'bold', color: '#7ED4C0', lineHeight: 22, marginTop: 4 },
  aiTipText: { fontSize: 13, color: '#666', lineHeight: 20, marginTop: 4, fontStyle: 'italic' },

  // 일반 카드
  cardSmall: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitleSmall: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },

  // 업그레이드 카드
  upgradeCard: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, alignItems: 'center' },
  upgradeText: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 12 },
  upgradeButton: { backgroundColor: '#7ED4C0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  upgradeButtonText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },

  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 12 },

  // 오늘의 학습
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  subjectNameSmall: { fontSize: 13, fontWeight: '600', color: '#333' },
  subjectStats: { flexDirection: 'row', gap: 16 },
  correctTextSmall: { fontSize: 14, color: '#4CAF50', fontWeight: 'bold' },
  wrongTextSmall: { fontSize: 14, color: '#FF6B6B', fontWeight: 'bold' },

  // 월간 통계
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  statItem: { alignItems: 'center' },
  statValueSmall: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabelSmall: { fontSize: 10, color: '#999', marginTop: 2 },

  // 연속 학습
  streakValueSmall: { fontSize: 18, fontWeight: 'bold', color: '#FF9800', textAlign: 'center', marginTop: 4 },
  streakSubSmall: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 6 },

  // 버튼 — marginHorizontal: wp(4) 반응형
  reportBtn: { backgroundColor: '#7ED4C0', borderRadius: 12, paddingVertical: 14, marginHorizontal: wp(4), alignItems: 'center', marginBottom: 10, marginTop: 8 },
  reportText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  membershipBtn: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#7ED4C0', borderRadius: 12, paddingVertical: 14, marginHorizontal: wp(4), alignItems: 'center', marginBottom: 20 },
  membershipText: { fontSize: 16, fontWeight: 'bold', color: '#7ED4C0' },

  // 모달
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, width: '90%', maxWidth: 400, alignItems: 'center' },
  modalMessage: { fontSize: 15, color: '#333', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  modalButton: { backgroundColor: '#7ED4C0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  modalButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});
