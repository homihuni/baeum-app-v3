import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function GrowthScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <Text style={styles.title}>나의 성장</Text>
        <Text style={styles.subtitle}>학습 기록을 확인해보세요</Text>

        {/* AI COMMENT CARD */}
        <View style={styles.aiCard}>
          <Text style={styles.aiTitle}>🤖 AI 학습 코멘트</Text>
          <Text style={styles.aiComment}>
            김배움 학생은 국어 과목에서 꾸준한 성장을 보이고 있어요! 수학은 조금 더 연습하면 좋겠어요. 화이팅! 🎉
          </Text>
        </View>

        {/* TODAY SUMMARY CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>오늘의 학습 요약</Text>
          <Text style={[styles.summaryItem, { color: '#4CAF50' }]}>📖 국어: 3/3 정답 ✅</Text>
          <Text style={[styles.summaryItem, { color: '#FF6B6B' }]}>🔢 수학: 2/3 정답</Text>
          <Text style={[styles.summaryItem, { color: '#FF6B6B' }]}>🔬 과학: 1/3 정답</Text>
          <Text style={[styles.summaryItem, { color: '#9E9E9E' }]}>🌍 사회: 미응시</Text>
          <Text style={[styles.summaryItem, { color: '#4CAF50' }]}>🔤 영어: 3/3 정답 ✅</Text>
        </View>

        {/* MONTHLY STATS CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2월 학습 통계</Text>
          <Text style={styles.statItem}>총 학습일: 5일</Text>
          <Text style={styles.statItem}>총 푼 문제: 45문제</Text>
          <Text style={[styles.statItem, styles.statAverage]}>평균 정답률: 78%</Text>
          <Text style={[styles.statItem, { color: '#FFD93D' }]}>최고 점수: 국어 100점 🏆</Text>
        </View>

        {/* STREAK CARD */}
        <View style={[styles.card, styles.streakCard]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakTitle}>연속 학습 5일째!</Text>
          <Text style={styles.streakSubtitle}>꾸준함이 실력이 돼요!</Text>
        </View>

        {/* REPORT BUTTON */}
        <TouchableOpacity style={styles.reportButton} onPress={() => router.push('/settings/report')}>
          <Text style={styles.reportButtonText}>상세 리포트 보기 📊</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  aiCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#E8F8F5',
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7ED4C0',
  },
  aiComment: {
    fontSize: 14,
    color: '#333333',
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 14,
    marginTop: 4,
  },
  statItem: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  statAverage: {
    fontWeight: 'bold',
    color: '#7ED4C0',
  },
  streakCard: {
    alignItems: 'center',
    padding: 20,
  },
  streakEmoji: {
    fontSize: 40,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 8,
  },
  streakSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 4,
  },
  reportButton: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7ED4C0',
    borderRadius: 12,
    paddingVertical: 14,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7ED4C0',
    textAlign: 'center',
  },
});
