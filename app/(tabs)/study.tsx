import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function StudyScreen() {
  const router = useRouter();

  const subjects = [
    { emoji: '📖', name: '국어', remaining: 3, total: 3, completed: 0 },
    { emoji: '🔢', name: '수학', remaining: 3, total: 3, completed: 0 },
    { emoji: '🔬', name: '과학', remaining: 2, total: 3, completed: 1 },
    { emoji: '🌍', name: '사회', remaining: 3, total: 3, completed: 0 },
    { emoji: '🔤', name: '영어', remaining: 0, total: 3, completed: 3 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <Text style={styles.title}>과목 선택</Text>
        <Text style={styles.subtitle}>학습할 과목을 선택하세요</Text>

        {/* GRADE INFO CARD */}
        <View style={styles.gradeCard}>
          <View style={styles.gradeRow}>
            <Text style={styles.profileName}>🍓 김배움</Text>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeBadgeText}>3학년</Text>
            </View>
          </View>
          <Text style={styles.gradeInfo}>무료회원 · 과목당 3문제</Text>
        </View>

        {/* SUBJECT CARDS */}
        {subjects.map((subject, index) => {
          const isCompleted = subject.remaining === 0;
          const progress = subject.completed / subject.total;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.subjectCard, isCompleted && styles.subjectCardCompleted]}
              onPress={() => !isCompleted && router.push('/study/questions')}
              disabled={isCompleted}
            >
              <View style={styles.subjectHeader}>
                <View style={styles.subjectLeft}>
                  <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
                  <Text style={[styles.subjectName, isCompleted && styles.textCompleted]}>
                    {subject.name}
                  </Text>
                  <Text style={[styles.subjectRemaining, isCompleted && styles.textCompleted]}>
                    {isCompleted ? '✅ 완료' : `남은 ${subject.remaining}문제`}
                  </Text>
                </View>
                <Text style={[styles.arrow, isCompleted && styles.textCompleted]}>{'>'}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* BOTTOM NOTE */}
        <Text style={styles.bottomNote}>매일 꾸준히 학습해요! 💪</Text>
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
  gradeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  gradeBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  gradeBadgeText: {
    fontSize: 12,
    color: '#666666',
  },
  gradeInfo: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 4,
  },
  subjectCard: {
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
  subjectCardCompleted: {
    backgroundColor: '#F8F8F8',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  subjectRemaining: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  arrow: {
    fontSize: 20,
    color: '#9E9E9E',
  },
  textCompleted: {
    color: '#BDBDBD',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7ED4C0',
    borderRadius: 2,
  },
  bottomNote: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
});
