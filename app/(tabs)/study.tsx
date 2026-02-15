import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function StudyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>과목 선택</Text>
      <Text style={styles.subtitle}>오늘 공부할 과목을 선택하세요</Text>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/study/questions')}>
        <Text style={styles.cardLeft}>📖 국어</Text>
        <Text style={styles.cardRight}>남은 3문제</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/study/questions')}>
        <Text style={styles.cardLeft}>🔢 수학</Text>
        <Text style={styles.cardRight}>남은 3문제</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/study/questions')}>
        <Text style={styles.cardLeft}>🌈 통합교과</Text>
        <Text style={styles.cardRight}>남은 3문제</Text>
      </TouchableOpacity>
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
  subtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    marginLeft: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLeft: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  cardRight: {
    fontSize: 14,
    color: '#7ED4C0',
    fontWeight: '600',
  },
});
