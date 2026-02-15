import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function GrowthScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>나의 성장</Text>

      <View style={styles.aiCard}>
        <Text style={styles.aiText}>🌟 오늘도 열심히 공부했어요! 내일도 화이팅!</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>오늘의 학습</Text>
        <Text style={styles.statsItem}>국어: 3/3 정답 ✅</Text>
        <Text style={styles.statsItem}>수학: 2/3 정답</Text>
      </View>

      <Text style={styles.streakText}>연속 학습 5일째! 🔥</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    margin: 16,
  },
  aiCard: {
    backgroundColor: '#B8E8DC',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  aiText: {
    fontSize: 15,
    color: '#333333',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  statsItem: {
    fontSize: 14,
    color: '#333333',
    marginTop: 8,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7ED4C0',
    textAlign: 'center',
    marginTop: 16,
  },
});
