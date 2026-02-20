import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChild, updateChild, getChildren } from '../../utils/firestore';
import { Timestamp, db } from '../../utils/firebase';
import { collection, doc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

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
      const pId = await AsyncStorage.getItem('parentId');
      if (!pId) return;

      const childrenRef = collection(db, 'Parents', pId, 'Children');
      const childrenSnap = await getDocs(childrenRef);
      const activeChildren = childrenSnap.docs.filter(d => !d.data().isDeleted);

      if (activeChildren.length <= 1) {
        setDeleteErrorMessage('최소 1명의 자녀가 등록되어 있어야 합니다.');
        setShowDeleteErrorModal(true);
        return;
      }

      const selectedChildId = await AsyncStorage.getItem('childId');
      if (selectedChildId === childId) {
        setDeleteErrorMessage('현재 선택된 자녀는 삭제할 수 없습니다.\n다른 자녀를 먼저 선택해 주세요.');
        setShowDeleteErrorModal(true);
        return;
      }

      // 조건 통과 → 삭제 확인 모달 표시
      setShowDeleteModal(true);
    } catch (error) {
      console.log('Delete check error:', error);
      setDeleteErrorMessage('삭제 처리 중 오류가 발생했습니다.');
      setShowDeleteErrorModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      const pId = await AsyncStorage.getItem('parentId');
      if (!pId) return;

      const childDocRef = doc(db, 'Parents', pId, 'Children', childId as string);
      await updateDoc(childDocRef, {
        isDeleted: true,
        deletedAt: serverTimestamp()
      });
      console.log('=== 자녀 삭제 완료:', childId, '===');
      setShowDeleteModal(false);
      router.back();
    } catch (error) {
      console.log('Delete error:', error);
      setShowDeleteModal(false);
      setDeleteErrorMessage('삭제에 실패했습니다.');
      setShowDeleteErrorModal(true);
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
          <Text style={styles.deleteButtonText}>삭제</Text>
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

      {/* 삭제 확인 모달 */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>삭제</Text>
            <Text style={styles.modalMessage}>
              {name}을(를) 삭제하시겠습니까?{'\n'}삭제 후 24시간 동안 새 자녀를 등록할 수 없습니다.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmBtn}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteModalConfirmText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 삭제 에러 모달 */}
      <Modal visible={showDeleteErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>안내</Text>
            <Text style={styles.modalMessage}>{deleteErrorMessage}</Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setShowDeleteErrorModal(false)}
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
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  deleteModalCancelBtn: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  deleteModalConfirmBtn: {
    flex: 1,
    backgroundColor: '#FF4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
