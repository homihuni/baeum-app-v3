import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBJECT_LABELS: Record<string,string> = {korean:'국어',math:'수학',integrated:'통합교과',science:'과학',social:'사회',english:'영어'};

export default function GrowthScreen() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState<Record<string,{correct:number,wrong:number}>>({});
  const [monthlyStats, setMonthlyStats] = useState({accessDays:0,totalProblems:0,correctCount:0,average:0});
  const [streakDays, setStreakDays] = useState(0);
  const [aiComment, setAiComment] = useState('');

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
        if (childData.name) setChildName(childData.name);
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

      // AI Comment
      if (total === 0) setAiComment('아직 이번 달 학습 기록이 없어요. 오늘부터 시작해볼까요? 💪');
      else if (avg >= 90) setAiComment('🎉 정답률 ' + avg + '%! 정말 대단해요! 이 조자로 계속 가면 최고예요!');
      else if (avg >= 70) setAiComment('👍 정답률 ' + avg + '%로 잘하고 있어요! 조금만 더 노력하면 90점 넘을 수 있어요!');
      else setAiComment('📚 정답률 ' + avg + '%예요. 틀린 문제를 다시 풀어보면 금방 올라갈 거예요!');

    } catch (error) { console.log('Growth load error:', error); }
    finally { setLoading(false); }
  };

  if (loading) return (<SafeAreaView style={styles.container}><ActivityIndicator size="large" color="#7ED4C0" style={{marginTop:100}}/></SafeAreaView>);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>성장 리포트</Text>
        <Text style={styles.subtitle}>{childName || '학생'}의 학습 현황</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 AI 학습 코멘트</Text>
          <Text style={styles.aiText}>{aiComment}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 오늘의 학습</Text>
          {Object.keys(todayStats).length === 0 ? (
            <Text style={styles.emptyText}>오늘 아직 학습 기록이 없어요</Text>
          ) : (
            Object.entries(todayStats).map(([subj, stat]) => (
              <View key={subj} style={styles.subjectRow}>
                <Text style={styles.subjectName}>{SUBJECT_LABELS[subj] || subj}</Text>
                <View style={styles.subjectStats}>
                  <Text style={styles.correctText}>✅ {stat.correct}</Text>
                  <Text style={styles.wrongText}>❌ {stat.wrong}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 2월 학습 통계</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyStats.accessDays}일</Text>
              <Text style={styles.statLabel}>학습일</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyStats.totalProblems}개</Text>
              <Text style={styles.statLabel}>문제풀이수</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue,{color:'#7ED4C0'}]}>{monthlyStats.average}점</Text>
              <Text style={styles.statLabel}>평균 정답률</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 연속 학습</Text>
          <Text style={styles.streakValue}>{streakDays}일 연속 학습 중!</Text>
          <Text style={styles.streakSub}>{streakDays >= 7 ? '일주일 넘게 연속 학습 중! 대단해요! 🎉' : streakDays >= 3 ? '잘하고 있어요! 7일 연속에 도전해봐요!' : '매일 꾸준히 학습해봐요!'}</Text>
        </View>

        <TouchableOpacity style={styles.reportBtn} onPress={() => router.push('/settings/report')}>
          <Text style={styles.reportText}>상세 리포트 보기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#F5F5F5'},
  scroll:{padding:20,paddingBottom:40},
  title:{fontSize:24,fontWeight:'bold',color:'#333'},
  subtitle:{fontSize:14,color:'#666',marginTop:4,marginBottom:16},
  card:{backgroundColor:'#FFFFFF',borderRadius:16,padding:20,marginBottom:12,shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.05,shadowRadius:4,elevation:2},
  cardTitle:{fontSize:16,fontWeight:'bold',color:'#333',marginBottom:12},
  aiText:{fontSize:14,color:'#555',lineHeight:22},
  emptyText:{fontSize:14,color:'#999',textAlign:'center',paddingVertical:12},
  subjectRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#F0F0F0'},
  subjectName:{fontSize:15,fontWeight:'600',color:'#333'},
  subjectStats:{flexDirection:'row',gap:16},
  correctText:{fontSize:14,color:'#4CAF50',fontWeight:'bold'},
  wrongText:{fontSize:14,color:'#FF6B6B',fontWeight:'bold'},
  statsGrid:{flexDirection:'row',justifyContent:'space-around'},
  statItem:{alignItems:'center'},
  statValue:{fontSize:22,fontWeight:'bold',color:'#333'},
  statLabel:{fontSize:12,color:'#999',marginTop:4},
  streakValue:{fontSize:20,fontWeight:'bold',color:'#FF9800',textAlign:'center'},
  streakSub:{fontSize:13,color:'#666',textAlign:'center',marginTop:8},
  reportBtn:{backgroundColor:'#7ED4C0',borderRadius:16,paddingVertical:16,alignItems:'center',marginTop:8},
  reportText:{fontSize:16,fontWeight:'bold',color:'#FFFFFF'},
});
