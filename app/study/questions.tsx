import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getProblemsForSubject } from '../../utils/sampleProblems';
import { createRecord } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBJECT_LABELS: Record<string, string> = {
  korean: '국어', math: '수학', integrated: '통합교과',
  science: '과학', social: '사회', english: '영어',
};

export default function QuestionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const subject = (params.subject as string) || 'korean';
  const grade = parseInt((params.grade as string) || '1');
  const tier = (params.tier as string) || 'free';

  const [problems, setProblems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    const allProblems = getProblemsForSubject(subject, grade);
    const maxQuestions = tier === 'sky' ? 10 : tier === 'baeum' ? 5 : 3;
    console.log("문제풀이 tier:", tier, "총문제:", maxQuestions);
    setProblems(allProblems.slice(0, maxQuestions));
  }, []);

  const currentProblem = problems[currentIndex];

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
  };

  const handleCheckAnswer = async () => {
    if (!selectedAnswer) {
      Alert.alert('알림', '답을 선택해주세요.');
      return;
    }
    const correct = selectedAnswer === currentProblem.correctAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);
    if (correct) setCorrectCount(prev => prev + 1);
    else setWrongCount(prev => prev + 1);
  };

  const saveResult = async (correctCount: number, wrongCount: number, totalQuestions: number) => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      if (parentId && childId) {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        await createRecord(parentId, childId, {
          subject: subject as string,
          date: dateStr,
          totalQuestions: totalQuestions,
          correctCount: correctCount,
          wrongCount: wrongCount,
          score: score,
          completedAt: new Date().toISOString(),
          grade: grade
        } as any);
      }
    } catch (error) {
      console.log('결과 저장 실패:', error);
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 >= problems.length) {
      await saveResult(correctCount, wrongCount, problems.length);
      router.replace({
        pathname: '/study/complete',
        params: {
          subject,
          total: String(problems.length),
          correct: String(correctCount + (isCorrect ? 0 : 0)),
          wrong: String(wrongCount + (isCorrect ? 0 : 0)),
          correctFinal: String(correctCount),
          wrongFinal: String(wrongCount),
        },
      });
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  const handleClose = () => {
    Alert.alert(
      '학습 중단',
      '학습을 중단하시겠어요?\n진행한 문제는 저장됩니다.',
      [
        { text: '계속하기', style: 'cancel' },
        { text: '중단하기', onPress: () => router.replace('/(tabs)/home') },
      ]
    );
  };

  if (problems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>문제를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = (currentIndex + 1) / problems.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subjectLabel}>{SUBJECT_LABELS[subject] || subject}</Text>
        <Text style={styles.progressText}>{currentIndex + 1} / {problems.length}</Text>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.questionLabel}>Q{currentIndex + 1}</Text>
        <Text style={styles.questionText}>{currentProblem.question}</Text>

        <View style={styles.choicesContainer}>
          {(currentProblem.choices || []).map((choice: string, index: number) => {
            const isSelected = selectedAnswer === choice;
            const isCorrectAnswer = choice === currentProblem.correctAnswer;
            let choiceStyle = styles.choiceBtn;
            let choiceTextStyle = styles.choiceText;

            if (isAnswered) {
              if (isCorrectAnswer) {
                choiceStyle = { ...styles.choiceBtn, ...styles.choiceCorrect };
                choiceTextStyle = { ...styles.choiceText, ...styles.choiceTextCorrect };
              } else if (isSelected && !isCorrectAnswer) {
                choiceStyle = { ...styles.choiceBtn, ...styles.choiceWrong };
                choiceTextStyle = { ...styles.choiceText, ...styles.choiceTextWrong };
              }
            } else if (isSelected) {
              choiceStyle = { ...styles.choiceBtn, ...styles.choiceSelected };
              choiceTextStyle = { ...styles.choiceText, ...styles.choiceTextSelected };
            }

            const prefix = currentProblem.questionType === 'ox' ? '' : `${String.fromCharCode(9312 + index)} `;

            return (
              <TouchableOpacity
                key={index}
                style={choiceStyle}
                onPress={() => handleSelectAnswer(choice)}
                disabled={isAnswered}
              >
                <Text style={choiceTextStyle}>{prefix}{choice}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isAnswered && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultTitle, { color: isCorrect ? '#4CAF50' : '#FF6B6B' }]}>
              {isCorrect ? '🎉 정답이에요!' : '😢 틀렸어요'}
            </Text>
            <Text style={styles.resultAnswer}>정답: {currentProblem.correctAnswer}</Text>
            <View style={styles.explanationCard}>
              <Text style={styles.explanationLabel}>💡 해설</Text>
              <Text style={styles.explanationText}>{currentProblem.explanation}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {!isAnswered ? (
          <TouchableOpacity style={styles.checkBtn} onPress={handleCheckAnswer}>
            <Text style={styles.checkBtnText}>정답 확인</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= problems.length ? '학습 완료' : '다음 문제 →'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  subjectLabel: { fontSize: 16, fontWeight: 'bold', color: '#7ED4C0' },
  progressText: { fontSize: 14, color: '#666' },
  closeBtn: { fontSize: 22, color: '#9E9E9E' },
  progressBarBg: { height: 4, backgroundColor: '#E0E0E0', marginHorizontal: 20 },
  progressBarFill: { height: 4, backgroundColor: '#7ED4C0', borderRadius: 2 },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  questionLabel: { fontSize: 14, fontWeight: 'bold', color: '#7ED4C0', marginBottom: 8 },
  questionText: { fontSize: 18, fontWeight: 'bold', color: '#333', lineHeight: 28, marginBottom: 24 },
  choicesContainer: { gap: 12 },
  choiceBtn: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  choiceText: { fontSize: 16, color: '#333' },
  choiceSelected: { borderColor: '#7ED4C0', backgroundColor: '#E8F8F5' },
  choiceTextSelected: { color: '#7ED4C0', fontWeight: 'bold' },
  choiceCorrect: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' },
  choiceTextCorrect: { color: '#4CAF50', fontWeight: 'bold' },
  choiceWrong: { borderColor: '#FF6B6B', backgroundColor: '#FFEBEE' },
  choiceTextWrong: { color: '#FF6B6B', fontWeight: 'bold' },
  resultCard: { marginTop: 24, padding: 16, backgroundColor: '#F5F5F5', borderRadius: 12 },
  resultTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  resultAnswer: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 12 },
  explanationCard: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12 },
  explanationLabel: { fontSize: 13, fontWeight: 'bold', color: '#7ED4C0', marginBottom: 4 },
  explanationText: { fontSize: 14, color: '#666', lineHeight: 22 },
  bottomBar: { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  checkBtn: { backgroundColor: '#7ED4C0', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  checkBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  nextBtn: { backgroundColor: '#7ED4C0', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9E9E9E' },
});
