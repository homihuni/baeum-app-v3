import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBJECT_LABELS: Record<string,string> = {korean:'국어',math:'수학',integrated:'통합교과',science:'과학',social:'사회',english:'영어'};

export default function GrowthScreen() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(true);
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

  const loadData = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      if (!parentId || !childId) return;

      const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
      if (childDoc.exists()) {
        const childData = childDoc.data();
        console.log('=== growth.tsx Firebase childData.tier:', childData?.tier);
        console.log('=== growth.tsx Firebase childData:', childData);

        if (childData.name) setChildName(childData.name);

        if (childData.tier) {
          setTier(childData.tier);
          console.log('=== growth.tsx 최종 tier state:', childData.tier);
        } else {
          const parentDoc = await getDoc(doc(db, 'Parents', parentId));
          if (parentDoc.exists()) {
            const parentData = parentDoc.data();
            const userTier = parentData.tier || 'free';
            setTier(userTier);
            console.log('=== growth.tsx Parent tier:', userTier);
            console.log('=== growth.tsx 최종 tier state:', userTier);
          }
        }
      }

      // 한국 시간(KST) 기준 오늘 날짜
      const now = new Date();
      const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const todayStr = kstNow.toISOString().split('T')[0];
      const monthStr = todayStr.substring(0, 7); // "2026-02"
      console.log("=== 성장 리포트 오늘 날짜(KST) ===", todayStr);
      console.log("=== 이번달 ===", monthStr);

      // 전체 Records를 가져와서 JS에서 필터링 (Firestore 인덱스 문제 회피)
      const recordsRef = collection(db, 'Parents', parentId, 'Children', childId, 'Records');
      const allSnap = await getDocs(recordsRef);
      console.log("=== 전체 Records 수 ===", allSnap.size);

      const allRecords: any[] = [];
      allSnap.forEach((d) => {
        allRecords.push(d.data());
      });

      // 각 record의 date 필드 확인 로그
      allRecords.forEach((r, i) => {
        console.log("=== Record", i, "date:", r.date, "subject:", r.subject, "correct:", r.correctCount, "wrong:", r.wrongCount);
      });

      // 오늘 기록 필터링
      const todayRecords = allRecords.filter(r => r.date === todayStr);
      console.log("=== 오늘(", todayStr, ") 매칭 기록 수 ===", todayRecords.length);

      const todayMap: Record<string,{correct:number,wrong:number}> = {};
      todayRecords.forEach((data) => {
        const subj = data.subject || 'unknown';
        if (!todayMap[subj]) todayMap[subj] = {correct:0,wrong:0};
        todayMap[subj].correct += data.correctCount || 0;
        todayMap[subj].wrong += data.wrongCount || 0;
      });
      setTodayStats(todayMap);

      // 이번달 기록 필터링
      const monthRecords = allRecords.filter(r => r.date && r.date.startsWith(monthStr));
      console.log("=== 이번달 매칭 기록 수 ===", monthRecords.length);

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
      console.log("=== 이번달 학습일 목록 ===", Array.from(daysSet));

      // 연속 학습 계산 (KST 기준)
      let streak = 0;
      const checkDate = new Date(kstNow);
      for (let i = 0; i < 30; i++) {
        const ds = checkDate.toISOString().split('T')[0];
        console.log("=== streak 확인 ===", ds, "존재:", daysSet.has(ds));
        if (daysSet.has(ds)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
          // 오늘 아직 안 풀었으면 어제부터 체크
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        } else {
          break;
        }
      }
      setStreakDays(streak);
      console.log("=== 최종 streak ===", streak);

      // AI 하루 피드백 로드 (배움/스카이 회원만)
      const hasTodayLearning = todayRecords.length > 0;
      if (tier === 'baeum' || tier === 'sky') {
        await loadDailyAIComment(parentId, childId, todayStr, hasTodayLearning);
      }

      // AI 월간 종합 분석 로드 (스카이 회원만)
      if (tier === 'sky') {
        await loadMonthlyAIComment(parentId, childId, monthStr);
      }

    } catch (error) { console.log('Growth load error:', error); }
    finally { setLoading(false); }
  };

  const loadDailyAIComment = async (parentId: string, childId: string, todayStr: string, hasTodayLearning: boolean) => {
    try {
      if (!hasTodayLearning) {
        setAiDailyComment('오늘 학습 기록이 없습니다. 첫 문제를 풀어보세요! 📚');
        return;
      }

      // Firestore에서 오늘 날짜 AI 코멘트 확인
      const aiCommentRef = doc(db, 'Parents', parentId, 'Children', childId, 'AIComments', todayStr);
      const aiCommentSnap = await getDoc(aiCommentRef);

      if (aiCommentSnap.exists()) {
        const data = aiCommentSnap.data();
        console.log('=== 저장된 AI 하루 피드백 사용 ===', todayStr);
        setAiDailyComment(data.analysis || '');
        return;
      }

      // Firestore에 없으면 Cloud Function 호출
      console.log('=== AI 하루 피드백 Cloud Function 호출 ===');
      setAiDailyLoading(true);

      const childName = await AsyncStorage.getItem('childName');
      const childGrade = await AsyncStorage.getItem('childGrade');
      const childTier = await AsyncStorage.getItem('childTier');

      const response = await fetch('https://us-central1-baeum-app.cloudfunctions.net/generateAIComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            childId: childId,
            childName: childName || '학생',
            grade: childGrade || '1',
            tier: childTier,
            parentId: parentId,
          }
        })
      });
      const result = await response.json();
      const data = result.result;

      if (data && data.success && data.analysis) {
        setAiDailyComment(data.analysis);
        console.log('=== AI 하루 피드백 생성 완료 ===');
      } else {
        setAiDailyComment('AI 분석을 생성하는데 실패했습니다.');
      }
    } catch (error) {
      console.log('AI 하루 피드백 로드 실패:', error);
      setAiDailyComment('AI 분석을 불러올 수 없습니다.');
    } finally {
      setAiDailyLoading(false);
    }
  };

  const loadMonthlyAIComment = async (parentId: string, childId: string, monthStr: string) => {
    try {
      // Firestore에서 월간 AI 분석 확인
      const aiMonthlyRef = doc(db, 'Parents', parentId, 'Children', childId, 'AIMonthly', monthStr);
      const aiMonthlySnap = await getDoc(aiMonthlyRef);

      if (aiMonthlySnap.exists()) {
        const data = aiMonthlySnap.data();
        console.log('=== 저장된 AI 월간 분석 사용 ===', monthStr);
        setAiMonthlyComment(data.analysis || '');
        return;
      }

      // Firestore에 없으면 Cloud Function 호출
      console.log('=== AI 월간 분석 Cloud Function 호출 ===');
      setAiMonthlyLoading(true);

      const childName = await AsyncStorage.getItem('childName');
      const childGrade = await AsyncStorage.getItem('childGrade');

      const response = await fetch('https://us-central1-baeum-app.cloudfunctions.net/generateMonthlyAIComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            childId: childId,
            childName: childName || '학생',
            grade: childGrade || '1',
            parentId: parentId,
            month: monthStr,
          }
        })
      });
      const result = await response.json();
      const data = result.result;

      if (data && data.success && data.analysis) {
        setAiMonthlyComment(data.analysis);
        console.log('=== AI 월간 분석 생성 완료 ===');
      } else {
        setAiMonthlyComment('AI 월간 분석을 생성하는데 실패했습니다.');
      }
    } catch (error) {
      console.log('AI 월간 분석 로드 실패:', error);
      setAiMonthlyComment('AI 월간 분석을 불러올 수 없습니다.');
    } finally {
      setAiMonthlyLoading(false);
    }
  };

  const renderDailyAIComment = () => {
    console.log('=== growth.tsx 렌더링 시 tier:', tier, 'free 여부:', tier === 'free');

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
              <Ionicons name="lock-closed" size={16} color="#4CAF50" />
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
          <Text style={styles.aiLoadingText}>AI가 학습을 분석하고 있어요...</Text>
        </View>
      );
    }

    return (
      <Text style={styles.aiTextPaid}>{aiDailyComment}</Text>
    );
  };

  const renderMonthlyAIComment = () => {
    if (tier !== 'sky') {
      return (
        <View style={styles.upgradeCard}>
          <Ionicons name="lock-closed" size={24} color="#4CAF50" style={{marginBottom: 8}} />
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

    return (
      <Text style={styles.aiTextPaid}>{aiMonthlyComment}</Text>
    );
  };

  const handleReportPress = () => {
    console.log('상세 리포트 클릭, tier:', tier);
    if (tier === 'free') {
      console.log('무료회원 상세 리포트 차단 모달');
      setShowFreeModal(true);
    } else {
      router.push('/growth/report');
    }
  };

  const handleMembershipPress = () => {
    console.log('회원 등급 안내 클릭');
    router.push('/settings/grade');
  };

  if (loading) return (<SafeAreaView style={styles.container}><ActivityIndicator size="large" color="#7ED4C0" style={{marginTop:100}}/></SafeAreaView>);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>성장 리포트</Text>
        <Text style={styles.subtitle}>{childName || '학생'}의 학습 현황</Text>

        <View style={styles.aiCard}>
          <Text style={styles.cardTitleSmall}>🤖 AI 하루 피드백</Text>
          {renderDailyAIComment()}
        </View>

        {(tier === 'baeum' || tier === 'sky') && (
          <View style={styles.aiCard}>
            <Text style={styles.cardTitleSmall}>📈 AI 종합 분석 (월간)</Text>
            {renderMonthlyAIComment()}
          </View>
        )}

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
              <Text style={[styles.statValueSmall,{color:'#7ED4C0'}]}>{monthlyStats.average}점</Text>
              <Text style={styles.statLabelSmall}>평균 정답률</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardSmall}>
          <Text style={styles.cardTitleSmall}>🔥 연속 학습</Text>
          <Text style={styles.streakValueSmall}>{streakDays}일 연속 학습 중!</Text>
          <Text style={styles.streakSubSmall}>{streakDays >= 7 ? '일주일 넘게 연속 학습 중! 대단해요! 🎉' : streakDays >= 3 ? '잘하고 있어요! 7일 연속에 도전해봐요!' : '매일 꾸준히 학습해봐요!'}</Text>
        </View>

        <TouchableOpacity style={styles.reportBtn} onPress={handleReportPress}>
          <Text style={styles.reportText}>상세 리포트 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.membershipBtn} onPress={handleMembershipPress}>
          <Text style={styles.membershipText}>회원 등급 안내</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showFreeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFreeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#F5F5F5'},
  scroll:{padding:20,paddingBottom:40},
  title:{fontSize:24,fontWeight:'bold',color:'#333'},
  subtitle:{fontSize:14,color:'#666',marginTop:4,marginBottom:16},
  aiCard:{backgroundColor:'#F8F9FA',borderRadius:12,padding:16,marginBottom:12},
  cardSmall:{backgroundColor:'#FFFFFF',borderRadius:16,padding:16,paddingVertical:10,marginBottom:8,shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.05,shadowRadius:4,elevation:2},
  cardTitleSmall:{fontSize:14,fontWeight:'bold',color:'#333',marginBottom:8},
  aiCommentContainer:{},
  aiTextFree:{fontSize:14,color:'#444',lineHeight:22,marginBottom:8},
  blurContainer:{position:'relative',marginTop:8},
  dummyText:{fontSize:14,color:'#DDD',lineHeight:22},
  blurOverlay:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(255,255,255,0.85)'},
  lockMessageContainer:{position:'absolute',top:0,left:0,right:0,bottom:0,justifyContent:'center',alignItems:'center',gap:4},
  lockText1:{fontSize:13,color:'#666',textAlign:'center'},
  lockText2:{fontSize:13,color:'#4CAF50',fontWeight:'bold',textAlign:'center'},
  aiTextPaid:{fontSize:14,color:'#444',lineHeight:22},
  aiLoadingContainer:{alignItems:'center',paddingVertical:12},
  aiLoadingText:{fontSize:12,color:'#999',marginTop:8},
  upgradeCard:{backgroundColor:'#F5F5F5',borderRadius:12,padding:16,alignItems:'center'},
  upgradeText:{fontSize:13,color:'#666',textAlign:'center',marginBottom:12},
  upgradeButton:{backgroundColor:'#4CAF50',borderRadius:8,paddingVertical:10,paddingHorizontal:20},
  upgradeButtonText:{fontSize:14,fontWeight:'bold',color:'#FFFFFF'},
  emptyText:{fontSize:14,color:'#999',textAlign:'center',paddingVertical:12},
  subjectRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:6,borderBottomWidth:1,borderBottomColor:'#F0F0F0'},
  subjectNameSmall:{fontSize:13,fontWeight:'600',color:'#333'},
  subjectStats:{flexDirection:'row',gap:16},
  correctTextSmall:{fontSize:14,color:'#4CAF50',fontWeight:'bold'},
  wrongTextSmall:{fontSize:14,color:'#FF6B6B',fontWeight:'bold'},
  statsGrid:{flexDirection:'row',justifyContent:'space-around',marginTop:4},
  statItem:{alignItems:'center'},
  statValueSmall:{fontSize:20,fontWeight:'bold',color:'#333'},
  statLabelSmall:{fontSize:10,color:'#999',marginTop:2},
  streakValueSmall:{fontSize:18,fontWeight:'bold',color:'#FF9800',textAlign:'center',marginTop:4},
  streakSubSmall:{fontSize:12,color:'#666',textAlign:'center',marginTop:6},
  reportBtn:{backgroundColor:'#4CAF50',borderRadius:12,paddingVertical:14,marginHorizontal:16,alignItems:'center',marginBottom:10,marginTop:8},
  reportText:{fontSize:16,fontWeight:'bold',color:'#FFFFFF'},
  membershipBtn:{backgroundColor:'#FFFFFF',borderWidth:1.5,borderColor:'#4CAF50',borderRadius:12,paddingVertical:14,marginHorizontal:16,alignItems:'center',marginBottom:20},
  membershipText:{fontSize:16,fontWeight:'bold',color:'#4CAF50'},
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center'},
  modalContent:{backgroundColor:'#FFFFFF',borderRadius:20,padding:32,width:'80%',alignItems:'center'},
  modalMessage:{fontSize:15,color:'#333',textAlign:'center',lineHeight:24,marginBottom:24},
  modalButton:{backgroundColor:'#4CAF50',borderRadius:12,paddingVertical:14,paddingHorizontal:40},
  modalButtonText:{fontSize:16,fontWeight:'bold',color:'#FFFFFF'},
});
