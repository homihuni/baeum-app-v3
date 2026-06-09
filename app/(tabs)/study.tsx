import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ImageSourcePropType, ActivityIndicator } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { resolveAvatar } from '../../utils/avatars';
import { SUBJECT_ICONS, SUBJECT_LABELS } from '../../utils/subjects';
import { Ionicons } from '@expo/vector-icons';
import { wp } from '../../utils/responsive';

const TIER_LABELS: Record<string, string> = { free: '무료회원', baeum: '배움회원', sky: '스카이회원' };
type SubjectKey = keyof typeof SUBJECT_ICONS;

const SUBJECT_CARD_COLORS: Record<SubjectKey, string> = {
  korean: '#BDEFD2',
  math: '#E2CDFB',
  integrated: '#BFE3FF',
  english: '#FFD8E6',
  science: '#CDEFEA',
  social: '#FFE3B8',
};

const SUBJECT_BUTTON_COLORS: Record<SubjectKey, string> = {
  korean: '#63CFA0',
  math: '#B78AF2',
  integrated: '#73BFF1',
  english: '#F497B9',
  science: '#75CFC3',
  social: '#F2B766',
};

const getSubjectsForGrade = (grade: number): SubjectKey[] => {
  if (grade <= 3) return ['korean', 'math', 'integrated'];
  return ['korean', 'math', 'science', 'social', 'english'];
};

const getQuestionsPerSubject = (tier: string) => {
  if (tier === 'sky') return 10;
  if (tier === 'baeum') return 5;
  return 3;
};

export default function StudyScreen() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [childAvatar, setChildAvatar] = useState<ImageSourcePropType>(require('../../assets/images/avatar_01.png'));
  const [childGrade, setChildGrade] = useState(1);
  const [childTier, setChildTier] = useState('free');
  const [subjects, setSubjects] = useState<SubjectKey[]>([]);
  const [questionsPerSubject, setQuestionsPerSubject] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      const grade = await AsyncStorage.getItem('childGrade');
      const tier = await AsyncStorage.getItem('childTier');

      const g = grade ? parseInt(grade, 10) : 1;
      const t = tier || 'free';

      setChildGrade(g);
      setChildTier(t);
      setSubjects(getSubjectsForGrade(g));
      setQuestionsPerSubject(getQuestionsPerSubject(t));

      if (!parentId || !childId) {
        setError('자녀 정보를 불러올 수 없습니다. 다시 선택해주세요.');
        return;
      }

      const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
      if (!childDoc.exists()) {
        setError('자녀 정보를 찾을 수 없습니다. 다시 선택해주세요.');
        return;
      }

      const data = childDoc.data();
      setChildAvatar(resolveAvatar(data.avatar));
      setChildName(data.name || '학생');

      if (data.isLocked === true || data.tier === 'expired') {
        setIsLocked(true);
        return;
      } else {
        setIsLocked(false);
      }

      if (data.tier) {
        setChildTier(data.tier);
        setQuestionsPerSubject(getQuestionsPerSubject(data.tier));
        await AsyncStorage.setItem('childTier', data.tier || 'free');
        await AsyncStorage.setItem('childGrade', String(data.grade || 1));
      }
    } catch (loadError) {
      console.log('Study data load error:', loadError);
      setError('학습 정보를 불러올 수 없습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeLayout showHeader headerTitle="학습플랜">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7ED4C0" />
        </View>
      </SafeLayout>
    );
  }

  if (error) {
    return (
      <SafeLayout showHeader headerTitle="학습플랜">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeLayout>
    );
  }

  if (isLocked) {
    return (
      <SafeLayout showHeader headerTitle="학습플랜">
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={56} color="#9E9E9E" style={styles.lockedIcon} />
          <Text style={styles.lockedTitle}>학습이 제한된 계정입니다.</Text>
          <Text style={styles.lockedSubtitle}>시리얼 번호를 등록하거나{'\n'}자녀관리에서 상태를 확인해주세요.</Text>
          <TouchableOpacity
            style={styles.lockedButton}
            onPress={() => router.push('/serial/enter')}
          >
            <Text style={styles.lockedButtonText}>시리얼 등록</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.lockedSecondaryButton}
            onPress={() => router.push('/children/manage')}
          >
            <Text style={styles.lockedSecondaryButtonText}>자녀관리로 이동</Text>
          </TouchableOpacity>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout backgroundColor="#FFFDF7">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.planHeader}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.replace('/(tabs)/home')}>
            <Ionicons name="chevron-back" size={28} color="#147B60" />
          </TouchableOpacity>
          <View style={styles.planTitleBox}>
            <Text style={styles.planTitle}>학습플랜</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileBadgeColumn}>
              <Image source={childAvatar} style={styles.profileAvatar} />
              <Text style={styles.profileName}>{childName || '학생'}</Text>
              <View style={styles.profileMiniRow}>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>{childGrade}학년</Text>
                </View>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>{TIER_LABELS[childTier] || '무료회원'}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.profileSceneWrap}>
            <Image source={require('../../assets/images/study_plan_children.png')} style={styles.profileScene} resizeMode="contain" />
          </View>
        </View>

        {subjects.map((subjectKey) => (
          <TouchableOpacity
            key={subjectKey}
            activeOpacity={0.72}
            style={[styles.subjectCard, { borderColor: SUBJECT_CARD_COLORS[subjectKey] }]}
            onPress={() => router.push({
              pathname: '/study/questions',
              params: { subject: subjectKey, grade: String(childGrade), tier: childTier }
            })}
          >
            <View style={styles.subjectLeft}>
              <View style={styles.subjectIconWrap}>
                <Image source={SUBJECT_ICONS[subjectKey]} style={styles.subjectIcon} />
              </View>
              <View style={styles.subjectTextBox}>
                <Text style={styles.subjectName}>{SUBJECT_LABELS[subjectKey]}</Text>
                <Text style={styles.subjectRemaining}>총 {questionsPerSubject}문제</Text>
              </View>
            </View>
            <View style={[styles.subjectArrowCircle, { backgroundColor: SUBJECT_BUTTON_COLORS[subjectKey] }]}>
              <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingBottom: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: '#7ED4C0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  lockedIcon: {
    marginBottom: 20,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  lockedSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  lockedButton: {
    backgroundColor: '#7ED4C0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minWidth: 180,
    alignItems: 'center',
  },
  lockedButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lockedSecondaryButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7ED4C0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 180,
    alignItems: 'center',
  },
  lockedSecondaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#7ED4C0',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
  },
  backCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  planTitleBox: {
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#123C2B',
    textShadowColor: '#BFE8D4',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  headerSpacer: {
    width: 48,
  },
  profileCard: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingLeft: 10,
    paddingRight: 16,
    minHeight: 148,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profileBadgeColumn: {
    alignItems: 'center',
    width: 126,
    zIndex: 2,
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: '#D9EBD7',
  },
  profileMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    gap: 5,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14251C',
    marginTop: 7,
    textAlign: 'center',
  },
  gradeBadge: {
    backgroundColor: '#EFF8EF',
    borderWidth: 1,
    borderColor: '#D9EBD7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  gradeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  tierBadge: {
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#F5D8E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E978A2',
  },
  profileSceneWrap: {
    position: 'absolute',
    right: 10,
    top: 12,
    width: 230,
    height: 124,
    borderTopLeftRadius: 18,
    overflow: 'hidden',
  },
  profileScene: {
    width: '100%',
    height: '100%',
    opacity: 0.96,
  },
  subjectCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  subjectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  subjectIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0ECE5',
  },
  subjectIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  subjectTextBox: {
    flex: 1,
    minWidth: 0,
  },
  subjectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#14251C',
  },
  subjectRemaining: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2FA66F',
    marginTop: 5,
  },
  subjectArrowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectArrow: {
    fontSize: 20,
    color: '#9E9E9E',
  },
});
