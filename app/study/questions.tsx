import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput } from 'react-native';
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
        console.log('=== Firestore 문제 로드 시작 ===');
        console.log('grade:', grade, 'subject:', subject, 'tier:', tier);

        const q = query(
          collection(db, 'questions'),
          where('grade', '==', grade),
          where('subject', '==', subject),
          where('isActive', '==', true)
        );

        const snap = await getDocs(q);
        console.log('Firestore 문제 수:', snap.size);

        if (snap.empty) {
          console.log('=== 문제가 없습니다! grade:', grade, 'subject:', subject);
          setProblems([]);
          return;
        }

        const allProblems = snap.docs.map(doc => {
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
          };
        });

        const filtered = allProblems.filter(p => p.questionType !== 'subjective');
        console.log('필터 후 문제 수:', filtered.length);

        const todaySeed = getTodaySeed(subject);
        console.log('오늘 시드:', todaySeed, '과목:', subject);
        const shuffled = seededShuffle(filtered, todaySeed);

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
    setTextAnswer('');
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

  // ★ 비주얼 힌트 렌더링 함수
  const renderVisualHint = () => {
    if (!currentProblem.visualData) return null;
    const vd = currentProblem.visualData;

    return (
      <View style={styles.visualBox}>
        {/* 캐릭터 (인사 장면 등) + 확장 렌더링 */}
        {vd.characters && Array.isArray(vd.characters) && (
          <View style={{ alignItems: 'center', width: '100%' }}>
            {(vd.board_text || vd.highlight_text) && (
              <View style={{
                backgroundColor: '#2E4A3E', borderRadius: 12, paddingHorizontal: 24,
                paddingVertical: 14, marginBottom: 12, borderWidth: 2, borderColor: '#8B6914'
              }}>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
                  {vd.board_text || vd.highlight_text}
                </Text>
              </View>
            )}

            <View style={styles.visualCharRow}>
              {vd.characters.map((c: any, i: number) => (
                <View key={i} style={styles.visualCharItem}>
                  <Text style={styles.visualCharEmoji}>{c.emoji || '👤'}</Text>
                  <Text style={styles.visualCharName}>{c.name || ''}</Text>
                </View>
              ))}
            </View>

            {(vd.speech_bubble || vd.dialogue) && (
              <View style={{
                backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16,
                paddingVertical: 10, marginTop: 10, borderWidth: 1.5, borderColor: '#7ED4C0',
                maxWidth: '90%'
              }}>
                <Text style={{ fontSize: 13, color: '#333', textAlign: 'center', lineHeight: 20 }}>
                  💬 {vd.speech_bubble || vd.dialogue}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ★ 이모지 씬 (묶음/낱개 지원 + 기존 호환) */}
        {(vd.emoji || vd.emojis) && !vd.characters && !vd.items && (
          <View style={{ alignItems: 'center', width: '100%' }}>
            {vd.groups ? (
              <View style={{ width: '100%', alignItems: 'center' }}>
                {vd.groups.map((g: any, gi: number) => (
                  <View key={gi} style={{
                    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
                    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 8,
                    marginBottom: 6, borderWidth: 1, borderColor: '#FFE082', width: '90%'
                  }}>
                    {Array.from({ length: g.count || 0 }).map((_, ei) => (
                      <Text key={ei} style={{ fontSize: 18, margin: 1 }}>{g.emoji || '🍎'}</Text>
                    ))}
                    {g.label && (
                      <Text style={{ fontSize: 10, color: '#F57F17', width: '100%', textAlign: 'center', marginTop: 2 }}>
                        {g.label}
                      </Text>
                    )}
                  </View>
                ))}
                {vd.singles && (
                  <View style={{
                    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
                    backgroundColor: '#E8F5E9', borderRadius: 10, padding: 8,
                    marginTop: 4, borderWidth: 1, borderColor: '#A5D6A7', width: '90%'
                  }}>
                    {Array.from({ length: vd.singles.count || 0 }).map((_, ei) => (
                      <Text key={ei} style={{ fontSize: 18, margin: 1 }}>{vd.singles.emoji || '🍎'}</Text>
                    ))}
                    {vd.singles.label && (
                      <Text style={{ fontSize: 10, color: '#2E7D32', width: '100%', textAlign: 'center', marginTop: 2 }}>
                        {vd.singles.label}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '90%' }}>
                {[...String(vd.emoji || vd.emojis)].filter((c: string) => c.trim()).map((emoji: string, i: number) => (
                  <Text key={i} style={{ fontSize: 20, margin: 2 }}>{emoji}</Text>
                ))}
              </View>
            )}
            {vd.description && (
              <Text style={{ fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' }}>{vd.description}</Text>
            )}
          </View>
        )}

        {/* 이미지 매칭 카드 */}
        {vd.items && Array.isArray(vd.items) && (
          <View style={styles.visualCardRow}>
            {vd.items.map((item: any, i: number) => (
              <View key={i} style={styles.visualCard}>
                <Text style={styles.visualCardEmoji}>{item.emoji || ''}</Text>
                <View style={styles.visualCardLabelBox}>
                  <Text style={styles.visualCardLabel}>{item.label || ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 글자 비교 */}
        {vd.word_left && vd.word_right && (
          <View style={styles.visualCompareRow}>
            <View style={styles.visualCompareBox}>
              <Text style={styles.visualCompareBigText}>{vd.word_left}</Text>
            </View>
            <Text style={styles.visualCompareVs}>VS</Text>
            <View style={styles.visualCompareBox}>
              <Text style={styles.visualCompareBigText}>{vd.word_right}</Text>
            </View>
          </View>
        )}

        {/* 문장 말풍선 */}
        {vd.sentence && (
          <View style={styles.visualBubble}>
            <Text style={styles.visualBubbleText}>{vd.sentence}</Text>
          </View>
        )}

        {/* 모음자 원형 */}
        {vd.vowel && (
          <View style={styles.visualVowelCircle}>
            <Text style={styles.visualVowelText}>{vd.vowel}</Text>
          </View>
        )}

        {/* 낱말 카드 하이라이트 */}
        {vd.word && !vd.word_left && (
          <View style={styles.visualWordRow}>
            {vd.word.split('').map((char: string, i: number) => {
              const isHL = char === vd.highlight_syllable;
              return (
                <View key={i} style={[styles.visualWordBox, isHL && styles.visualWordBoxHL]}>
                  <Text style={[styles.visualWordChar, isHL && styles.visualWordCharHL]}>{char}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 문장 템플릿 (빈칸 채우기) */}
        {vd.sentence_template && !vd.word_left && !vd.sentence && (
          <View style={styles.visualTemplateBox}>
            {vd.example_sentence && (
              <View style={styles.visualExampleRow}>
                <Text style={styles.visualExampleLabel}>보기</Text>
                <Text style={styles.visualExampleText}>
                  {vd.example_emoji || ''} {vd.example_sentence}
                </Text>
              </View>
            )}
            <Text style={styles.visualTemplateText}>
              {vd.target_emoji || ''} {vd.sentence_template}
            </Text>
          </View>
        )}

        {/* 화살표 변환 */}
        {vd.before && vd.after && !vd.word_left && (
          <View style={styles.visualCompareRow}>
            <View style={styles.visualCompareBox}>
              <Text style={styles.visualCompareBigText}>{vd.before}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>→</Text>
              {vd.arrow_label && (
                <Text style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{vd.arrow_label}</Text>
              )}
            </View>
            <View style={styles.visualCompareBox}>
              <Text style={styles.visualCompareBigText}>{vd.after}</Text>
            </View>
          </View>
        )}

        {/* 자음 조합 박스 */}
        {vd.letters && Array.isArray(vd.letters) && (
          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {vd.letters.map((letter: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.visualCompareBox, { width: 52, height: 52 }]}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>{letter}</Text>
                  </View>
                  {i < vd.letters.length - 1 && (
                    <Text style={{ fontSize: 16, color: '#999', marginHorizontal: 2 }}>+</Text>
                  )}
                </View>
              ))}
              {vd.result && (
                <>
                  <Text style={{ fontSize: 18, color: '#999', marginHorizontal: 6 }}>=</Text>
                  <View style={[styles.visualCompareBox, { width: 56, height: 56, borderColor: '#4CAF50', borderWidth: 2 }]}>
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#4CAF50' }}>{vd.result}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* 선 잇기 */}
        {vd.left_items && vd.right_items && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 10 }}>
            <View style={{ gap: 10 }}>
              {vd.left_items.map((item: string, i: number) => (
                <View key={i} style={[styles.visualCard, { minWidth: 80 }]}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333', textAlign: 'center' }}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={{ justifyContent: 'center' }}>
              <Text style={{ fontSize: 24, color: '#BDBDBD' }}>⟷</Text>
            </View>
            <View style={{ gap: 10 }}>
              {vd.right_items.map((item: string, i: number) => (
                <View key={i} style={[styles.visualCard, { minWidth: 80 }]}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333', textAlign: 'center' }}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 장면 설명 */}
        {vd.scene_description && (
          <Text style={styles.visualDesc}>{vd.scene_description}</Text>
        )}
      </View>
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
                  <Text style={choiceTextStyle}>{prefix}{String(choice)}</Text>
                </TouchableOpacity>
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
  shortAnswerContainer: { marginTop: 8 },
  shortAnswerLabel: { fontSize: 14, color: '#7ED4C0', fontWeight: 'bold', marginBottom: 12 },
  shortAnswerInput: { borderWidth: 2, borderColor: '#7ED4C0', borderRadius: 12, padding: 16, fontSize: 18, color: '#333', backgroundColor: '#FFFFFF' },
  shortAnswerInputDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0', color: '#999' },
  visualBox: { backgroundColor: '#F8FFFE', borderRadius: 16, padding: 16, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E0F2F1' },
  visualCharRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 },
  visualCharItem: { alignItems: 'center' },
  visualCharEmoji: { fontSize: 40 },
  visualCharName: { fontSize: 13, fontWeight: 'bold', color: '#555', marginTop: 4 },
  visualSingleEmoji: { fontSize: 48, textAlign: 'center' },
  visualCardRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  visualCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', minWidth: 75 },
  visualCardEmoji: { fontSize: 30 },
  visualCardLabelBox: { backgroundColor: '#7ED4C0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  visualCardLabel: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' },
  visualCompareRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  visualCompareBox: { backgroundColor: '#FFFFFF', borderRadius: 12, width: 72, height: 72, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#B39DDB' },
  visualCompareBigText: { fontSize: 34, fontWeight: 'bold', color: '#333' },
  visualCompareVs: { fontSize: 16, fontWeight: 'bold', color: '#9E9E9E' },
  visualBubble: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1.5, borderColor: '#FFD54F' },
  visualBubbleText: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  visualVowelCircle: { backgroundColor: '#FFFFFF', borderRadius: 40, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#B39DDB' },
  visualVowelText: { fontSize: 36, fontWeight: 'bold', color: '#7C4DFF' },
  visualWordRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  visualWordBox: { backgroundColor: '#FFFFFF', borderRadius: 10, width: 52, height: 58, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#B0BEC5' },
  visualWordBoxHL: { backgroundColor: '#FF8A65', borderColor: '#FF5722' },
  visualWordChar: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  visualWordCharHL: { color: '#FFFFFF' },
  visualTemplateBox: { width: '100%' },
  visualExampleRow: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#81C784' },
  visualExampleLabel: { fontSize: 11, fontWeight: 'bold', color: '#81C784', marginBottom: 2 },
  visualExampleText: { fontSize: 14, color: '#333' },
  visualTemplateText: { fontSize: 15, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 4 },
  visualDesc: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 8 },
});
