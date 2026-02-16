import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

  return (
    <SafeAreaView style={styles.container}>
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
          {rate === 100 ? '🎉 완벽해요! 최고!' : rate >= 70 ? '👏 잘했어요! 조금만 더 노력해봐요!' : '💪 다음에는 더 잘할 수 있어요!'}
        </Text>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.otherBtn} onPress={() => router.replace('/(tabs)/study')}>
          <Text style={styles.otherBtnText}>다른 과목 풀기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.homeBtnText}>홈으로</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  trophy: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#7ED4C0', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#9E9E9E', marginBottom: 32 },
  statsCard: { width: '100%', backgroundColor: '#F5F5F5', borderRadius: 16, padding: 20 },
  subjectBadge: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, alignSelf: 'flex-start', marginBottom: 16 },
  statsSubject: { fontSize: 15, color: '#333', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statsLabel: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  statsValue: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  encouragement: { fontSize: 15, color: '#666', marginTop: 24, textAlign: 'center' },
  bottomBar: { padding: 20, gap: 10 },
  otherBtn: { backgroundColor: '#7ED4C0', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  otherBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  homeBtn: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#7ED4C0' },
  homeBtnText: { fontSize: 16, fontWeight: 'bold', color: '#7ED4C0' },
});
