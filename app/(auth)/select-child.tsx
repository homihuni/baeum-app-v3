import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import { useRouter } from 'expo-router';
import { getChildren } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveAvatar } from '../../utils/avatars';
import { wp, SCREEN_WIDTH } from '../../utils/responsive';

const TIER_LABELS: Record<string, string> = { free: '무료회원', baeum: '배움회원', sky: '스카이회원' };
const TIER_COLORS: Record<string, string> = { free: '#E0E0E0', baeum: '#4ECDC4', sky: '#87CEEB' };
const TIER_TEXT_COLORS: Record<string, string> = { free: '#666666', baeum: '#FFFFFF', sky: '#333333' };

// 자녀 카드 폭: 화면 폭 기준 2열 계산, 최대 200px (태블릿 대응)
// - 375px 폰: (375 - 38 - 16) / 2 = 160px
// - 768px 태블릿: min((768 - 76 - 16) / 2, 200) = 200px
const CHILD_CARD_WIDTH = Math.min(
  Math.round((SCREEN_WIDTH - 2 * wp(5) - 16) / 2),
  200
);

// 아바타 크기: 화면 폭 16% 기준, 최대 80px
// - 375px: 60px (기존과 동일), 768px: 80px (태블릿에서 확대)
const CHILD_AVATAR_SIZE = Math.min(wp(16), 80);

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
      <Image source={resolveAvatar(child.avatar)} style={styles.avatar} />
      <Text style={styles.childName}>{child.name}</Text>
      {(child.isLocked || child.tier === 'expired') && (
        <View style={styles.expiredBadge}>
          <Text style={styles.expiredText}>만료 — 시리얼 등록 필요</Text>
        </View>
      )}
      <Text style={styles.childGrade}>{child.grade}학년</Text>
      <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[child.tier] || '#E0E0E0' }]}>
        <Text style={[styles.tierText, { color: TIER_TEXT_COLORS[child.tier] || '#666666' }]}>
          {TIER_LABELS[child.tier] || '무료회원'}
        </Text>
      </View>
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
          <Text style={styles.title}>누가 공부할까요?</Text>
          <Text style={styles.subtitle}>학습할 자녀를 선택하세요</Text>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#7ED4C0',
    marginTop: 8,
    textAlign: 'center',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  // 자녀 카드 — width: CHILD_CARD_WIDTH (화면 비율 기반 반응형)
  // 375px 폰: 160px / 768px 태블릿: 200px
  childCard: {
    width: CHILD_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childCardLocked: {
    opacity: 0.5,
    backgroundColor: '#E0E0E0',
  },
  // 아바타 — CHILD_AVATAR_SIZE 반응형 (375px: 60px, 태블릿: 80px)
  avatar: {
    width: CHILD_AVATAR_SIZE,
    height: CHILD_AVATAR_SIZE,
    borderRadius: CHILD_AVATAR_SIZE / 2,
    marginBottom: 10,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  childGrade: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  tierBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tierText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  expiredBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  expiredText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
