import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Alert, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { createRecord } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATAR_MAP, AVATAR_KEYS } from '../../utils/avatars';
import { Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';

const BouncyButton = ({ onPress, disabled, style, children }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style?.width ? { width: style.width } : {}]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={[style, { width: '100%' }]}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const SUBJECT_LABELS: Record<string, string> = {
  korean: '국어', math: '수학', integrated: '통합교과',
  science: '과학', social: '사회', english: '영어',
};

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

const getTodaySeed = (subject: string) => {
  const now = new Date();
  const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
  const kstDate = new Date(kstTime);
  const dateStr = kstDate.getUTCFullYear() + '' + String(kstDate.getUTCMonth() + 1).padStart(2, '0') + String(kstDate.getUTCDate()).padStart(2, '0');
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
  const [textAnswer, setTextAnswer] = useState('');

  useEffect(() => {
    const loadProblems = async () => {
      try {
        const q = query(
          collection(db, 'questions'),
          where('subject', '==', subject) // 복합 인덱스 에러 우회
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          Alert.alert('디버그 안내', `questions 컬렉션에서 ${subject} 과목의 문제가 비어있습니다.`);
          setProblems([]);
          return;
        }

        // 로컬에서 필터링
        const validDocs = snap.docs.filter((doc: any) => {
          const d = doc.data();
          return Number(d.grade) === Number(grade) && d.isActive === true;
        });

        if (validDocs.length === 0) {
          Alert.alert('디버그 안내', `해당 과목은 있지만 학년(${grade})과 활성화(true) 조건을 만족하는 문제가 없습니다.`);
          setProblems([]);
          return;
        }

        const allProblems = validDocs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            question: String(data.question || ''),
            choices: data.options || [],
            correctAnswer: data.type === 'short_answer' ? String(data.answer || '') : (data.options && data.options[data.answer] ? data.options[data.answer] : ''),
            explanation: String(data.explanation || '해설이 없습니다.'),
            questionType: data.type === 'multiple_choice' ? 'mcq' : data.type === 'ox' ? 'ox' : data.type === 'short_answer' ? 'short_answer' : 'subjective',
            difficulty: data.difficulty || 'medium',
            unit: data.unit || '',
            visualType: data.visual_type || null,
            visualData: typeof data.visual_data === 'string' ? JSON.parse(data.visual_data) : (data.visual_data || null),
            createdAt: data.createdAt || '',
          };
        });

        const now = new Date();
        const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
        const kstDate = new Date(kstTime);
        const dateTokens = kstDate.toDateString().split(' '); // e.g. ["Thu", "Apr", "30", "2026"]
        const targetDatePart = `${dateTokens[1]} ${dateTokens[2]} ${dateTokens[3]}`; // "Apr 30 2026"

        const todayProblems = allProblems.filter(p => p.questionType !== 'subjective' && p.createdAt.includes(targetDatePart));
        
        // 오늘 날짜의 문제가 없으면 기존 활성 문제들로 대체 (안전망)
        const targetList = todayProblems.length > 0 ? todayProblems : allProblems.filter(p => p.questionType !== 'subjective');

        const todaySeed = getTodaySeed(subject);
        const shuffled = seededShuffle(targetList, todaySeed);
        
        // [테스트용] 모든 회원 등급 제한 해제 (전체 문제 제공)
        setProblems(shuffled);
      } catch (error: any) {
        console.log('Firestore 로드 에러:', error);
        Alert.alert('Firestore 로드 에러', error.message || '알 수 없는 오류');
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

  const playSound = async (isCorrectAns: boolean) => {
    try {
      const url = isCorrectAns 
        ? 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3' 
        : 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3';
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      console.log('Sound play error:', e);
    }
  };

  const handleCheckAnswer = async () => {
    if (currentProblem.questionType === 'short_answer') {
      if (!textAnswer.trim()) {
        setShowNoAnswerModal(true);
        return;
      }
      const userAnswer = textAnswer.trim().replace(/\s/g, '').toLowerCase();
      const correctAnswerClean = currentProblem.correctAnswer.trim().replace(/\s/g, '').toLowerCase();
      const correct = userAnswer === correctAnswerClean;
      setIsCorrect(correct);
      setIsAnswered(true);
      playSound(correct);
      await saveResult(correct ? 1 : 0, correct ? 0 : 1, 1);
      if (correct) setCorrectCount(prev => prev + 1);
      else setWrongCount(prev => prev + 1);
      return;
    }
    if (!selectedAnswer) {
      setShowNoAnswerModal(true);
      return;
    }
    const correct = selectedAnswer === currentProblem.correctAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);
    playSound(correct);
    await saveResult(correct ? 1 : 0, correct ? 0 : 1, 1);
    if (correct) setCorrectCount(prev => prev + 1);
    else setWrongCount(prev => prev + 1);
  };

  const saveResult = async (correctCount: number, wrongCount: number, totalQuestions: number) => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      if (parentId && childId) {
        const now = new Date();
        const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
        const kstDate = new Date(kstTime);
        const year = kstDate.getUTCFullYear();
        const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(kstDate.getUTCDate()).padStart(2, '0');
        const dateStr = year + '-' + month + '-' + day;
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
      }
    } catch (error) {
      console.log('결과 저장 실패:', error);
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 >= problems.length) {
      router.replace({
        pathname: '/study/complete',
        params: {
          subject,
          total: String(problems.length),
          correct: String(correctCount),
          wrong: String(wrongCount),
        },
      });
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setTextAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
  };

  const handleClose = () => setShowExitModal(true);
  const handleExitConfirm = () => {
    setShowExitModal(false);
    router.replace('/(tabs)/study');
  };
  const handleExitCancel = () => setShowExitModal(false);

  // ========== 시각자료 렌더링 (완전 구현) ==========
  const renderVisualHint = () => {
    const vd = currentProblem?.visualData;
    const vType = currentProblem?.visualType;
    if (!vd) return null;

    // 1. scene_illustration (선생님/대화 장면)
    if (vType === 'scene_illustration') {
      return (
        <View style={styles.visualBox}>
          {vd.board_text && (
            <View style={styles.boardBox}>
              <Text style={styles.boardText}>{vd.board_text}</Text>
            </View>
          )}
          <View style={styles.charactersRow}>
            {(vd.characters || []).map((c: any, idx: number) => {
              // 아바타 랜덤 배정 로직 (avatar_01 ~ avatar_29)
              const keyIndex = (c.name ? c.name.length : idx) % AVATAR_KEYS.length;
              const avatarSource = AVATAR_MAP[AVATAR_KEYS[keyIndex]];
              return (
                <View key={idx} style={styles.characterItem}>
                  <Image source={avatarSource} style={styles.characterImage} resizeMode="contain" />
                  {c.name && <Text style={styles.characterName}>{c.name}</Text>}
                </View>
              );
            })}
          </View>
          {vd.speech_bubble && (
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>💬 {vd.speech_bubble}</Text>
            </View>
          )}
          {vd.scene_description && (
            <Text style={styles.sceneDesc}>{vd.scene_description}</Text>
          )}
        </View>
      );
    }

    // 2. emoji_scene (사물/개수 표현)
    if (vType === 'emoji_scene' && vd.items) {
      const totalCount = Array.isArray(vd.items)
        ? vd.items.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
        : 0;
      const isBundle = vd.layout === 'bundle' || totalCount > 50;
      return (
        <View style={styles.visualBox}>
          <View style={styles.emojiGrid}>
            {(vd.items || []).map((item: any, idx: number) => (
              <View key={idx} style={styles.emojiItem}>
                <Text style={styles.emojiLarge}>{item.emoji}</Text>
                <Text style={styles.emojiLabel}>{item.label}</Text>
                {isBundle && <Text style={styles.emojiCount}>×{item.count}</Text>}
              </View>
            ))}
          </View>
          {vd.description && <Text style={styles.sceneDesc}>{vd.description}</Text>}
        </View>
      );
    }

    // 3. image_match (카드 형식)
    if (vType === 'image_match' && vd.items) {
      return (
        <View style={styles.visualBox}>
          <View style={styles.imageMatchRow}>
            {(vd.items || []).map((item: any, idx: number) => (
              <View key={idx} style={styles.imageMatchCard}>
                <Text style={styles.emojiLarge}>{item.emoji}</Text>
                <Text style={styles.imageMatchLabel}>{item.name || item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    // 4. word_card / word_compare (단어 카드)
    if (vType === 'word_card' && vd.word) {
      return (
        <View style={styles.visualBox}>
          <Text style={styles.bigWord}>{vd.word}</Text>
        </View>
      );
    }
    if (vType === 'word_compare' && vd.word_left && vd.word_right) {
      return (
        <View style={styles.visualBox}>
          <View style={styles.compareRow}>
            <Text style={styles.compareWord}>{vd.word_left}</Text>
            <Text style={styles.compareVs}>VS</Text>
            <Text style={styles.compareWord}>{vd.word_right}</Text>
          </View>
        </View>
      );
    }

    // 5. sentence_display (문장 표시)
    if (vType === 'sentence_display' && vd.sentence) {
      return (
        <View style={styles.visualBox}>
          <Text style={styles.sentenceText}>{vd.sentence}</Text>
        </View>
      );
    }

    // 6. 그 외 text_only는 아무것도 표시하지 않음
    return null;
  };

  if (problems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View />
          <TouchableOpacity onPress={() => router.replace('/(tabs)/study')}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>오늘의 문제가 없거나 불러오는 중입니다.</Text>
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

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.questionLabel}>Q{currentIndex + 1}</Text>
        <Text style={styles.questionText}>{String(currentProblem.question)}</Text>

        {renderVisualHint()}

        {currentProblem.questionType === 'short_answer' ? (
          <View style={styles.shortAnswerContainer}>
            <Text style={styles.shortAnswerLabel}>✏️ 답을 입력하세요</Text>
            <TextInput
              style={[styles.shortAnswerInput, isAnswered && styles.shortAnswerInputDisabled]}
              value={textAnswer}
              onChangeText={setTextAnswer}
              placeholder="정답을 입력하세요"
              placeholderTextColor="#9E9E9E"
              editable={!isAnswered}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : (
          <View style={[
            styles.choicesContainer,
            (currentProblem.choices || []).every((c: string) => String(c).length <= 10) && styles.choicesGridContainer
          ]}>
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

              const isGrid = (currentProblem.choices || []).every((c: string) => String(c).length <= 10);
              if (isGrid) {
                choiceStyle = { ...choiceStyle, ...styles.choiceGridItem };
              }

              return (
                <BouncyButton
                  key={index}
                  style={choiceStyle}
                  onPress={() => handleSelectAnswer(choice)}
                  disabled={isAnswered}
                >
                  <Text style={choiceTextStyle} numberOfLines={2} adjustsFontSizeToFit>{prefix}{String(choice)}</Text>
                </BouncyButton>
              );
            })}
          </View>
        )}

        {isAnswered && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultTitle, { color: isCorrect ? '#4CAF50' : '#FF6B6B' }]}>
              {isCorrect ? '🎉 정답이에요!' : '😢 틀렸어요'}
            </Text>
            <Text style={styles.resultAnswer}>정답: {String(currentProblem.correctAnswer)}</Text>
            <View style={styles.explanationCard}>
              <Text style={styles.explanationLabel}>💡 해설</Text>
              <Text style={styles.explanationText}>{String(currentProblem.explanation)}</Text>
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

      {/* 모달들 */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>학습 중단</Text>
            <Text style={styles.modalMessage}>학습을 중단하시겠어요?\n진행한 문제는 저장됩니다.</Text>
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

      {isAnswered && isCorrect && (
        <ConfettiCannon
          count={100}
          origin={{ x: -10, y: 0 }}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={350}
          fallSpeed={3000}
        />
      )}
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
  scrollContent: { padding: 16, paddingBottom: 24 },
  questionLabel: { fontSize: 13, fontWeight: 'bold', color: '#7ED4C0', marginBottom: 4, textAlign: 'center' },
  questionText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  choicesContainer: { gap: 8 },
  choicesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  choiceBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  choiceGridItem: {
    width: '48%',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  shortAnswerContainer: { marginTop: 8 },
  shortAnswerLabel: { fontSize: 14, color: '#7ED4C0', fontWeight: 'bold', marginBottom: 12 },
  shortAnswerInput: { borderWidth: 2, borderColor: '#7ED4C0', borderRadius: 12, padding: 16, fontSize: 18, color: '#333', backgroundColor: '#FFFFFF' },
  shortAnswerInputDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0', color: '#999' },
  // 시각자료 스타일
  visualBox: { backgroundColor: '#F8FFFE', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E0F2F1' },
  boardBox: { backgroundColor: '#2E4A3E', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12, width: '100%', alignItems: 'center' },
  boardText: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  charactersRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40, marginBottom: 12 },
  characterItem: { alignItems: 'center' },
  characterImage: { width: 64, height: 64, marginBottom: 4 },
  characterName: { fontSize: 12, fontWeight: 'bold', color: '#555', marginTop: 0 },
  speechBubble: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1.5, borderColor: '#FFD54F', marginBottom: 12 },
  speechText: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  sceneDesc: { fontSize: 12, color: '#999', textAlign: 'center' },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  emojiItem: { alignItems: 'center', margin: 4 },
  emojiLarge: { fontSize: 40 },
  emojiLabel: { fontSize: 10, color: '#666' },
  emojiCount: { fontSize: 12, fontWeight: 'bold', color: '#555', marginTop: 2 },
  imageMatchRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  imageMatchCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E0E0E0', minWidth: 80 },
  imageMatchLabel: { fontSize: 12, fontWeight: 'bold', color: '#333', marginTop: 8 },
  bigWord: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  compareWord: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  compareVs: { fontSize: 18, fontWeight: 'bold', color: '#999' },
  sentenceText: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', lineHeight: 32 },
});
