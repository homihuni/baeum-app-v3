import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { createRecord } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBJECT_LABELS: Record<string, string> = {
  korean: '국어', math: '수학', integrated: '통합교과',
  science: '과학', social: '사회', english: '영어',
};

// 날짜 기반 시드 셔플 함수
const seededShuffle = (array: any[], seed: number) => {
  const arr = [...array];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// KST 기준 오늘 날짜로 시드 생성
const getTodaySeed = (subject: string) => {
  const now = new Date();
  const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
  const kstDate = new Date(kstTime);
  const dateStr = kstDate.getUTCFullYear() + '' + String(kstDate.getUTCMonth() + 1).padStart(2, '0') + String(kstDate.getUTCDate()).padStart(2, '0');
  // 날짜 + 과목을 조합하여 시드 생성 (같은 날이라도 과목별로 다른 문제 세트)
  let hash = 0;
  const seedStr = dateStr + subject;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) || 1;
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
  const [showExitModal, setShowExitModal] = useState(false);
  const [showNoAnswerModal, setShowNoAnswerModal] = useState(false);

  useEffect(() => {
    const loadProblems = async () => {
      try {
        console.log('=== Firestore 문제 로드 시작 ===');
        console.log('grade:', grade, 'subject:', subject, 'tier:', tier);

        const q = query(
          collection(db, 'Problems'),
          where('grade', '==', grade),
          where('subject', '==', subject)
        );

        const snap = await getDocs(q);
        console.log('Firestore 문제 수:', snap.size);

        if (snap.empty) {
          console.log('=== 문제가 없습니다! grade:', grade, 'subject:', subject);
          setProblems([]);
          return;
        }

        // Firestore 문서를 앱에서 사용하는 형태로 변환
        const allProblems = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            question: data.question,
            choices: data.options || [],
            correctAnswer: data.options && data.options[data.answer] ? data.options[data.answer] : '',
            explanation: data.explanation || '해설이 없습니다.',
            questionType: data.type === 'multiple_choice' ? 'mcq' : data.type === 'ox' ? 'ox' : 'subjective',
            difficulty: data.difficulty || 'medium',
            unit: data.unit || '',
          };
        });

        // 주관식(subjective) 제외 — 현재 주관식 입력 UI 미구현
        const filtered = allProblems.filter(p => p.questionType !== 'subjective');
        console.log('주관식 제외 후 문제 수:', filtered.length);

        // 날짜 기반 시드 셔플 (같은 날 = 같은 순서, 다른 날 = 다른 순서)
        const todaySeed = getTodaySeed(subject);
        console.log('오늘 시드:', todaySeed, '과목:', subject);
        const shuffled = seededShuffle(filtered, todaySeed);

        // 티어별 문제 수 제한
        const maxQuestions = tier === 'sky' ? 10 : tier === 'baeum' ? 5 : 3;
        console.log('tier:', tier, 'maxQuestions:', maxQuestions);

        const selected = shuffled.slice(0, maxQuestions);
        console.log('선택된 문제 수:', selected.length);
        console.log('첫 번째 문제:', JSON.stringify(selected[0]));

        setProblems(selected);
      } catch (error) {
        console.log('=== Firestore 문제 로드 에러 ===', error);
        setProblems([]);
      }
    };

    loadProblems();
  }, []);

  const currentProblem = problems[currentIndex];

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
  };

  const handleCheckAnswer = async () => {
    if (!selectedAnswer) {
      setShowNoAnswerModal(true);
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
        // 한국 시간(KST, UTC+9) 기준 날짜 생성
        const now = new Date();
        const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
        const kstDate = new Date(kstTime);
        const year = kstDate.getUTCFullYear();
        const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(kstDate.getUTCDate()).padStart(2, '0');
        const dateStr = year + '-' + month + '-' + day;

        console.log("=== KST 날짜 계산 ===");
        console.log("UTC now:", now.toISOString());
        console.log("KST time:", kstDate.toISOString());
        console.log("저장할 dateStr:", dateStr);

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        await createRecord(parentId, childId, {
          subject: subject as string,
          date: dateStr,
          totalQuestions: totalQuestions,
          correctCount: correctCount,
          wrongCount: wrongCount,
          score: score,
          completedAt: now.toISOString(),
          grade: grade
        } as any);
        console.log("=== 기록 저장 완료 === date:", dateStr, "score:", score);
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
    setShowExitModal(true);
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    router.replace('/(tabs)/study');
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
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

      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>학습 중단</Text>
            <Text style={styles.modalMessage}>학습을 중단하시겠어요?{'\n'}진행한 문제는 저장됩니다.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={handleExitCancel}>
                <Text style={styles.modalCancelText}>계속하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleExitConfirm}>
                <Text style={styles.modalConfirmText}>중단하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showNoAnswerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>알림</Text>
            <Text style={styles.modalMessage}>답을 선택해주세요.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalSingleBtn} onPress={() => setShowNoAnswerModal(false)}>
                <Text style={styles.modalConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '85%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  modalMessage: { fontSize: 15, color: '#666', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#666' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7ED4C0', alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  modalSingleBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7ED4C0', alignItems: 'center' },
});
