import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.userName}>🍓 김배움</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3학년</Text>
          </View>
        </View>

        <Text style={styles.monthTitle}>2026년 2월</Text>

        <View style={styles.calendar}>
          <View style={styles.weekRow}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {days.map((day) => (
              <View key={day} style={styles.dayCell}>
                <View style={day === 15 ? styles.todayCircle : null}>
                  <Text style={day === 15 ? styles.todayText : styles.dayText}>{day}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>오늘의 학습</Text>
          <Text style={styles.cardMainText}>남은 문제: 3문제</Text>
          <Text style={styles.cardSubText}>이번 달 학습일: 5일</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/study/questions')}>
          <Text style={styles.buttonText}>학습하기 📝</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  badge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    color: '#666666',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: '#333333',
  },
  calendar: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  dayText: {
    fontSize: 14,
    color: '#333333',
  },
  todayCircle: {
    backgroundColor: '#7ED4C0',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  card: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  cardMainText: {
    fontSize: 14,
    color: '#333333',
    marginTop: 8,
  },
  cardSubText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#7ED4C0',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
