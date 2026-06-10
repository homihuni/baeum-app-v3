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
import { QUIZ_OBJECT_EMOJI } from '../../utils/quizObjectAssets';

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
        data: { object: 'apple', count: 5 },
        altText: '사과 5개',
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
  if (grade !== 1) return [];
  return FIRST_GRADE_SAMPLE_PROBLEMS[subject] || [];
};

const normalizeOptions = (options: any[]): QuizOption[] => {
  return (options || []).map((option: any, index: number) => {
    if (typeof option === 'string') {
      return { id: String(index), text: option };
    }
    return {
      id: String(option.id ?? index),
      text: String(option.text ?? option.label ?? option.name ?? ''),
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
        const q = query(
          collection(db, 'questions'),
          where('subject', '==', subject) // 복합 인덱스 에러 우회
        );
        const snap = await getDocs(q);

        const sampleProblems = getSampleProblems(grade, subject);

        if (snap.empty) {
          setProblems(sampleProblems);
          return;
        }

        // 로컬에서 필터링
        const validDocs = snap.docs.filter((doc: any) => {
          const d = doc.data();
          return Number(d.grade) === Number(grade) && d.isActive === true;
        });

        if (validDocs.length === 0) {
          setProblems(sampleProblems);
          return;
        }

        const allProblems = validDocs.map((doc: any) => {
          const data = doc.data();
          const choices = normalizeOptions(data.options || []);
          const correctAnswer = data.type === 'short_answer' ? String(data.answer || '') : getAnswerId(data.answer, choices);
          const visual = data.visual || {
            type: data.visual_type || 'none',
            data: typeof data.visual_data === 'string' ? JSON.parse(data.visual_data) : (data.visual_data || null),
            imageUrl: data.imageUrl || data.image_url || '',
            altText: data.altText || data.alt_text || '',
          };
          return {
            id: doc.id,
            question: String(data.question || ''),
            choices,
            correctAnswer,
            explanation: String(data.explanation || '해설이 없습니다.'),
            questionType: data.type === 'multiple_choice' ? 'multiple_choice' : data.type === 'image_select' ? 'image_select' : data.type === 'ox' ? 'ox' : data.type === 'short_answer' ? 'short_answer' : 'subjective',
            difficulty: data.difficulty || 'medium',
            unit: data.unit || '',
            visual,
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
        const activeProblems = allProblems.filter(p => p.questionType !== 'subjective');
        const targetList = todayProblems.length > 0 ? todayProblems : activeProblems.length > 0 ? activeProblems : sampleProblems;

        const todaySeed = getTodaySeed(subject);
        const shuffled = seededShuffle(targetList, todaySeed);
        
        // [테스트용] 모든 회원 등급 제한 해제 (전체 문제 제공)
        setProblems(shuffled);
      } catch (error: any) {
        console.log('Firestore 로드 에러:', error);
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
        <Text style={styles.pathIcon}>🏁</Text>
      </View>
    );
  };

  const renderVisualRenderer = () => {
    const visual = currentProblem?.visual;
    if (!visual || visual.type === 'none') {
      if (currentProblem?.visualData || currentProblem?.visualType) return renderVisualHint();
      return (
        <View style={[styles.visualPlaceholder, { backgroundColor: subjectTheme.soft }]}>
          <Text style={styles.visualPlaceholderIcon}>🌱</Text>
          <Text style={styles.visualPlaceholderText}>그림 없이 풀어볼까요?</Text>
        </View>
      );
    }

    if ((visual.type === 'illustration' || visual.type === 'asset') && visual.imageUrl) {
      return (
        <View style={styles.visualFrame}>
          <Image source={{ uri: visual.imageUrl }} style={styles.visualImage} resizeMode="contain" />
        </View>
      );
    }

    if (visual.type === 'illustration' || visual.type === 'asset') {
      return (
        <View style={[styles.visualPlaceholder, { backgroundColor: subjectTheme.soft }]}>
          <Text style={styles.visualPlaceholderIcon}>🖼️</Text>
          <Text style={styles.visualPlaceholderText}>{visual.altText || '그림을 준비하고 있어요'}</Text>
        </View>
      );
    }

    if (visual.type === 'counting_objects') {
      const objectKey = visual.data?.object || 'star';
      const count = Math.min(Number(visual.data?.count || 0), 20);
      const emoji = QUIZ_OBJECT_EMOJI[objectKey] || '⭐';
      return (
        <View style={[styles.countingBox, { backgroundColor: subjectTheme.soft }]}>
          {Array.from({ length: count }).map((_, index) => (
            <Text key={index} style={styles.countingEmoji}>{emoji}</Text>
          ))}
        </View>
      );
    }

    return renderVisualHint();
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
    const isLong = String(choice.text).length > 12;
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
            {choice.text}
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: subjectTheme.soft }]}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.replace('/(tabs)/study')}>
          <Text style={[styles.headerIconText, { color: subjectTheme.accent }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.subjectLabel, { color: subjectTheme.accent }]}>{subjectTheme.label || SUBJECT_LABELS[subject] || subject}</Text>
          <Text style={styles.progressText}>{currentIndex + 1} / {problems.length}</Text>
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
          <TouchableOpacity style={[styles.listenBtn, { backgroundColor: subjectTheme.soft }]}>
            <Text style={[styles.listenBtnText, { color: subjectTheme.accent }]}>🔊 문제 듣기</Text>
          </TouchableOpacity>
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
        <View style={styles.modalOverlay}>
          <View style={styles.feedbackCard}>
            <Text style={[styles.feedbackTitle, { color: isCorrect ? subjectTheme.accent : '#E56A6A' }]}>
              {isCorrect ? '정답이에요! 🎉' : '조금만 더 살펴볼까요?'}
            </Text>
            <Text style={styles.feedbackText}>
              {isCorrect ? String(currentProblem.explanation) : '그림과 보기를 천천히 다시 살펴보세요.'}
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
  bouncyTouchable: { width: '100%', minHeight: '100%', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
  headerIconText: { fontSize: 38, fontWeight: '700', marginTop: -3 },
  headerCenter: { alignItems: 'center', flex: 1 },
  subjectLabel: { fontSize: 24, fontWeight: '900' },
  progressText: { fontSize: 15, color: '#6E6A64', fontWeight: '800', marginTop: 2 },
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
  scrollContent: { padding: 16, paddingBottom: 24 },
  questionCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#F0E5D8', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  questionBadge: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, marginBottom: 12 },
  questionBadgeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  questionLabel: { fontSize: 13, fontWeight: 'bold', color: '#7ED4C0', marginBottom: 4, textAlign: 'center' },
  questionText: {
    fontWeight: '900',
    color: '#21362E',
    lineHeight: 36,
    marginBottom: 12,
    textAlign: 'center',
  },
  listenBtn: { alignSelf: 'center', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9, marginBottom: 16 },
  listenBtnText: { fontSize: 15, fontWeight: '900' },
  answerArea: { marginTop: 2 },
  choicesContainer: { gap: 10 },
  choicesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  choiceBtn: {
    width: '48%',
    minHeight: 76,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#EFE4D6',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
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
  choiceFullWidth: { width: '100%' },
  choiceTextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  choiceNumber: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, fontSize: 15, fontWeight: '900', overflow: 'hidden' },
  choiceText: { color: '#263A33', fontWeight: '900', textAlign: 'center', flexShrink: 1 },
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
  bottomBar: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 22, borderTopWidth: 1, borderTopColor: '#F0E8DD', backgroundColor: '#FFFDF8' },
  checkBtn: { borderRadius: 22, paddingVertical: 18, alignItems: 'center' },
  checkBtnText: { fontSize: 19, fontWeight: '900', color: '#FFFFFF' },
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
  feedbackCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, width: '86%', maxWidth: 420, alignItems: 'center' },
  feedbackTitle: { fontSize: 25, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  feedbackText: { fontSize: 17, color: '#4E4A45', lineHeight: 25, textAlign: 'center', marginBottom: 20 },
  feedbackButton: { width: '100%', borderRadius: 20, borderWidth: 2, paddingVertical: 16, alignItems: 'center' },
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
