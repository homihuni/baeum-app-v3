import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

const SUBJECT_LABELS: Record<string, string> = {
  korean: '국어', math: '수학', integrated: '통합교과',
  science: '과학', social: '사회', english: '영어',
};

export default function CompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const subject = (params.subject as string) || 'korean';
  const total = parseInt((params.total as string) || '3');
  const correctFinal = parseInt((params.correctFinal as string) || '0');
  const wrongFinal = parseInt((params.wrongFinal as string) || '0');
  const rate = total > 0 ? Math.round((correctFinal / total) * 100) : 0;

  const getFeedbackMessage = () => {
    if (rate >= 90) {
      return '완벽해요! 정말 잘했어요!';
    } else if (rate >= 70) {
      return '잘하고 있어요! 조금만 더!';
    } else if (rate >= 50) {
      return '괜찮아요, 다음엔 더 잘할 수 있어요!';
    } else {
      return '천천히 다시 풀어보면 분명 잘할 수 있어요!';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>학습 완료!</Text>
          <Text style={styles.subtitle}>수고했어요! 오늘도 잘했습니다</Text>

          <View style={styles.statsCard}>
            <View style={styles.subjectBadge}>
              <Text style={styles.statsSubject}>{SUBJECT_LABELS[subject] || subject} · {total}문제</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>정답</Text>
              <Text style={styles.statsValue}>{correctFinal}/{total}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>정답률</Text>
              <Text style={[styles.statsValue, { color: '#7ED4C0' }]}>{rate}%</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>오답</Text>
              <Text style={[styles.statsValue, { color: '#FF6B6B' }]}>{wrongFinal}문제</Text>
            </View>
          </View>

          <Text style={styles.encouragement}>
            {getFeedbackMessage()}
          </Text>

          <TouchableOpacity
            style={styles.growthBtn}
            onPress={() => router.push('/(tabs)/growth')}
          >
            <Text style={styles.growthBtnText}>📊 성장 리포트에서 자세히 보기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.otherBtn} onPress={() => router.replace('/(tabs)/study')}>
            <Text style={styles.otherBtnText}>다른 과목 풀기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.homeBtnText}>홈으로</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  trophy: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#7ED4C0', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#9E9E9E', marginBottom: 32 },
  statsCard: { width: '100%', backgroundColor: '#F5F5F5', borderRadius: 16, padding: 20 },
  subjectBadge: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, alignSelf: 'flex-start', marginBottom: 16 },
  statsSubject: { fontSize: 15, color: '#333', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statsLabel: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  statsValue: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  encouragement: { fontSize: 16, color: '#333', marginTop: 24, textAlign: 'center', fontWeight: '600' },
  growthBtn: { marginTop: 16, width: '100%', backgroundColor: '#E8F5E9', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#4CAF50' },
  growthBtnText: { fontSize: 15, fontWeight: 'bold', color: '#2E7D32' },
  bottomBar: { padding: 20, gap: 10 },
  otherBtn: { backgroundColor: '#7ED4C0', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  otherBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  homeBtn: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#7ED4C0' },
  homeBtnText: { fontSize: 16, fontWeight: 'bold', color: '#7ED4C0' },
});
