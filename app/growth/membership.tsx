import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function MembershipScreen() {
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('free');

  useEffect(() => {
    console.log('=== 회원 등급 안내 진입 ===');
    loadTier();
  }, []);

  const loadTier = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      if (!parentId || !childId) {
        setLoading(false);
        return;
      }

      const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
      if (childDoc.exists()) {
        const childData = childDoc.data();
        const childTier = childData.tier || 'free';
        setTier(childTier);
        console.log('=== 회원 등급 안내 tier:', childTier);
      }

      setLoading(false);
    } catch (error) {
      console.error('회원 등급 안내 데이터 로드 오류:', error);
      setLoading(false);
    }
  };

  const renderCTA = () => {
    if (tier === 'free') {
      return (
        <>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/serial/enter')}
          >
            <Text style={styles.ctaButtonText}>시리얼번호 입력하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaButtonSecondary}
            onPress={() => console.log('스카이 구독 클릭')}
          >
            <Text style={styles.ctaButtonSecondaryText}>스카이 구독하기</Text>
          </TouchableOpacity>
        </>
      );
    } else if (tier === 'baeum') {
      return (
        <>
          <Text style={styles.currentTierBaeum}>현재 배움회원이에요 ✅</Text>
          <TouchableOpacity
            style={styles.ctaButtonSky}
            onPress={() => console.log('스카이 업그레이드 클릭')}
          >
            <Text style={styles.ctaButtonText}>스카이로 업그레이드</Text>
          </TouchableOpacity>
        </>
      );
    } else if (tier === 'sky') {
      return (
        <>
          <Text style={styles.currentTierSky}>현재 스카이회원이에요 🚀</Text>
          <Text style={styles.allFeaturesText}>모든 프리미엄 기능을 이용 중이에요!</Text>
        </>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>회원 등급 안내</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>회원 등급 안내</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hookingSection}>
          <Text style={styles.hookingEmoji}>🌱</Text>
          <Text style={styles.hookingMain}>우리 아이 학습, 얼마나 알고 계세요?</Text>
          <Text style={styles.hookingSub}>
            AI가 분석하는 맞춤 학습 리포트로{'\n'}아이의 숨겨진 가능성을 발견하세요
          </Text>
        </View>

        {/* 무료회원 카드 */}
        <View style={styles.cardFree}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitleFree}>무료회원</Text>
            <Text style={styles.cardBadgeFree}>FREE</Text>
          </View>
          <Text style={styles.cardPriceFree}>₩0</Text>
          <View style={styles.dividerFree} />
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>전 과목 중 1과목 선택</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>과목당 3문제</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>기본 AI 코멘트</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="close-circle" size={18} color="#CCC" />
              <Text style={styles.benefitTextDisabled}>상세 리포트</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="close-circle" size={18} color="#CCC" />
              <Text style={styles.benefitTextDisabled}>AI 맞춤 학습 분석</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="close-circle" size={18} color="#CCC" />
              <Text style={styles.benefitTextDisabled}>AI 맞춤 학습 팁</Text>
            </View>
          </View>
        </View>

        {/* 배움회원 카드 */}
        <View style={styles.cardBaeumWrapper}>
          <View style={styles.recommendBadge}>
            <Text style={styles.recommendBadgeText}>추천</Text>
          </View>
          <View style={styles.cardBaeum}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitleBaeum}>배움회원</Text>
              <Text style={styles.cardBadgeBaeum}>BAEUM</Text>
            </View>
            <Text style={styles.cardPriceBaeum}>배움달력 구매 시 포함</Text>
            <View style={styles.dividerBaeum} />
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>1~2학년: 전 과목 학습</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>3~6학년: 5과목 중 3과목 선택</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>과목당 5문제</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>AI 맞춤 학습 분석</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>상세 리포트 열람</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="close-circle" size={18} color="#CCC" />
                <Text style={styles.benefitTextDisabled}>AI 맞춤 학습 팁</Text>
              </View>
            </View>
            <Text style={styles.hookingTextBaeum}>
              📅 배움달력과 함께 시작하면{'\n'}우리 아이 학습 습관이 달라져요!
            </Text>
          </View>
        </View>

        {/* 스카이회원 카드 */}
        <View style={styles.cardSky}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitleSky}>스카이회원</Text>
            <Text style={styles.cardBadgeSky}>SKY</Text>
          </View>
          <Text style={styles.cardPriceSky}>월 구독</Text>
          <View style={styles.dividerSky} />
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#1976D2" />
              <Text style={styles.benefitText}>전 학년 전 과목 학습</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#1976D2" />
              <Text style={styles.benefitText}>과목당 10문제</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#1976D2" />
              <Text style={styles.benefitText}>AI 맞춤 학습 분석</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#1976D2" />
              <Text style={styles.benefitText}>상세 리포트 열람</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#1976D2" />
              <Text style={styles.benefitText}>AI 맞춤 학습 팁</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#1976D2" />
              <Text style={styles.benefitText}>우선 고객 지원</Text>
            </View>
          </View>
          <Text style={styles.hookingTextSky}>
            🚀 AI가 우리 아이만을 위한{'\n'}학습 전략을 설계해드려요!
          </Text>
        </View>

        {renderCTA()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 30 },

  hookingSection: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    margin: 16,
    padding: 24,
    alignItems: 'center',
  },
  hookingEmoji: { fontSize: 40, marginBottom: 8 },
  hookingMain: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  hookingSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },

  cardFree: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardBaeumWrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 12,
  },
  recommendBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  recommendBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardBaeum: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  cardSky: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1976D2',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleFree: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
  },
  cardBadgeFree: {
    fontSize: 12,
    color: '#AAA',
    marginLeft: 8,
  },
  cardPriceFree: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  dividerFree: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },

  cardTitleBaeum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  cardBadgeBaeum: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 8,
  },
  cardPriceBaeum: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  dividerBaeum: {
    height: 1,
    backgroundColor: '#E8F5E9',
    marginVertical: 12,
  },
  hookingTextBaeum: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },

  cardTitleSky: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  cardBadgeSky: {
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 8,
  },
  cardPriceSky: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    marginTop: 4,
  },
  dividerSky: {
    height: 1,
    backgroundColor: '#E3F2FD',
    marginVertical: 12,
  },
  hookingTextSky: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },

  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  benefitTextDisabled: {
    fontSize: 14,
    color: '#CCC',
    marginLeft: 8,
  },

  ctaButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ctaButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1976D2',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  ctaButtonSecondaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  ctaButtonSky: {
    backgroundColor: '#1976D2',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  currentTierBaeum: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  currentTierSky: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  allFeaturesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
});
