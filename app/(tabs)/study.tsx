import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

const TIER_LABELS: Record<string, string> = { free: '무료회원', baeum: '배움회원', sky: '스카이회원' };

const SUBJECT_CONFIG: Record<string, { emoji: string; label: string }> = {
  korean: { emoji: '📖', label: '국어' },
  math: { emoji: '🔢', label: '수학' },
  integrated: { emoji: '🌿', label: '통합교과' },
  science: { emoji: '🔬', label: '과학' },
  social: { emoji: '🌍', label: '사회' },
  english: { emoji: '🔤', label: '영어' },
};

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
  const [childAvatar, setChildAvatar] = useState('🍎');
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
      console.log('=== 스터디 화면 데이터 로드 시작 ===');
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      const grade = await AsyncStorage.getItem('childGrade');
      const tier = await AsyncStorage.getItem('childTier');

      console.log('parentId:', parentId);
      console.log('childId:', childId);

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
          console.log('study avatar:', data.avatar);
          console.log('study name:', data.name);
          setChildAvatar(data.avatar || '🍎');
          setChildName(data.name || '학생');
        }
      }
    } catch (error) {
      console.log('Study data load error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>과목 선택</Text>
        <Text style={styles.subtitle}>학습할 과목을 선택하세요</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Text style={styles.profileName}>{childAvatar} {childName || '학생'}</Text>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeText}>{childGrade}학년</Text>
            </View>
          </View>
          <Text style={styles.profileTier}>{TIER_LABELS[childTier] || '무료회원'} · 과목당 {questionsPerSubject}문제</Text>
        </View>

        {subjects.map((subjectKey) => {
          const config = SUBJECT_CONFIG[subjectKey];
          if (!config) return null;
          return (
            <TouchableOpacity
              key={subjectKey}
              style={styles.subjectCard}
              onPress={() => router.push({ pathname: '/study/questions', params: { subject: subjectKey, grade: String(childGrade), tier: childTier } })}
            >
              <View style={styles.subjectLeft}>
                <Text style={styles.subjectEmoji}>{config.emoji}</Text>
                <Text style={styles.subjectName}>{config.label}</Text>
                <Text style={styles.subjectRemaining}>남은 {questionsPerSubject}문제</Text>
              </View>
              <Text style={styles.subjectArrow}>{'>'}</Text>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.bottomNote}>매일 꾸준히 학습해요! 💪</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', paddingHorizontal: 20, marginTop: 16 },
  subtitle: { fontSize: 14, color: '#666', paddingHorizontal: 20, marginTop: 4 },
  profileCard: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  gradeBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  gradeText: { fontSize: 12, color: '#666' },
  profileTier: { fontSize: 13, color: '#9E9E9E', marginTop: 4 },
  subjectCard: { marginHorizontal: 20, marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectEmoji: { fontSize: 20 },
  subjectName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  subjectRemaining: { fontSize: 13, color: '#7ED4C0', marginLeft: 4 },
  subjectArrow: { fontSize: 20, color: '#9E9E9E' },
  bottomNote: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', marginTop: 20, marginBottom: 30 },
});
