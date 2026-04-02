import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ImageSourcePropType } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { resolveAvatar } from '../../utils/avatars';
import { SUBJECT_ICONS, SUBJECT_LABELS } from '../../utils/subjects';

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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      const grade = await AsyncStorage.getItem('childGrade');
      const tier = await AsyncStorage.getItem('childTier');

      const g = grade ? parseInt(grade) : 1;
      const t = tier || 'free';

      setChildGrade(g);
      setChildTier(t);
      setSubjects(getSubjectsForGrade(g));
      setQuestionsPerSubject(getQuestionsPerSubject(t));

      if (parentId && childId) {
        const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
        if (childDoc.exists()) {
          const data = childDoc.data();
          setChildAvatar(resolveAvatar(data.avatar));
          setChildName(data.name || '학생');

          if (data.tier) {
            setChildTier(data.tier);
            setQuestionsPerSubject(getQuestionsPerSubject(data.tier));
            await AsyncStorage.setItem('childTier', data.tier || 'free');
            await AsyncStorage.setItem('childGrade', String(data.grade || 1));
          }
        }
      }
    } catch (error) {
      console.log('Study data load error:', error);
    }
  };

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
              <Text style={styles.subjectRemaining}>남은 {questionsPerSubject}문제</Text>
            </View>
            <Text style={styles.subjectArrow}>{'>'}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.bottomNote}>매일 꾸준히 학습해요! 💪</Text>

      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  profileCard: {
    marginHorizontal: 20,
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
    marginHorizontal: 20,
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
