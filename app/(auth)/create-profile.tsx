import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createChild } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATARS = ['🍓', '🍎', '🍊', '🍌', '🍇', '🍉', '🍑', '🍒', '🍊', '🍌', '🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸'];
const GRADES = [1, 2, 3, 4, 5, 6];

export default function CreateProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [grade, setGrade] = useState(1);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatar, setAvatar] = useState('🍓');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '자녀 이름을 입력해주세요.');
      return;
    }
    if (!birthDate.trim()) {
      Alert.alert('알림', '생년월일을 입력해주세요. (예: 2018-01-01)');
      return;
    }
    setLoading(true);
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) {
        Alert.alert('오류', '로그인 정보가 없습니다.');
        router.replace('/(auth)/login');
        return;
      }
      console.log('Saving avatar:', avatar);
      const childId = await createChild(parentId, {
        name: name.trim(),
        birthDate: birthDate.trim(),
        grade,
        gender,
        avatar,
      });
      await AsyncStorage.setItem('childId', childId);
      await AsyncStorage.setItem('childName', name.trim());
      await AsyncStorage.setItem('childGrade', String(grade));
      await AsyncStorage.setItem('childTier', 'free');
      router.replace('/(auth)/select-child');
    } catch (error: any) {
      Alert.alert('프로필 생성 실패', '다시 시도해주세요.\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>자녀 프로필 만들기</Text>
        <Text style={styles.subtitle}>학습할 자녀의 정보를 입력해주세요</Text>

        <Text style={styles.sectionLabel}>프로필 아바타</Text>
        <View style={styles.avatarRow}>
          {AVATARS.map((a) => (
            <TouchableOpacity key={a} style={[styles.avatarBtn, avatar === a && styles.avatarSelected]} onPress={() => setAvatar(a)}>
              <Text style={styles.avatarEmoji}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>자녀 이름</Text>
        <TextInput style={styles.input} placeholder="이름을 입력하세요" value={name} onChangeText={setName} />

        <Text style={styles.sectionLabel}>생년월일</Text>
        <TextInput style={styles.input} placeholder="2018-01-01" value={birthDate} onChangeText={setBirthDate} keyboardType="numbers-and-punctuation" />

        <Text style={styles.sectionLabel}>학년</Text>
        <View style={styles.gradeRow}>
          {GRADES.map((g) => (
            <TouchableOpacity key={g} style={[styles.gradeBtn, grade === g && styles.gradeSelected]} onPress={() => setGrade(g)}>
              <Text style={[styles.gradeText, grade === g && styles.gradeTextSelected]}>{g}학년</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>성별</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity style={[styles.genderBtn, gender === 'male' && styles.genderSelected]} onPress={() => setGender('male')}>
            <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>남자</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.genderBtn, gender === 'female' && styles.genderSelected]} onPress={() => setGender('female')}>
            <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>여자</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createText}>프로필 만들기</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#7ED4C0', textAlign: 'center', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  sectionLabel: { fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 8 },
  avatarRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  avatarBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarSelected: { borderColor: '#7ED4C0', backgroundColor: '#E8F8F5' },
  avatarEmoji: { fontSize: 28 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#333' },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gradeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  gradeSelected: { backgroundColor: '#7ED4C0', borderColor: '#7ED4C0' },
  gradeText: { fontSize: 14, color: '#666' },
  gradeTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  genderSelected: { backgroundColor: '#7ED4C0', borderColor: '#7ED4C0' },
  genderText: { fontSize: 15, color: '#666' },
  genderTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  createBtn: { marginTop: 32, backgroundColor: '#7ED4C0', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  createText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});
