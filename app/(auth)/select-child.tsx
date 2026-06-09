import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import { useRouter } from 'expo-router';
import { getChildren } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveAvatar } from '../../utils/avatars';
import { wp, SCREEN_WIDTH } from '../../utils/responsive';

const TIER_LABELS: Record<string, string> = { free: '무료회원', baeum: '배움회원', sky: '스카이회원', expired: '만료' };
const TIER_COLORS: Record<string, string> = { free: '#E0E0E0', baeum: '#F8A9C4', sky: '#9CDCF3', expired: '#E0E0E0' };
const TIER_TEXT_COLORS: Record<string, string> = { free: '#666666', baeum: '#B93F6F', sky: '#247EA3', expired: '#888888' };
const TIER_BORDER_COLORS: Record<string, string> = { free: '#E5E5E5', baeum: '#FAD3E0', sky: '#C8ECFA', expired: '#D9D9D9' };
const DAILY_GREETINGS = [
  '오늘은 어떤 친구로 배움을 시작할까요?',
  '오늘의 배움 주인공을 골라주세요.',
  '반짝이는 하루, 누구와 함께할까요?',
  '오늘 배움 모험을 시작할 친구는 누구일까요?',
  '즐거운 공부 시간이 기다리고 있어요.',
  '오늘의 작은 도전을 함께 시작해볼까요?',
  '배움 별을 모을 친구를 선택해주세요.',
  '오늘도 차근차근 멋지게 배워봐요.',
  '새로운 문제를 만날 준비가 됐나요?',
  '오늘은 어떤 마음으로 배워볼까요?',
  '공부 여행을 떠날 친구를 골라주세요.',
  '오늘의 성장 버튼을 눌러볼 시간이에요.',
  '작은 집중이 큰 자신감이 되는 날이에요.',
  '오늘 배움 스탬프를 찍을 친구는 누구일까요?',
  '기분 좋은 시작을 함께 만들어봐요.',
  '오늘도 한 문제씩 귀엽게 정복해봐요.',
  '배움 에너지를 채울 친구를 선택해주세요.',
  '오늘의 똑똑한 순간을 시작해볼까요?',
  '궁금한 마음으로 살짝 들어가볼까요?',
  '오늘은 어떤 과목이 반겨줄까요?',
  '멋진 기록을 남길 친구를 골라주세요.',
  '오늘의 배움 문을 열어볼까요?',
  '천천히 해도 좋아요. 시작해볼까요?',
  '오늘도 나만의 속도로 자라볼까요?',
  '새로운 배움 씨앗을 심어볼 시간이에요.',
  '오늘의 반짝 포인트를 모아볼까요?',
  '공부가 조금 더 재밌어지는 순간이에요.',
  '오늘은 어떤 친구가 빛날 차례일까요?',
  '배움 준비 완료, 친구를 선택해주세요.',
  '오늘도 제철처럼 싱그럽게 시작해봐요.',
];

// 자녀 카드 폭: 화면 폭 기준 2열 계산, 최대 200px (태블릿 대응)
// - 375px 폰: (375 - 38 - 16) / 2 = 160px
// - 768px 태블릿: min((768 - 76 - 16) / 2, 200) = 200px
const CHILD_CARD_WIDTH = Math.min(
  Math.round((SCREEN_WIDTH - 2 * wp(5) - 16) / 2),
  220
);

// 아바타 크기: 화면 폭 16% 기준, 최대 80px
// - 375px: 60px (기존과 동일), 768px: 80px (태블릿에서 확대)
const CHILD_AVATAR_SIZE = Math.min(wp(29), 132);

const getDailyGreeting = () => {
  const now = new Date();
  const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
  const kstDate = new Date(kstTime);
  const seed = kstDate.getUTCFullYear() + kstDate.getUTCMonth() + kstDate.getUTCDate();
  return DAILY_GREETINGS[seed % DAILY_GREETINGS.length];
};

export default function SelectChildScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) {
        router.replace('/(auth)/login');
        return;
      }
      const kids = await getChildren(parentId);
      setChildren(kids);
    } catch (error: any) {
      Alert.alert('오류', '자녀 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const selectChild = async (child: any) => {
    if (child.isLocked || child.tier === 'expired') {
      await AsyncStorage.setItem('childId', child.id);
      await AsyncStorage.setItem('childName', child.name);
      router.push('/children/manage');
      return;
    }
    await AsyncStorage.setItem('childId', child.id);
    await AsyncStorage.setItem('childName', child.name);
    await AsyncStorage.setItem('childGrade', String(child.grade));
    await AsyncStorage.setItem('childTier', child.tier);
    router.replace('/(tabs)/home');
  };

  if (loading) {
    return (
      <SafeLayout backgroundColor="#F5F5F5">
        <ActivityIndicator size="large" color="#7ED4C0" style={{ marginTop: 100 }} />
      </SafeLayout>
    );
  }

  const activeChildren = children.filter((c: any) => !c.isDeleted);

  const renderChildCard = (child: any) => (
    <TouchableOpacity
      key={child.id}
      style={[
        styles.childCard,
        (child.isLocked || child.tier === 'expired') && styles.childCardLocked,
      ]}
      onPress={() => selectChild(child)}
    >
      <View style={[styles.avatarWrap, { borderColor: TIER_BORDER_COLORS[child.tier] || '#E5E5E5' }]}>
        <Image source={resolveAvatar(child.avatar)} style={styles.avatar} />
      </View>
      <Text style={styles.childName}>{child.name}</Text>
      <View style={styles.childMetaRow}>
        <Text style={styles.childGrade}>{child.grade}학년</Text>
        <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[child.tier] || '#E0E0E0' }]}>
          <Text style={[styles.tierText, { color: TIER_TEXT_COLORS[child.tier] || '#666666' }]}>
            {TIER_LABELS[child.tier] || '무료회원'}
          </Text>
        </View>
      </View>
      {(child.isLocked || child.tier === 'expired') && (
        <View style={styles.expiredBadge}>
          <Text style={styles.expiredText}>시리얼 등록 필요</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeLayout backgroundColor="#F5F5F5">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 타이틀 - 중앙 정렬 */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>안녕하세요!</Text>
          <Text style={styles.subtitle}>{getDailyGreeting()}</Text>
        </View>

        {/* 카드 그리드 - 2열 반응형 */}
        <View style={styles.cardGrid}>
          {activeChildren.map((child) => renderChildCard(child))}
        </View>
      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  // 스크롤 패딩 — paddingHorizontal: wp(5) 반응형
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: wp(5),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 34,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#123C2B',
    textAlign: 'center',
    textShadowColor: '#BFE8D4',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5BBFAA',
    marginTop: 10,
    textAlign: 'center',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  // 자녀 카드 — width: CHILD_CARD_WIDTH (화면 비율 기반 반응형)
  // 375px 폰: 160px / 768px 태블릿: 200px
  childCard: {
    width: CHILD_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1E8DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  childCardLocked: {
    opacity: 0.72,
    backgroundColor: '#F4F4F4',
  },
  // 아바타 — CHILD_AVATAR_SIZE 반응형 (375px: 60px, 태블릿: 80px)
  avatarWrap: {
    width: CHILD_AVATAR_SIZE,
    height: CHILD_AVATAR_SIZE,
    borderRadius: CHILD_AVATAR_SIZE / 2,
    marginBottom: 14,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: CHILD_AVATAR_SIZE - 10,
    height: CHILD_AVATAR_SIZE - 10,
    borderRadius: (CHILD_AVATAR_SIZE - 10) / 2,
  },
  childName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#20352E',
    textAlign: 'center',
  },
  childMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  childGrade: {
    fontSize: 13,
    fontWeight: '800',
    color: '#388A69',
    backgroundColor: '#F3FAF6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tierText: {
    fontSize: 13,
    fontWeight: '900',
  },
  expiredBadge: {
    backgroundColor: '#FFE6E6',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
  },
  expiredText: {
    color: '#D65C5C',
    fontSize: 11,
    fontWeight: '900',
  },
});
