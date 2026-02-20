import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createChild } from '../../utils/firestore';

const AVATARS = [
  '🍓', '🍎', '🍊', '🍋', '🍇', '🍉',
  '🍑', '🍒', '🫐', '🥝', '🐶', '🐱',
  '🐰', '🐻', '🦊', '🐼', '🐨', '🦁',
  '🐯', '🐸'
];

export default function AddChildScreen() {
  const router = useRouter();
  const [avatar, setAvatar] = useState('🍓');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(1);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }

    if (!birthDate.trim()) {
      Alert.alert('오류', '생년월일을 입력해주세요.');
      return;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(birthDate)) {
      Alert.alert('오류', '생년월일을 YYYY-MM-DD 형식으로 입력해주세요. (예: 2018-03-15)');
      return;
    }

    try {
      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) {
        Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
        return;
      }

      console.log('Saving avatar:', avatar);
      await createChild(parentId, {
        avatar,
        name: name.trim(),
        grade,
        gender,
        birthDate: birthDate.trim(),
      });

      Alert.alert('성공', '자녀가 추가되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.log('Add child error:', error);
      Alert.alert('오류', '자녀 추가에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>자녀 추가</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>아바타</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.avatarOption, avatar === emoji && styles.avatarOptionSelected]}
                onPress={() => setAvatar(emoji)}
              >
                <Text style={styles.avatarEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이름 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="이름 입력"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>성별 *</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
              onPress={() => setGender('male')}
            >
              <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextSelected]}>
                남자
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
              onPress={() => setGender('female')}
            >
              <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextSelected]}>
                여자
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>학년 *</Text>
          <View style={styles.gradeGrid}>
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.gradeButton, grade === g && styles.gradeButtonSelected]}
                onPress={() => setGrade(g)}
              >
                <Text style={[styles.gradeButtonText, grade === g && styles.gradeButtonTextSelected]}>
                  {g}학년
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>생년월일 *</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD (예: 2018-03-15)"
            placeholderTextColor="#999"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>등록</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#5BBFAA',
    backgroundColor: '#F0F9F7',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  gradeButtonSelected: {
    backgroundColor: '#5BBFAA',
  },
  gradeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  gradeButtonTextSelected: {
    color: '#FFFFFF',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#5BBFAA',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#5BBFAA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
