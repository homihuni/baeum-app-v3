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

const getSubjectsForGrade = (grade: number) => {
  if (grade <= 2) return ['korean', 'math', 'integrated'];
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
  const [subjects, setSubjects] = useState<string[]>([]);
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
    <SafeLayout showHeader headerTitle="학습플랜">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image source={childAvatar} style={{ width: 32, height: 32, borderRadius: 16 }} />
              <Text style={styles.profileName}>{childName || '학생'}</Text>
            </View>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeText}>{childGrade}학년</Text>
            </View>
          </View>
          <Text style={styles.profileTier}>
            {TIER_LABELS[childTier] || '무료회원'} · 과목당 {questionsPerSubject}문제
          </Text>
        </View>

        {subjects.map((subjectKey) => (
          <TouchableOpacity
            key={subjectKey}
            style={styles.subjectCard}
            onPress={() => router.push({
              pathname: '/study/questions',
              params: { subject: subjectKey, grade: String(childGrade), tier: childTier }
            })}
          >
            <View style={styles.subjectLeft}>
              <Image source={SUBJECT_ICONS[subjectKey]} style={styles.subjectIcon} />
              <Text style={styles.subjectName}>{SUBJECT_LABELS[subjectKey]}</Text>
              <Text style={styles.subjectRemaining}>총 {questionsPerSubject}문제</Text>
            </View>
            <Text style={styles.subjectArrow}>{'>'}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.bottomNote}>매일 꾸준히 학습해요!</Text>

      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 20,
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
  profileCard: {
    marginHorizontal: wp(5),
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  gradeBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 12,
    color: '#666',
  },
  profileTier: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 4,
  },
  subjectCard: {
    marginHorizontal: wp(5),
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subjectRemaining: {
    fontSize: 13,
    color: '#7ED4C0',
    marginLeft: 4,
  },
  subjectArrow: {
    fontSize: 20,
    color: '#9E9E9E',
  },
  bottomNote: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
});
