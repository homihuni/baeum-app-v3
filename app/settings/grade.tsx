import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import BottomTabBar from '../../components/BottomTabBar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { resolveAvatar } from '../../utils/avatars';

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  free: { label: '무료', color: '#9E9E9E', bgColor: '#F5F5F5' },
  baeum: { label: '배움회원', color: '#7ED4C0', bgColor: '#E8F8F5' },
  sky: { label: '스카이', color: '#87CEEB', bgColor: '#E8F4FD' },
};

export default function LearningPlanScreen() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [childAvatar, setChildAvatar] = useState('🍎');
  const [childGrade, setChildGrade] = useState(1);
  const [childTier, setChildTier] = useState('free');
  const [serialNumber, setSerialNumber] = useState('');
  const [serialExpiry, setSerialExpiry] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      if (parentId && childId) {
        const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
        if (childDoc.exists()) {
          const data = childDoc.data();
          setChildName(data.name || '학생');
          setChildAvatar(data.avatar || '🍎');
          setChildGrade(data.grade || 1);
          setChildTier(data.tier || 'free');
          setSerialNumber(data.serialCode || '');
          setSerialExpiry(data.serialExpiry || '');
        }
      }
    } catch (error) {
      console.log('학습플랜 데이터 로드 에러:', error);
    }
  };

  const tierConfig = TIER_CONFIG[childTier] || TIER_CONFIG.free;
  const isLowGrade = childGrade <= 2;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* 현재 자녀 플랜 카드 */}
        <View style={[styles.currentCard, { borderColor: tierConfig.color }]}>
          <View style={styles.currentCardTop}>
            <Image source={resolveAvatar(childAvatar)} style={{ width: 48, height: 48, borderRadius: 24 }} />
            <View style={styles.currentInfo}>
              <Text style={styles.currentName}>{childName}</Text>
              <Text style={styles.currentGrade}>{childGrade}학년</Text>
            </View>
            <View style={[styles.currentBadge, { backgroundColor: tierConfig.color }]}>
              <Text style={styles.currentBadgeText}>{tierConfig.label}</Text>
            </View>
          </View>
          {childTier === 'baeum' && serialNumber ? (
            <View style={styles.currentDetail}>
              <Text style={styles.currentDetailText}>시리얼: {serialNumber} · 만료: {(() => {
                if (!serialExpiry) return '정보 없음';
                if (serialExpiry?.seconds) return new Date(serialExpiry.seconds * 1000).toLocaleDateString('ko-KR');
                const date = new Date(serialExpiry);
                return isNaN(date.getTime()) ? '정보 없음' : date.toLocaleDateString('ko-KR');
              })()}</Text>
            </View>
          ) : childTier === 'sky' ? (
            <View style={styles.currentDetail}>
              <Text style={styles.currentDetailText}>스카이 플랜 이용 중</Text>
            </View>
          ) : (
            <View style={styles.currentDetail}>
              <Text style={styles.currentDetailText}>무료 플랜 이용 중</Text>
            </View>
          )}
        </View>

        {/* 플랜 비교 섹션 제목 */}
        <Text style={styles.sectionTitle}>플랜 비교</Text>
        <Text style={styles.sectionSubtitle}>우리 아이에게 맞는 플랜을 선택하세요</Text>

        {/* 무료 플랜 카드 */}
        <View style={[styles.planCard, childTier === 'free' && styles.planCardActive, childTier === 'free' && { borderColor: '#9E9E9E' }]}>
          {childTier === 'free' && (
            <View style={[styles.planCurrentTag, { backgroundColor: '#9E9E9E' }]}>
              <Text style={styles.planCurrentTagText}>현재 플랜</Text>
            </View>
          )}
          <View style={styles.planHeader}>
            <Text style={styles.planName}>무료회원</Text>
          </View>
          <View style={styles.planFeatures}>
            <Text style={styles.featureItem}>• 과목: {isLowGrade ? '3과목 중 1과목' : '5과목 중 1과목'}</Text>
            <Text style={styles.featureItem}>• 과목당 3문제</Text>
            <Text style={styles.featureItem}>• 기본 학습 리포트</Text>
          </View>
        </View>

        {/* 배움 플랜 카드 */}
        <View style={[styles.planCard, childTier === 'baeum' && styles.planCardActive, childTier === 'baeum' && { borderColor: '#7ED4C0' }]}>
          {childTier === 'baeum' && (
            <View style={[styles.planCurrentTag, { backgroundColor: '#7ED4C0' }]}>
              <Text style={styles.planCurrentTagText}>현재 플랜</Text>
            </View>
          )}
          <View style={styles.planHeader}>
            <Text style={[styles.planName, { color: '#7ED4C0' }]}>배움회원</Text>
            <Text style={styles.planPrice}>배움달력 구매</Text>
          </View>
          <View style={styles.planFeatures}>
            <Text style={styles.featureItem}>• 과목: {isLowGrade ? '전과목 (3과목)' : '5과목 중 3과목'}</Text>
            <Text style={styles.featureItem}>• 과목당 5문제</Text>
            <Text style={styles.featureItem}>• 학습 분석 리포트</Text>
            <Text style={styles.featureItem}>• AI 학습 어드바이저</Text>
          </View>
          <Text style={styles.planNote}>배움달력 뒷면의 시리얼번호로 등록</Text>
          {childTier === 'free' && (
            <TouchableOpacity
              style={[styles.planButton, { backgroundColor: '#7ED4C0' }]}
              onPress={() => router.push('/serial/enter')}
            >
              <Text style={styles.planButtonText}>시리얼번호 등록</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 스카이 플랜 카드 — 강조 */}
        <View style={[styles.planCard, styles.skyCard, childTier === 'sky' && styles.planCardActive, { borderColor: '#87CEEB' }]}>
          <View style={styles.skyRecommend}>
            <Text style={styles.skyRecommendText}>추천</Text>
          </View>
          {childTier === 'sky' && (
            <View style={[styles.planCurrentTag, { backgroundColor: '#87CEEB', top: 12, right: 60 }]}>
              <Text style={styles.planCurrentTagText}>현재 플랜</Text>
            </View>
          )}
          <View style={styles.planHeader}>
            <Text style={[styles.planName, { color: '#87CEEB' }]}>스카이회원</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.planPrice, { color: '#87CEEB', fontSize: 22, fontWeight: 'bold' }]}>월 1,900원</Text>
            </View>
          </View>
          <View style={styles.planFeatures}>
            <Text style={[styles.featureItem, styles.featureHighlight]}>• 전과목 학습</Text>
            <Text style={[styles.featureItem, styles.featureHighlight]}>• 과목당 10문제 + 추가 문제 5문제</Text>
            <Text style={[styles.featureItem, styles.featureHighlight]}>• 정밀 학습 분석 리포트</Text>
            <Text style={[styles.featureItem, styles.featureHighlight]}>• AI 학습 어드바이저 PRO</Text>
          </View>
          <Text style={styles.skyBenefit}>아이의 성장을 위한 최적의 학습 환경</Text>
          {childTier !== 'sky' && (
            <TouchableOpacity
              style={[styles.planButton, styles.skyButton]}
              onPress={() => router.push('/settings/subscribe')}
            >
              <Text style={styles.planButtonText}>스카이 시작하기</Text>
            </TouchableOpacity>
          )}
          {childTier === 'sky' && (
            <View style={styles.skyActiveContainer}>
              <Text style={styles.skyActiveText}>최고 플랜을 이용 중입니다</Text>
            </View>
          )}
        </View>

        {/* 하단 안내 */}
        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>• 구독은 언제든 해지할 수 있습니다</Text>
          <Text style={styles.bottomNoteText}>• 배움 시리얼은 매년 12/31에 만료됩니다</Text>
          <Text style={styles.bottomNoteText}>• 자녀 추가 시 1명당 1,900원이 추가됩니다</Text>
        </View>

      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // 현재 플랜 카드
  currentCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 2, marginBottom: 24 },
  currentCardTop: { flexDirection: 'row', alignItems: 'center' },
  currentInfo: { flex: 1, marginLeft: 12 },
  currentName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  currentGrade: { fontSize: 14, color: '#666', marginTop: 2 },
  currentBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  currentBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' },
  currentDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  currentDetailText: { fontSize: 13, color: '#666' },

  // 섹션 제목
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#999', marginBottom: 16 },

  // 플랜 카드 공통
  planCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0', position: 'relative' },
  planCardActive: { borderWidth: 2 },
  planCurrentTag: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  planCurrentTagText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' },
  planHeader: { marginBottom: 12 },
  planName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  planPrice: { fontSize: 16, color: '#666' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  planFeatures: { marginBottom: 12 },
  featureItem: { fontSize: 14, color: '#333', lineHeight: 26 },
  featureDisabled: { color: '#CCCCCC' },
  featureHighlight: { color: '#333', fontWeight: '500' },
  planNote: { fontSize: 12, color: '#999', marginBottom: 12 },
  planButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  planButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },

  // 스카이 특별 스타일
  skyCard: { borderWidth: 2, borderColor: '#87CEEB', backgroundColor: '#FAFEFF' },
  skyRecommend: { position: 'absolute', top: -12, left: 20, backgroundColor: '#FF6B6B', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, zIndex: 1 },
  skyRecommendText: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
  skyButton: { backgroundColor: '#87CEEB' },
  skyBenefit: { fontSize: 13, color: '#87CEEB', fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  skyActiveContainer: { alignItems: 'center', paddingVertical: 12 },
  skyActiveText: { fontSize: 14, color: '#87CEEB', fontWeight: '600' },

  // 하단 안내
  bottomNote: { marginTop: 8, padding: 16 },
  bottomNoteText: { fontSize: 12, color: '#999', lineHeight: 22 },
});
