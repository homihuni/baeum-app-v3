import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/utils/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

interface RecordData {
  date: string;
  subject: string;
  correctCount: number;
  totalQuestions: number;
}

interface MonthlyData {
  month: string;
  rate: number;
}

interface SubjectData {
  subject: string;
  rate: number;
  correct?: number;
  total?: number;
}

const subjectColors: Record<string, string> = {
  korean: '#FF6B6B',
  math: '#4ECDC4',
  integrated: '#FFD93D',
  science: '#6BCB77',
  social: '#4D96FF',
  english: '#9B59B6',
};

const subjectNames: Record<string, string> = {
  korean: '국어',
  math: '수학',
  integrated: '통합교과',
  science: '과학',
  social: '사회',
  english: '영어',
};

export default function ReportScreen() {
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('free');
  const [childName, setChildName] = useState('');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [totalDays, setTotalDays] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);
  const [averageRate, setAverageRate] = useState(0);

  useEffect(() => {
    console.log('=== 상세 리포트 진입 ===');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      if (!parentId || !childId) {
        setLoading(false);
        return;
      }

      const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
      if (childDoc.exists()) {
        const childData = childDoc.data();
        setChildName(childData.name || '');
        const childTier = childData.tier || 'free';
        setTier(childTier);
        console.log('=== 상세 리포트 tier:', childTier);
      }

      const recordsRef = collection(db, 'Parents', parentId, 'Children', childId, 'Records');
      const recordsSnapshot = await getDocs(recordsRef);
      const records: RecordData[] = [];

      recordsSnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          date: data.date || '',
          subject: data.subject || '',
          correctCount: data.correctCount || 0,
          totalQuestions: data.totalQuestions || 0,
        });
      });

      console.log('=== 상세 리포트 전체 Records:', records.length);

      calculateMonthlyData(records);
      calculateSubjectData(records);
      calculateSummary(records);

      setLoading(false);
    } catch (error) {
      console.error('리포트 데이터 로드 오류:', error);
      setLoading(false);
    }
  };

  const calculateMonthlyData = (records: RecordData[]) => {
    // 현재 월 기준 최근 6개월 자동 계산
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const monthlyMap: Record<string, { correct: number; total: number }> = {};

    months.forEach((month) => {
      monthlyMap[month] = { correct: 0, total: 0 };
    });

    records.forEach((record) => {
      if (record.date && record.date.length >= 7) {
        const month = record.date.substring(0, 7);
        if (monthlyMap[month]) {
          monthlyMap[month].correct += record.correctCount;
          monthlyMap[month].total += record.totalQuestions;
        }
      }
    });

    const result: MonthlyData[] = months.map((month) => {
      const data = monthlyMap[month];
      const rate = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      return { month: month.substring(5), rate };
    });

    console.log('=== 월별 정답률:', result);
    setMonthlyData(result);
  };

  const calculateSubjectData = (records: RecordData[]) => {
    // 현재 월 동적 처리
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const subjectMap: Record<string, { correct: number; total: number }> = {};

    records.forEach((record) => {
      if (record.date && record.date.startsWith(currentMonth)) {
        if (!subjectMap[record.subject]) {
          subjectMap[record.subject] = { correct: 0, total: 0 };
        }
        subjectMap[record.subject].correct += record.correctCount;
        subjectMap[record.subject].total += record.totalQuestions;
      }
    });

    const result: SubjectData[] = Object.keys(subjectMap).map((subject) => {
      const data = subjectMap[subject];
      const rate = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      return { subject, rate, correct: data.correct, total: data.total };
    });

    console.log('=== 과목별 정답률:', result);
    setSubjectData(result);
  };

  const calculateSummary = (records: RecordData[]) => {
    // 현재 월 동적 처리
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateSet = new Set<string>();
    let totalCorrect = 0;
    let totalQuestions = 0;

    records.forEach((record) => {
      if (record.date && record.date.startsWith(currentMonth)) {
        dateSet.add(record.date);
        totalCorrect += record.correctCount;
        totalQuestions += record.totalQuestions;
      }
    });

    setTotalDays(dateSet.size);
    setTotalProblems(totalQuestions);
    setAverageRate(totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0);
  };

  const renderMonthlyChart = () => {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 월별 학습 추이</Text>
        <View style={styles.chartContainer}>
          <View style={styles.yAxisLabels}>
            <Text style={styles.yAxisLabel}>100%</Text>
            <Text style={styles.yAxisLabel}>75%</Text>
            <Text style={styles.yAxisLabel}>50%</Text>
            <Text style={styles.yAxisLabel}>25%</Text>
            <Text style={styles.yAxisLabel}>0%</Text>
          </View>
          <View style={styles.chartContent}>
            <View style={styles.gridLine100} />
            <View style={styles.gridLine75} />
            <View style={styles.gridLine50} />
            <View style={styles.gridLine25} />
            <View style={styles.gridLine0} />
            <View style={styles.barsContainer}>
              {monthlyData.map((data, index) => {
                const height = (data.rate / 100) * 180;
                return (
                  <View key={index} style={styles.barWrapper}>
                    {data.rate > 0 ? (
                      <>
                        <Text style={styles.barValue}>{data.rate}%</Text>
                        <View style={[styles.bar, { height }]} />
                      </>
                    ) : (
                      <>
                        <Text style={styles.barValue}>-</Text>
                        <View style={styles.emptyBarSpace} />
                      </>
                    )}
                    <Text style={styles.barLabel}>{data.month}월</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSubjectChart = () => {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📚 과목별 정답률</Text>
        <Text style={styles.subtitle}>이번 달 기준</Text>
        <View style={styles.subjectContainer}>
          {subjectData.map((data, index) => {
            const color = subjectColors[data.subject] || '#999';
            const name = subjectNames[data.subject] || data.subject;
            return (
              <View key={index} style={styles.subjectItem}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectName}>{name}</Text>
                  <Text style={[styles.subjectRate, { color }]}>{data.rate}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${data.rate}%`, backgroundColor: color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSummary = () => {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📋 이번 달 학습 요약</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalDays}</Text>
            <Text style={styles.summaryLabel}>학습일</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalProblems}</Text>
            <Text style={styles.summaryLabel}>문제</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{averageRate}%</Text>
            <Text style={styles.summaryLabel}>정답률</Text>
          </View>
        </View>
      </View>
    );
  };

  const generateAISummary = () => {
    if (!subjectData || subjectData.length === 0) {
      return '이번 달 학습 기록이 없습니다. 학습을 시작해보세요!';
    }

    const totalCorrect = subjectData.reduce((sum, s) => sum + (s.correct || 0), 0);
    const totalQuestions = subjectData.reduce((sum, s) => sum + (s.total || 0), 0);
    const overallRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const subjectNameMap: Record<string, string> = {
      math: '수학',
      korean: '국어',
      english: '영어',
      social: '사회',
      science: '과학',
      integrated: '통합교과'
    };

    const strong = subjectData.filter(s => s.rate >= 90).map(s => subjectNameMap[s.subject] || s.subject);
    const weak = subjectData.filter(s => s.rate < 70).map(s => subjectNameMap[s.subject] || s.subject);

    let summary = `이번 달 전체 정답률은 ${overallRate}%입니다. `;
    summary += `총 ${subjectData.length}개 과목을 학습했습니다.\n\n`;

    if (strong.length > 0) {
      summary += `${strong.join(', ')}은(는) 매우 잘하고 있어요! 90% 이상의 높은 정답률을 기록했어요.\n\n`;
    }

    if (weak.length > 0) {
      summary += `${weak.join(', ')}은(는) 조금 더 연습이 필요해요. 틀린 문제를 복습하면 빠르게 향상될 거예요.\n\n`;
    }

    if (overallRate >= 90) {
      summary += '전반적으로 훌륭한 학습 성과를 보이고 있습니다!';
    } else if (overallRate >= 70) {
      summary += '꾸준히 잘하고 있어요. 조금만 더 노력하면 더 좋아질 거예요!';
    } else {
      summary += '꾸준한 학습이 중요해요. 매일 조금씩 연습해봐요!';
    }

    return summary;
  };

  const renderAIEvaluation = () => {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🤖 AI 종합 평가</Text>
        <Text style={styles.aiText}>{generateAISummary()}</Text>
      </View>
    );
  };

  const generateSkyTips = () => {
    if (!subjectData || subjectData.length === 0) {
      return '학습 기록이 쌓이면 맞춤 팁을 제공해드릴게요!';
    }

    const subjectNameMap: Record<string, string> = {
      math: '수학',
      korean: '국어',
      english: '영어',
      social: '사회',
      science: '과학',
      integrated: '통합교과'
    };

    const weak = subjectData.filter(s => s.rate < 70).sort((a, b) => a.rate - b.rate);

    if (weak.length === 0) {
      return '모든 과목을 잘하고 있어요! 지금처럼 꾸준히 학습하면 더욱 성장할 거예요.';
    }

    const target = weak[0];
    const name = subjectNameMap[target.subject] || target.subject;

    let tips = `• ${name} 정답률이 ${target.rate}%로 가장 낮아요. ${name} 문제를 매일 2~3문제씩 추가로 풀어보면 빠르게 향상될 거예요!\n\n`;

    if (weak.length > 1) {
      const secondWeak = weak[1];
      const secondName = subjectNameMap[secondWeak.subject] || secondWeak.subject;
      tips += `• ${secondName}(${secondWeak.rate}%)도 함께 보완하면 전체 성적이 더 올라갈 거예요.\n\n`;
    }

    tips += `• 틀린 문제는 바로 다시 풀어보면 효과가 2배예요! 복습 습관을 만들어보세요.\n\n`;

    if (totalDays < 10) {
      tips += `• 이번 달 ${totalDays}일 학습했어요. 주 3회 이상 학습하면 더 큰 성장을 기대할 수 있어요.`;
    } else {
      tips += `• 이번 달 ${totalDays}일 동안 꾸준히 학습했어요. 이 페이스를 유지해보세요!`;
    }

    return tips;
  };

  const renderLearningTips = () => {
    if (tier === 'sky') {
      return (
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🎯 AI 맞춤 학습 팁</Text>
          <View style={styles.tipsBadge}>
            <Text style={styles.tipsBadgeText}>스카이 회원 전용</Text>
          </View>
          <Text style={styles.tipsText}>{generateSkyTips()}</Text>
        </View>
      );
    } else if (tier === 'baeum') {
      return (
        <View style={styles.lockCard}>
          <Ionicons name="lock-closed" size={24} color="#1976D2" style={{ marginBottom: 8 }} />
          <Text style={styles.lockText1}>AI 맞춤 학습 팁은</Text>
          <Text style={styles.lockText2}>스카이 회원 전용이에요</Text>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>상세 리포트</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>상세 리포트</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderMonthlyChart()}
        {renderSubjectChart()}
        {renderSummary()}
        {renderAIEvaluation()}
        {renderLearningTips()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 0,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  subtitle: { fontSize: 12, color: '#999', marginBottom: 16, marginTop: -12 },
  chartContainer: { flexDirection: 'row', height: 220 },
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginRight: 8,
  },
  yAxisLabel: { fontSize: 10, color: '#999', textAlign: 'right' },
  chartContent: { flex: 1, position: 'relative' },
  gridLine100: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  gridLine75: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  gridLine50: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  gridLine25: {
    position: 'absolute',
    top: 145,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  gridLine0: {
    position: 'absolute',
    top: 190,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 200,
    paddingTop: 20,
  },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: {
    width: 26,
    backgroundColor: '#4CAF50',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  emptySpace: { height: 16, marginBottom: 4 },
  emptyBar: {
    width: 26,
    height: 2,
    backgroundColor: '#E0E0E0',
  },
  emptyBarSpace: {
    height: 0,
    width: 26,
  },
  barValue: { fontSize: 9, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  barLabel: { fontSize: 10, color: '#666', marginTop: 6 },
  subjectContainer: { marginTop: 0 },
  subjectItem: { marginBottom: 16 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectName: { fontSize: 14, fontWeight: '600', color: '#333' },
  subjectRate: { fontSize: 14, fontWeight: 'bold' },
  progressBarBg: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: { height: 10, borderRadius: 5 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  summaryLabel: { fontSize: 11, color: '#999' },
  aiText: { fontSize: 14, lineHeight: 22, color: '#444' },
  tipsCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  tipsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1976D2', marginBottom: 12 },
  tipsBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tipsBadgeText: { fontSize: 11, color: '#1976D2' },
  tipsText: { fontSize: 14, lineHeight: 24, color: '#333' },
  lockCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  lockText1: { fontSize: 14, color: '#666' },
  lockText2: { fontSize: 14, color: '#1976D2', fontWeight: 'bold', marginTop: 2 },
});
