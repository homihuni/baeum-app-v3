import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SafeLayout from '../../components/SafeLayout';

type PlayCard = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  accent: string;
  subjects: string[];
};

const PLAY_LIBRARY: Record<number, PlayCard[]> = {
  1: [
    {
      id: 'hidden-picture-kor',
      title: '숨은그림찾기',
      subtitle: '자음, 낱말, 숫자를 그림 속에서 찾아봐요.',
      badge: '국어 · 수학 · 통합',
      icon: 'search-outline',
      color: '#E8F8F2',
      accent: '#2CBF8C',
      subjects: ['자음 찾기', '숫자 찾기', '그림 낱말'],
    },
    {
      id: 'sound-match',
      title: '소리 짝꿍 찾기',
      subtitle: '비슷한 글자와 소리를 빠르게 연결해요.',
      badge: '국어 놀이',
      icon: 'musical-notes-outline',
      color: '#FFF4DE',
      accent: '#F5A623',
      subjects: ['ㄱ/ㅋ', 'ㅂ/ㅍ', '모음 찾기'],
    },
    {
      id: 'number-step',
      title: '숫자 발자국',
      subtitle: '순서대로 숫자를 밟으며 길을 완성해요.',
      badge: '수학 놀이',
      icon: 'footsteps-outline',
      color: '#EEF3FF',
      accent: '#6C8CFF',
      subjects: ['1~20 수', '순서', '비교'],
    },
  ],
  2: [
    {
      id: 'hidden-picture-grade2',
      title: '숨은그림찾기',
      subtitle: '낱말, 수, 생활 그림을 찾아보는 집중 놀이예요.',
      badge: '국어 · 수학 · 통합',
      icon: 'search-outline',
      color: '#E8F8F2',
      accent: '#2CBF8C',
      subjects: ['받침 낱말', '두 자리 수', '생활 그림'],
    },
    {
      id: 'word-hunt',
      title: '낱말 탐험',
      subtitle: '그림 힌트를 보고 알맞은 단어를 골라요.',
      badge: '국어 놀이',
      icon: 'book-outline',
      color: '#FFF0F5',
      accent: '#EF7DAF',
      subjects: ['문장 낱말', '상황말', '받침 단어'],
    },
    {
      id: 'number-maze',
      title: '수학 미로',
      subtitle: '계산 결과를 따라가며 미로를 탈출해요.',
      badge: '수학 놀이',
      icon: 'grid-outline',
      color: '#EEF3FF',
      accent: '#6C8CFF',
      subjects: ['덧셈', '뺄셈', '규칙 찾기'],
    },
  ],
};

export default function PlayScreen() {
  const router = useRouter();
  const [childGrade, setChildGrade] = useState(1);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadGrade = async () => {
        try {
          const storedGrade = await AsyncStorage.getItem('childGrade');
          if (isMounted) {
            setChildGrade(Number(storedGrade) || 1);
          }
        } catch (error) {
          console.log('play screen grade load error:', error);
        }
      };

      loadGrade();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const cards = useMemo(() => {
    if (childGrade <= 1) return PLAY_LIBRARY[1];
    if (childGrade === 2) return PLAY_LIBRARY[2];
    return [];
  }, [childGrade]);

  const handleStart = (cardId: string, title: string) => {
    if (cardId === 'hidden-picture-kor' || cardId === 'hidden-picture-grade2') {
      router.push('/play/hidden-picture');
      return;
    }

    Alert.alert('준비 중이에요', `${title}는 학습놀이 탭에 맞춰 곧 연결할게요.`);
  };

  if (childGrade > 2) {
    return (
      <SafeLayout backgroundColor="#FFFDF7">
        <View style={styles.lockWrap}>
          <View style={styles.lockIcon}>
            <Ionicons name="sparkles-outline" size={28} color="#2CBF8C" />
          </View>
          <Text style={styles.lockTitle}>학습놀이는 1~2학년 맞춤 탭이에요</Text>
          <Text style={styles.lockDesc}>
            지금은 저학년 친구들을 위한 숨은그림찾기와 기초 학습놀이를 준비하고 있어요.
          </Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout backgroundColor="#FFFDF7">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Text style={styles.title}>학습놀이</Text>
        <Text style={styles.subtitle}>
          {childGrade}학년 눈높이에 맞춘 짧고 즐거운 놀이로 자음, 낱말, 숫자를 익혀요.
        </Text>

        <View style={styles.heroCard}>
          <View style={styles.heroTextWrap}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>오늘 추천</Text>
            </View>
            <Text style={styles.heroTitle}>숨은그림찾기</Text>
            <Text style={styles.heroDesc}>
              그림 안에 숨어 있는 글자와 숫자를 찾으며 집중력과 관찰력을 함께 키워요.
            </Text>
            <TouchableOpacity style={styles.heroButton} onPress={() => handleStart('hidden-picture-kor', '숨은그림찾기')}>
              <Text style={styles.heroButtonText}>놀이 시작하기</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroIllustration}>
            <View style={[styles.heroBubble, { backgroundColor: '#E8F8F2' }]}>
              <Ionicons name="search-outline" size={24} color="#2CBF8C" />
            </View>
            <View style={[styles.heroBubble, { backgroundColor: '#FFF4DE' }]}>
              <Ionicons name="text-outline" size={24} color="#F5A623" />
            </View>
            <View style={[styles.heroBubble, { backgroundColor: '#EEF3FF' }]}>
              <Ionicons name="calculator-outline" size={24} color="#6C8CFF" />
            </View>
          </View>
        </View>

        {cards.map((card) => (
          <View key={card.id} style={[styles.playCard, { backgroundColor: card.color }]}>
            <View style={styles.playCardTop}>
              <View style={[styles.playIconBox, { backgroundColor: `${card.accent}20` }]}>
                <Ionicons name={card.icon} size={22} color={card.accent} />
              </View>
              <View style={styles.playTextWrap}>
                <Text style={styles.playTitle}>{card.title}</Text>
                <Text style={styles.playSubtitle}>{card.subtitle}</Text>
              </View>
            </View>

            <View style={styles.chipRow}>
              {card.subjects.map((subject) => (
                <View key={subject} style={styles.chip}>
                  <Text style={styles.chipText}>{subject}</Text>
                </View>
              ))}
            </View>

            <View style={styles.playFooter}>
              <Text style={[styles.badgeText, { color: card.accent }]}>{card.badge}</Text>
              <TouchableOpacity
                style={[styles.cardButton, { backgroundColor: card.accent }]}
                onPress={() => handleStart(card.id, card.title)}
              >
                <Text style={styles.cardButtonText}>열어보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#23324A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5F6F7C',
    marginBottom: 18,
  },
  heroCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 18,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E8F1EE',
    shadowColor: '#173B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  heroTextWrap: {
    flex: 1,
    paddingRight: 14,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F8F2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1DA884',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#22324A',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5F6F7C',
    marginBottom: 16,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1DA884',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  heroIllustration: {
    width: 104,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  heroBubble: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF2F0',
  },
  playCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  playIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playTextWrap: {
    flex: 1,
  },
  playTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#23324A',
    marginBottom: 4,
  },
  playSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#637381',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  chip: {
    backgroundColor: '#FFFFFFCC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#50606D',
  },
  playFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardButton: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  lockWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#E8F8F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#23324A',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: '#637381',
    textAlign: 'center',
  },
});
