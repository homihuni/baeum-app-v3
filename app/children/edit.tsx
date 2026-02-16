import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChild, updateChild } from '../../utils/firestore';

const AVATARS = ['🍓', '🍎', '🍊', '🍋', '🍇', '🍉', '🍑', '🍒', '🫐', '🥝', '🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸'];

export default function EditChildScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams();
  const [parentId, setParentId] = useState('');
  const [avatar, setAvatar] = useState('🍓');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildData();
  }, []);

  const loadChildData = async () => {
    try {
      const pId = await AsyncStorage.getItem('parentId');
      if (!pId || !childId) return;

      setParentId(pId);
      const childData = await getChild(pId, childId as string) as any;

      if (childData) {
        setAvatar(childData.avatar || '🍓');
        setName(childData.name || '');
      }
    } catch (error) {
      console.log('Load child error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }

    try {
      console.log('Saving avatar:', avatar);
      await updateChild(parentId, childId as string, {
        avatar,
        name: name.trim(),
      });

      Alert.alert('성공', '자녀 정보가 수정되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.log('Update child error:', error);
      Alert.alert('오류', '자녀 정보 수정에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>자녀 정보 수정</Text>
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
          <Text style={styles.sectionTitle}>이름</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="이름 입력"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
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
  loadingText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
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
  saveButton: {
    backgroundColor: '#5BBFAA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
