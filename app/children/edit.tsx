import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChild, updateChild, getChildren } from '../../utils/firestore';
import { Timestamp } from '../../utils/firebase';

const AVATARS = [
  '🍓', '🍎', '🍊', '🍋', '🍇', '🍉',
  '🍑', '🍒', '🫐', '🥝', '🐶', '🐱',
  '🐰', '🐻', '🦊', '🐼', '🐨', '🦁',
  '🐯', '🐸'
];

export default function EditChildScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams();
  const [parentId, setParentId] = useState('');
  const [avatar, setAvatar] = useState('🍓');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

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
    console.log('=== 저장 버튼 클릭 ===');
    console.log('selectedAvatar:', avatar);
    console.log('name:', name);

    if (!name.trim()) {
      return;
    }

    try {
      console.log('=== Firebase 저장 시도 ===');
      console.log('parentId:', parentId);
      console.log('childId:', childId);

      await updateChild(parentId, childId as string, {
        avatar,
        name: name.trim(),
      });

      console.log('=== Firebase 저장 성공 ===');
      setShowCompleteModal(true);
    } catch (error) {
      console.log('=== Firebase 저장 실패 ===', error);
    }
  };

  const handleDelete = async () => {
    try {
      const childrenData = await getChildren(parentId) as any[];
      const activeChildren = childrenData.filter((c: any) => !c.isDeleted);

      if (activeChildren.length <= 1) {
        Alert.alert('삭제 불가', '최소 1명의 자녀가 등록되어 있어야 합니다.');
        return;
      }

      const currentChildId = await AsyncStorage.getItem('childId');
      if (currentChildId === childId) {
        Alert.alert('삭제 불가', '현재 선택된 자녀는 삭제할 수 없습니다. 다른 자녀를 먼저 선택해 주세요.');
        return;
      }

      Alert.alert(
        '자녀 삭제',
        `${name}을(를) 삭제하시겠습니까?\n삭제 후 24시간 동안 새 자녀를 등록할 수 없습니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              await updateChild(parentId, childId as string, {
                isDeleted: true,
                deletedAt: Timestamp.now(),
              });
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.log('Delete child error:', error);
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
            maxLength={10}
          />
          <Text style={styles.charCount}>{name.length}/10</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>자녀 삭제</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>수정 완료</Text>
            <Text style={styles.modalMessage}>자녀 정보가 수정되었습니다</Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => {
                setShowCompleteModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
  deleteButton: {
    marginTop: 30,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4444',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: 280,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalConfirmBtn: {
    backgroundColor: '#5BBFAA',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});
