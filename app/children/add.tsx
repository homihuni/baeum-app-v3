import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import BottomTabBar from '../../components/BottomTabBar';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createChild } from '../../utils/firestore';

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

export default function AddChildScreen() {
  const router = useRouter();
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(1);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBirthDateChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');

    const limited = numbers.slice(0, 8);

    let formatted = limited;
    if (limited.length > 4 && limited.length <= 6) {
      formatted = limited.slice(0, 4) + '-' + limited.slice(4);
    } else if (limited.length > 6) {
      formatted = limited.slice(0, 4) + '-' + limited.slice(4, 6) + '-' + limited.slice(6);
    }

    setBirthDate(formatted);
  };

  const handleAdd = async () => {
    if (isSubmitting) return;

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
      Alert.alert('오류', '생년월일을 YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }

    const inputDate = new Date(birthDate);
    const minDate = new Date('2008-01-01');
    const maxDate = new Date();
    if (isNaN(inputDate.getTime()) || inputDate < minDate || inputDate > maxDate) {
      Alert.alert('오류', '생년월일을 확인해 주세요. (2008년 ~ 현재)');
      return;
    }

    setIsSubmitting(true);

    try {
      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) {
        Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
        setIsSubmitting(false);
        return;
      }

      console.log('=== 자녀 등록 시작 ===');
      console.log('Saving avatar:', avatar);

      const newChildId = await createChild(parentId, {
        avatar,
        name: name.trim(),
        grade,
        gender,
        birthDate: birthDate.trim(),
      });

      console.log('=== 자녀 등록 완료, ID:', newChildId, '===');

      // Alert 대신 바로 이동
      router.back();

    } catch (error) {
      console.log('Add child error:', error);
      Alert.alert('오류', '자녀 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeLayout>
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
            {AVATARS.map((img, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.avatarOption, avatar === img && styles.avatarOptionSelected]}
                onPress={() => setAvatar(img)}
              >
                <Image source={img} style={styles.avatarGridImage} />
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
            maxLength={10}
          />
          <Text style={styles.charCount}>{name.length}/10</Text>
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
            onChangeText={handleBirthDateChange}
            placeholder="생년월일 8자리 입력 (예: 20180315)"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={isSubmitting}
        >
          <Text style={styles.addButtonText}>{isSubmitting ? '등록 중...' : '등록'}</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomTabBar />
    </SafeLayout>
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
    backgroundColor: '#FFFFFF',
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
  avatarGridImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  addButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
});
