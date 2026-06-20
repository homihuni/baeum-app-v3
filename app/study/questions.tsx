import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { createRecord } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATAR_MAP, AVATAR_KEYS } from '../../utils/avatars';
import { Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SUBJECT_THEME, GRADE_THEME } from '../../utils/quizTheme';
import VisualRenderer from '../../components/quiz/VisualRenderer';

const BouncyButton = ({ onPress, disabled, style, children }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={styles.bouncyTouchable}
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

const USE_MOCK_PROBLEMS = false;
const PROBLEM_CACHE_KEYS = [
  'problems',
  'questions',
  'studyProblems',
  'dailyProblems',
  'problemCache',
  'childProblems',
];
const FIRESTORE_TEST_FILTER = {
  collection: 'questions',
  semester: 1,
};

const normalizeFirestoreSubject = (value: string) => {
  return SUBJECT_LABELS[value] || value;
};

type QuizOption = {
  id: string;
  text: string;
  imageUrl?: string;
  emoji?: string;
};

const FIRST_GRADE_SAMPLE_PROBLEMS: Record<string, any[]> = {
  korean: [
    {
      id: 'sample-korean-1',
      question: '받침이 있는 낱말을 읽어 보세요.',
      choices: [
        { id: '1', text: '바람' },
        { id: '2', text: '바다' },
        { id: '3', text: '나무' },
      ],
      correctAnswer: '1',
      explanation: '바람에는 받침 ㅁ이 있어요.',
      questionType: 'multiple_choice',
      visual: {
        type: 'word_card',
        text: '바람',
        emoji: '🌬️',
      },
    },
    {
      id: 'sample-korean-2',
      question: '그림에 알맞은 문장을 골라 보세요.',
      choices: [
        { id: '1', text: '비가 와요.' },
        { id: '2', text: '눈이 와요.' },
        { id: '3', text: '해가 떠요.' },
      ],
      correctAnswer: '1',
      explanation: '우산을 쓰고 있으므로 비가 오는 날이에요.',
      questionType: 'multiple_choice',
      visual: {
        type: 'illustration',
        imageUrl: '',
        altText: '비 오는 날 우산을 쓰고 있는 아이',
      },
    },
  ],
  math: [
    {
      id: 'sample-math-1',
      question: '사과는 모두 몇 개인가요?',
      choices: [
        { id: '1', text: '4개' },
        { id: '2', text: '5개' },
        { id: '3', text: '6개' },
      ],
      correctAnswer: '2',
      explanation: '사과를 하나씩 세어 보면 모두 5개예요.',
      questionType: 'multiple_choice',
      visual: {
        type: 'counting_objects',
        object: 'apple',
        count: 5,
      },
    },
  ],
  integrated: [
    {
      id: 'sample-integrated-1',
      question: '비 오는 날 필요한 물건을 골라 보세요.',
      choices: [
        { id: '1', text: '우산', emoji: '☂️' },
        { id: '2', text: '수영복', emoji: '🩱' },
        { id: '3', text: '목도리', emoji: '🧣' },
      ],
      correctAnswer: '1',
      explanation: '비 오는 날에는 우산을 사용해요.',
      questionType: 'image_select',
      visual: { type: 'none' },
    },
  ],
};

const getSampleProblems = (grade: number, subject: string) => {
  if (!USE_MOCK_PROBLEMS) return [];
  if (grade !== 1) return [];
  return FIRST_GRADE_SAMPLE_PROBLEMS[subject] || [];
};

const clearProblemCache = async () => {
  await AsyncStorage.multiRemove(PROBLEM_CACHE_KEYS);
};

const normalizeOptions = (options: any[]): QuizOption[] => {
  return (options || []).map((option: any, index: number) => {
    if (typeof option === 'string') {
      return { id: String(index), text: option };
    }
    const text = option.text ?? option.label ?? option.name ?? option.value ?? option.content ?? option.choice ?? option.title ?? option.answer ?? '';
    return {
      id: String(option.id ?? index),
      text: String(text),
      imageUrl: option.imageUrl || option.image_url || '',
      emoji: option.emoji || '',
    };
  });
};

const getAnswerId = (answer: any, options: QuizOption[]) => {
  if (typeof answer === 'number') return options[answer]?.id || String(answer);
  const answerText = String(answer ?? '');
  const optionById = options.find(option => option.id === answerText);
  if (optionById) return optionById.id;
  const optionByText = options.find(option => option.text === answerText);
  return optionByText?.id || answerText;
};


const getUploadedQuestionAnswer = (data: any, choices: QuizOption[]) => {
  if (typeof data.answer_index === 'number') {
    return choices[data.answer_index]?.id || String(data.answer_index);
  }
  return getAnswerId(data.answer ?? data.correctAnswer ?? data.correct_answer ?? data.correct ?? '', choices);
};

const getUploadedQuestionVisual = (data: any) => {
  const visualData = typeof data.visual_data === 'string' ? JSON.parse(data.visual_data) : (data.visual_data || null);
  const imageUrl = data.image_sector?.image_url || data.imageUrl || data.image_url || '';

  if (data.image_sector?.enabled && imageUrl) {
    return {
      type: 'illustration',
      imageUrl,
      altText: visualData?.target_word ? `${visualData.target_word} 그림` : '문제 그림',
    };
  }

  if (data.visual_type === 'word_card') {
    return {
      type: 'word_card',
      text: visualData?.target_syllable || visualData?.answer_value || visualData?.word || '',
    };
  }

  return {
    type: 'none',
  };
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
  const subjectTheme = SUBJECT_THEME[subject] || SUBJECT_THEME.korean;
  const lowerTheme = GRADE_THEME.lower;

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
        await clearProblemCache();
        const normalizedSubject = normalizeFirestoreSubject(subject);
        const q = query(
          collection(db, FIRESTORE_TEST_FILTER.collection),
          where('grade', '==', grade),
          where('semester', '==', FIRESTORE_TEST_FILTER.semester),
          where('subject', '==', normalizedSubject),
        );
        console.log('[ProblemLoad] routeSubject=' + subject);
        console.log('[ProblemLoad] normalizedSubject=' + normalizedSubject);
        console.log(`[ProblemLoad] firestoreFilter collection=${FIRESTORE_TEST_FILTER.collection} grade=${grade} semester=${FIRESTORE_TEST_FILTER.semester} subject=${normalizedSubject}`);
        const snap = await getDocs(q);

        const sampleProblems = getSampleProblems(grade, subject);

        if (snap.empty) {
          console.log('Firestore 조회 결과 0개');
          console.log('사용한 collection:', FIRESTORE_TEST_FILTER.collection);
          console.log('사용한 grade:', grade);
          console.log('사용한 semester:', FIRESTORE_TEST_FILTER.semester);
          console.log('사용한 subject:', normalizedSubject);
          console.log('fallback 사용 여부:', USE_MOCK_PROBLEMS);
          console.log('[ProblemLoad] source=firestore count=0');
          setProblems(sampleProblems);
          return;
        }

        const allProblems = snap.docs.map((doc: any) => {
          const data = doc.data();
          const choices = normalizeOptions(data.options || data.choices || []);
          const problemType = data.type || data.questionType || data.question_type || 'multiple_choice';
          const rawAnswer = data.answer ?? data.correctAnswer ?? data.correct_answer ?? data.correct ?? data.visual_data?.answer_value ?? '';
          const correctAnswer = problemType === 'short_answer' ? String(rawAnswer || '') : getUploadedQuestionAnswer(data, choices);
          const visualData = typeof data.visual_data === 'string' ? JSON.parse(data.visual_data) : (data.visual_data || null);
          const visual = data.visual || getUploadedQuestionVisual(data);
          return {
            id: doc.id,
            questionId: data.question_id || doc.id,
            question: String(data.question || data.questionText || data.question_text || data.prompt || ''),
            choices,
            correctAnswer,
            explanation: String(data.explanation || '해설이 없습니다.'),
            questionType: problemType === 'multiple_choice' ? 'multiple_choice' : problemType === 'image_select' ? 'image_select' : problemType === 'ox' ? 'ox' : problemType === 'short_answer' ? 'short_answer' : 'multiple_choice',
            difficulty: data.difficulty || 'medium',
            grade: data.grade || grade,
            semester: data.semester || FIRESTORE_TEST_FILTER.semester,
            subject: data.subject || normalizedSubject,
            unit: data.unit || '',
            visual,
            visualType: data.visual_type || null,
            visualData,
            createdAt: data.createdAt || '',
          };
        }).sort((a: any, b: any) => String(a.questionId || a.id).localeCompare(String(b.questionId || b.id)));

        console.log(`[ProblemLoad] source=firestore count=${allProblems.length}`);
        console.log('[ProblemLoad] ids=' + allProblems.map(p => p.id).join(','));
        console.log('[ProblemLoad] firstQuestion=' + String(allProblems[0]?.question || ''));
        setProblems(allProblems);
      } catch (error: any) {
        console.log('Firestore 로드 에러:', error);
        console.log('fallback 사용 여부:', USE_MOCK_PROBLEMS);
        setProblems(getSampleProblems(grade, subject));
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
      if (correct) {
        await saveResult(1, 0, 1);
        setCorrectCount(prev => prev + 1);
      }
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
    if (correct) {
      await saveResult(1, 0, 1);
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setTextAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
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

  const renderMissionProgressPath = () => {
    const totalSteps = Math.min(problems.length, 5);
    return (
      <View style={styles.missionPath}>
        <Text style={styles.pathIcon}>🏫</Text>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepIndex = Math.floor((index / Math.max(totalSteps - 1, 1)) * Math.max(problems.length - 1, 0));
          const isDone = stepIndex < currentIndex;
          const isCurrent = stepIndex === currentIndex || (index === totalSteps - 1 && currentIndex >= stepIndex);
          return (
            <View key={index} style={styles.pathStepGroup}>
              <View style={[styles.pathLine, { backgroundColor: isDone ? subjectTheme.primary : '#E9DED3' }]} />
              <View style={[
                styles.pathDot,
                isDone && { backgroundColor: subjectTheme.primary, borderColor: subjectTheme.primary },
                isCurrent && { backgroundColor: subjectTheme.soft, borderColor: subjectTheme.primary },
              ]}>
                <Text style={[styles.pathDotText, { color: isDone ? '#FFFFFF' : subjectTheme.accent }]}>
                  {isDone ? '✓' : index + 1}
                </Text>
              </View>
            </View>
          );
        })}
        <Text style={styles.pathIcon}>🚩</Text>
      </View>
    );
  };

  const renderVisualRenderer = () => {
    const visual = currentProblem?.visual;
    if ((!visual || visual.type === 'none') && (currentProblem?.visualData || currentProblem?.visualType)) {
      return renderVisualHint();
    }

    return (
      <VisualRenderer
        visual={visual}
        softColor={subjectTheme.soft}
        accentColor={subjectTheme.accent}
      />
    );
  };

  const renderAnswerArea = () => {
    if (currentProblem.questionType === 'short_answer') {
      return (
        <View style={styles.shortAnswerContainer}>
          <Text style={[styles.shortAnswerLabel, { color: subjectTheme.accent }]}>✏️ 답을 입력하세요</Text>
          <TextInput
            style={[styles.shortAnswerInput, { borderColor: subjectTheme.primary }, isAnswered && styles.shortAnswerInputDisabled]}
            value={textAnswer}
            onChangeText={setTextAnswer}
            placeholder="정답을 입력하세요"
            placeholderTextColor="#9E9E9E"
            editable={!isAnswered}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      );
    }

    if (currentProblem.questionType === 'ox') {
      const oxChoices = currentProblem.choices.length > 0 ? currentProblem.choices : [{ id: 'O', text: 'O' }, { id: 'X', text: 'X' }];
      return (
        <View style={styles.oxRow}>
          {oxChoices.map((choice: QuizOption) => renderAnswerCard(choice, true))}
        </View>
      );
    }

    return (
      <View style={styles.choicesGridContainer}>
        {(currentProblem.choices || []).map((choice: QuizOption, index: number) => renderAnswerCard(choice, false, index))}
      </View>
    );
  };

  const renderAnswerCard = (choice: QuizOption, isOx = false, index = 0) => {
    const isSelected = selectedAnswer === choice.id;
    const isImageChoice = currentProblem.questionType === 'image_select';
    const displayText = String(choice.text || `보기 ${index + 1}`);
    const isLong = displayText.length > 12;
    const cardStyle = [
      styles.choiceBtn,
      isOx && styles.oxBtn,
      isImageChoice && styles.imageChoiceBtn,
      isLong && styles.choiceFullWidth,
      isSelected && { borderColor: subjectTheme.primary, backgroundColor: subjectTheme.soft },
    ];

    return (
      <BouncyButton
        key={choice.id}
        style={cardStyle}
        onPress={() => handleSelectAnswer(choice.id)}
        disabled={isAnswered && isCorrect}
      >
        {isImageChoice && (
          <View style={[styles.imageChoiceVisual, { backgroundColor: subjectTheme.soft }]}>
            {choice.imageUrl ? (
              <Image source={{ uri: choice.imageUrl }} style={styles.imageChoiceImage} resizeMode="contain" />
            ) : (
              <Text style={styles.imageChoiceEmoji}>{choice.emoji || '🎒'}</Text>
            )}
          </View>
        )}
        <View style={styles.choiceTextRow}>
          {!isOx && <Text style={[styles.choiceNumber, { backgroundColor: subjectTheme.soft, color: subjectTheme.accent }]}>{index + 1}</Text>}
          <Text style={[styles.choiceText, { fontSize: isOx ? 40 : lowerTheme.answerFontSize }]} numberOfLines={2} adjustsFontSizeToFit>
            {displayText}
          </Text>
        </View>
      </BouncyButton>
    );
  };

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

  const isConfirmEnabled = currentProblem?.questionType === 'short_answer' ? textAnswer.trim().length > 0 : !!selectedAnswer;
  const feedbackMessage = (() => {
    if (!isCorrect) return '그림과 보기를 천천히 다시 살펴보세요.';
    const raw = String(currentProblem.explanation || '잘했어요. 정답을 바르게 골랐어요.');
    const main = raw.split(/오답\s*해설|해설[:：]|\n/)[0].trim();
    const sentence = main.match(/^.*?[.!?。]/)?.[0] || main;
    return sentence.length > 72 ? sentence.slice(0, 72).trim() + '...' : sentence;
  })();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: subjectTheme.soft }]}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.replace('/(tabs)/study')}>
          <Text style={[styles.headerIconText, { color: subjectTheme.accent }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.subjectLabel, { color: subjectTheme.accent }]}>{subjectTheme.label || SUBJECT_LABELS[subject] || subject}</Text>
          <Text style={styles.progressText}>{currentProblem.grade}학년 {currentProblem.semester}학기 · {currentIndex + 1} / {problems.length}</Text>
          {!!currentProblem.unit && <Text style={styles.unitText} numberOfLines={1}>{currentProblem.unit}</Text>}
        </View>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {renderMissionProgressPath()}

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <View style={[styles.questionBadge, { backgroundColor: subjectTheme.primary }]}>
            <Text style={styles.questionBadgeText}>Q{currentIndex + 1}</Text>
          </View>
          <Text style={[styles.questionText, { fontSize: lowerTheme.questionFontSize }]}>{String(currentProblem.question)}</Text>
          {renderVisualRenderer()}
        </View>

        <View style={styles.answerArea}>
          {renderAnswerArea()}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.checkBtn,
            { backgroundColor: isConfirmEnabled && !isAnswered ? subjectTheme.primary : '#DADADA' },
          ]}
          onPress={handleCheckAnswer}
          disabled={!isConfirmEnabled || isAnswered}
        >
          <Text style={styles.checkBtnText}>정답 확인</Text>
        </TouchableOpacity>
      </View>

      {showExitModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>학습을 잠깐 멈출까요?</Text>
            <Text style={styles.modalMessage}>지금까지 맞힌 문제는 저장되어 있어요.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={handleExitCancel}>
                <Text style={styles.modalCancelText}>계속하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: subjectTheme.primary }]} onPress={handleExitConfirm}>
                <Text style={styles.modalConfirmText}>나가기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showNoAnswerModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>아직 답을 고르지 않았어요</Text>
            <Text style={styles.modalMessage}>답을 선택해주세요.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalSingleBtn, { backgroundColor: subjectTheme.primary }]} onPress={() => setShowNoAnswerModal(false)}>
                <Text style={styles.modalConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {isAnswered && (
        <View style={styles.feedbackOverlay}>
          <View style={[styles.feedbackCard, { borderColor: subjectTheme.soft }]}>
            <Text style={[styles.feedbackTitle, { color: isCorrect ? subjectTheme.accent : '#E56A6A' }]}>
              {isCorrect ? '정답이에요! 🎉' : '조금만 더 살펴볼까요?'}
            </Text>
            <Text style={styles.feedbackText} numberOfLines={4} adjustsFontSizeToFit>
              {feedbackMessage}
            </Text>
            <TouchableOpacity
              style={[styles.feedbackButton, { backgroundColor: isCorrect ? subjectTheme.primary : '#FFFFFF', borderColor: subjectTheme.primary }]}
              onPress={isCorrect ? handleNext : handleRetry}
            >
              <Text style={[styles.feedbackButtonText, { color: isCorrect ? '#FFFFFF' : subjectTheme.accent }]}>
                {isCorrect ? (currentIndex + 1 >= problems.length ? '학습 완료' : '다음 문제') : '다시 풀기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  bouncyTouchable: { width: '100%', minHeight: 50, justifyContent: 'center', alignItems: 'stretch' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
  headerIconText: { width: 44, height: 44, fontSize: 38, lineHeight: 44, fontWeight: '700', textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false },
  headerCenter: { alignItems: 'center', flex: 1 },
  subjectLabel: { fontSize: 24, fontWeight: '900' },
  progressText: { fontSize: 15, color: '#6E6A64', fontWeight: '800', marginTop: 2 },
  unitText: { maxWidth: 260, fontSize: 12, color: '#8F8A83', fontWeight: '700', marginTop: 1 },
  closeBtn: { fontSize: 24, color: '#8F8A83', fontWeight: '900', paddingHorizontal: 10 },
  progressBarBg: { height: 4, backgroundColor: '#E0E0E0', marginHorizontal: 20 },
  progressBarFill: { height: 4, backgroundColor: '#7ED4C0', borderRadius: 2 },
  missionPath: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFDF8' },
  pathIcon: { fontSize: 24 },
  pathStepGroup: { flexDirection: 'row', alignItems: 'center' },
  pathLine: { width: 18, height: 4, borderRadius: 2 },
  pathDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#E9DED3', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  pathDotText: { fontSize: 12, fontWeight: '900' },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 110 },
  questionCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F0E5D8', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  questionBadge: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginBottom: 8 },
  questionBadgeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  questionLabel: { fontSize: 13, fontWeight: 'bold', color: '#7ED4C0', marginBottom: 4, textAlign: 'center' },
  questionText: {
    fontWeight: '900',
    color: '#21362E',
    lineHeight: 31,
    marginBottom: 10,
    textAlign: 'center',
  },
  listenBtn: { alignSelf: 'center', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8, marginBottom: 10 },
  listenBtnText: { fontSize: 15, fontWeight: '900' },
  answerArea: { marginTop: 2 },
  choicesContainer: { gap: 10 },
  choicesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  choiceBtn: {
    width: '48%',
    minHeight: 50,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#EFE4D6',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  choiceGridItem: {
    width: '48%',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceFullWidth: { width: '100%', minHeight: 52 },
  choiceTextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 10, width: '100%' },
  choiceNumber: { width: 26, height: 26, borderRadius: 13, textAlign: 'center', lineHeight: 26, fontSize: 14, fontWeight: '900', overflow: 'hidden' },
  choiceText: { color: '#263A33', fontWeight: '900', textAlign: 'left', flex: 1 },
  oxRow: { flexDirection: 'row', gap: 12 },
  oxBtn: { flex: 1, minHeight: 120 },
  imageChoiceBtn: { minHeight: 142 },
  imageChoiceVisual: { width: '100%', height: 72, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  imageChoiceImage: { width: '90%', height: '90%' },
  imageChoiceEmoji: { fontSize: 42 },
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
  bottomBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#F0E8DD', backgroundColor: '#FFFDF8' },
  checkBtn: { borderRadius: 22, paddingVertical: 14, alignItems: 'center' },
  checkBtnText: { fontSize: 19, fontWeight: '900', color: '#FFFFFF' },
  nextBtn: { backgroundColor: '#7ED4C0', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9E9E9E' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  feedbackOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '85%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  modalMessage: { fontSize: 15, color: '#666', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#666' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7ED4C0', alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  modalSingleBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7ED4C0', alignItems: 'center' },
  feedbackCard: { backgroundColor: '#FFFFFF', borderRadius: 28, borderWidth: 2, padding: 22, width: '86%', maxWidth: 420, maxHeight: '78%', alignItems: 'center' },
  feedbackTitle: { fontSize: 25, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  feedbackText: { fontSize: 16, color: '#4E4A45', lineHeight: 24, textAlign: 'center', marginBottom: 18 },
  feedbackButton: { width: '100%', borderRadius: 20, borderWidth: 2, paddingVertical: 14, alignItems: 'center' },
  feedbackButtonText: { fontSize: 18, fontWeight: '900' },
  shortAnswerContainer: { marginTop: 8 },
  shortAnswerLabel: { fontSize: 14, color: '#7ED4C0', fontWeight: 'bold', marginBottom: 12 },
  shortAnswerInput: { borderWidth: 2, borderColor: '#7ED4C0', borderRadius: 12, padding: 16, fontSize: 18, color: '#333', backgroundColor: '#FFFFFF' },
  shortAnswerInputDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0', color: '#999' },
  // 시각자료 스타일
  visualBox: { backgroundColor: '#F8FFFE', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E0F2F1' },
  visualFrame: { minHeight: 190, borderRadius: 24, backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 8 },
  visualImage: { width: '100%', height: 190 },
  visualPlaceholder: { minHeight: 190, borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 18, marginBottom: 8 },
  visualPlaceholderIcon: { fontSize: 54, marginBottom: 8 },
  visualPlaceholderText: { fontSize: 17, color: '#6D6760', fontWeight: '800', textAlign: 'center', lineHeight: 24 },
  countingBox: { minHeight: 190, borderRadius: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 18, marginBottom: 8 },
  countingEmoji: { fontSize: 42 },
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
