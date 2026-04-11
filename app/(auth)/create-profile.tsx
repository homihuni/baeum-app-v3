import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import { useRouter } from 'expo-router';
import { createChild } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp } from '../../utils/responsive';

const AVATARS = [
  require('../../assets/images/avatar_01.png'),
  require('../../assets/images/avatar_02.png'),
  require('../../assets/images/avatar_03.png'),
  require('../../assets/images/avatar_04.png'),
  require('../../assets/images/avatar_05.png'),
  require('../../assets/images/avatar_06.png'),
  require('../../assets/images/avatar_07.png'),
  require('../../assets/images/avatar_08.png'),
  require('../../assets/images/avatar_09.png'),
  require('../../assets/images/avatar_10.png'),
  require('../../assets/images/avatar_11.png'),
  require('../../assets/images/avatar_12.png'),
  require('../../assets/images/avatar_13.png'),
  require('../../assets/images/avatar_14.png'),
  require('../../assets/images/avatar_15.png'),
  require('../../assets/images/avatar_16.png'),
  require('../../assets/images/avatar_17.png'),
  require('../../assets/images/avatar_18.png'),
  require('../../assets/images/avatar_19.png'),
  require('../../assets/images/avatar_20.png'),
  require('../../assets/images/avatar_21.png'),
  require('../../assets/images/avatar_22.png'),
  require('../../assets/images/avatar_23.png'),
  require('../../assets/images/avatar_24.png'),
  require('../../assets/images/avatar_25.png'),
  require('../../assets/images/avatar_26.png'),
  require('../../assets/images/avatar_27.png'),
  require('../../assets/images/avatar_28.png'),
  require('../../assets/images/avatar_29.png'),
];
const GRADES = [1, 2, 3, 4, 5, 6];

// 아바타 버튼 크기: 화면 폭 15% 기준, 최대 72px (태블릿 대응)
// - 375px 폰: 56px (기존과 동일), 768px 태블릿: 72px (터치 영역 확대)
const AVATAR_BTN_SIZE = Math.min(wp(15), 72);
// 아바타 이미지 크기: 버튼 크기의 71% (버튼 내부 여백 확보)
const AVATAR_IMG_SIZE = Math.round(AVATAR_BTN_SIZE * 0.71);

export default function CreateProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [grade, setGrade] = useState(1);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatar, setAvatar] = useState(AVATARS[0]);
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
    <SafeLayout showHeader headerTitle="자녀 프로필 만들기">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.subtitle}>학습할 자녀의 정보를 입력해주세요</Text>

        {/* 아바타 선택 - 중앙 정렬 5열 그리드 */}
        <Text style={styles.sectionLabel}>프로필 아바타</Text>
        <View style={styles.avatarGrid}>
          {AVATARS.map((img, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.avatarBtn, avatar === img && styles.avatarSelected]}
              onPress={() => setAvatar(img)}
            >
              <Image source={img} style={styles.avatarGridImage} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 자녀 이름 */}
        <Text style={styles.sectionLabel}>자녀 이름</Text>
        <TextInput
          style={styles.input}
          placeholder="이름을 입력하세요"
          value={name}
          onChangeText={setName}
          maxLength={10}
        />
        <Text style={styles.charCount}>{name.length}/10</Text>

        {/* 생년월일 */}
        <Text style={styles.sectionLabel}>생년월일</Text>
        <TextInput
          style={styles.input}
          placeholder="2018-01-01"
          value={birthDate}
          onChangeText={setBirthDate}
          keyboardType="numbers-and-punctuation"
        />

        {/* 학년 */}
        <Text style={styles.sectionLabel}>학년</Text>
        <View style={styles.gradeRow}>
          {GRADES.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.gradeBtn, grade === g && styles.gradeSelected]}
              onPress={() => setGrade(g)}
            >
              <Text style={[styles.gradeText, grade === g && styles.gradeTextSelected]}>
                {g}학년
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 성별 */}
        <Text style={styles.sectionLabel}>성별</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, gender === 'male' && styles.genderSelected]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>남자</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderBtn, gender === 'female' && styles.genderSelected]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>여자</Text>
          </TouchableOpacity>
        </View>

        {/* 프로필 만들기 버튼 */}
        <TouchableOpacity
          style={styles.createBtn}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.createText}>프로필 만들기</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  // 스크롤 — paddingHorizontal: wp(6) 반응형 (375px: 22px, 768px: 약 46px)
  scroll: {
    paddingHorizontal: wp(6),
    paddingVertical: 24,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },

  // 아바타 그리드 - 중앙 정렬
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  // 아바타 버튼 — AVATAR_BTN_SIZE 반응형 (375px: 56px, 768px: 72px)
  avatarBtn: {
    width: AVATAR_BTN_SIZE,
    height: AVATAR_BTN_SIZE,
    borderRadius: AVATAR_BTN_SIZE / 2,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: '#7ED4C0',
    backgroundColor: '#E8F8F5',
  },
  // 아바타 이미지 — AVATAR_IMG_SIZE (버튼 크기의 71%)
  avatarGridImage: {
    width: AVATAR_IMG_SIZE,
    height: AVATAR_IMG_SIZE,
    borderRadius: AVATAR_IMG_SIZE / 2,
  },

  // 이름 입력
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },

  // 학년
  gradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gradeSelected: {
    backgroundColor: '#7ED4C0',
    borderColor: '#7ED4C0',
  },
  gradeText: {
    fontSize: 14,
    color: '#666',
  },
  gradeTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // 성별
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  genderSelected: {
    backgroundColor: '#7ED4C0',
    borderColor: '#7ED4C0',
  },
  genderText: {
    fontSize: 15,
    color: '#666',
  },
  genderTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // 생성 버튼
  createBtn: {
    marginTop: 32,
    backgroundColor: '#7ED4C0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
