import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

export default function CompleteScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.title}>학습 완료!</Text>
        <Text style={styles.subtitle}>수고했어요! 오늘도 잘했습니다</Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsSubject}>국어 · 3문제</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>정답</Text>
            <Text style={styles.statsValueCorrect}>2/3</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>정답률</Text>
            <Text style={styles.statsValueCorrect}>67%</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>오답</Text>
            <Text style={styles.statsValueWrong}>1문제</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.continueButton}>
          <Text style={styles.continueButtonText}>다른 과목 풀기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeButton}>
          <Text style={styles.homeButtonText}>홈으로</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7ED4C0',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 24,
    alignSelf: 'stretch',
  },
  statsSubject: {
    fontSize: 14,
    color: '#999999',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statsLabel: {
    fontSize: 16,
    color: '#333333',
  },
  statsValueCorrect: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7ED4C0',
  },
  statsValueWrong: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5A5B8',
  },
  buttonsContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: '#7ED4C0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7ED4C0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  homeButtonText: {
    color: '#7ED4C0',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
