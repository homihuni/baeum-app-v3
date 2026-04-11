import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Image } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import BottomTabBar from '../../components/BottomTabBar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChild, updateChild } from '../../utils/firestore';
import { db } from '../../utils/firebase';
import { collection, doc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { AVATAR_KEYS, AVATAR_MAP, resolveAvatarKey } from '../../utils/avatars';

export default function EditChildScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams();
  const [parentId, setParentId] = useState('');
  const [selectedAvatarKey, setSelectedAvatarKey] = useState('avatar_01');
  const [name, setName] = useState('');
  const [tier, setTier] = useState<string>('free');
  const [grade, setGrade] = useState<number>(1);
  const [originalGrade, setOriginalGrade] = useState<number>(1);
  const [gradeChangeCount, setGradeChangeCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
  const [showGradeChangeModal, setShowGradeChangeModal] = useState(false);
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
        setSelectedAvatarKey(resolveAvatarKey(childData.avatar));
        setName(childData.name || '');
        setTier(childData.tier || 'free');
        setGrade(childData.grade || 1);
        setOriginalGrade(childData.grade || 1);
        setGradeChangeCount(childData.gradeChangeCount || 0);
      }
    } catch (error) {
      console.log('Load child error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (grade !== originalGrade) {
      setShowGradeChangeModal(true);
      return;
    }
    await saveData();
  };

  const saveData = async () => {
    try {
      const updateData: any = {
        avatar: selectedAvatarKey,
        name: name.trim(),
        grade,
      };
      if (grade !== originalGrade) {
        updateData.gradeChangeCount = gradeChangeCount + 1;
      }
      await updateChild(parentId, childId as string, updateData);
      setShowCompleteModal(true);
    } catch (error) {
      console.log('Firebase save error:', error);
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
      <SafeLayout showHeader headerTitle="자녀 프로필 수정">
        <Text style={styles.loadingText}>로딩 중...</Text>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout showHeader headerTitle="자녀 프로필 수정">
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* 아바타 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>아바타</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.avatarOption,
                  selectedAvatarKey === key && styles.avatarOptionSelected
                ]}
                onPress={() => setSelectedAvatarKey(key)}
              >
                <Image source={AVATAR_MAP[key]} style={styles.avatarGridImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 이름 섹션 */}
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

        {/* 학년 섹션 - 무료회원 */}
        {tier === 'free' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>학년</Text>
            <View style={styles.gradeDisplayRow}>
              <Text style={styles.gradeDisplayText}>{grade}학년</Text>
              <Text style={styles.gradeNotice}>매년 3월에 자동으로 학년이 올라갑니다</Text>
            </View>
          </View>
        )}

        {/* 학년 섹션 - 배움/스카이회원 */}
        {(tier === 'baeum' || tier === 'sky') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>학년</Text>
            {gradeChangeCount >= 3 ? (
              <>
                <View style={styles.gradeGrid}>
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.gradeButton,
                        g === grade && styles.gradeButtonSelected,
                        styles.gradeButtonDisabled,
                      ]}
                      disabled={true}
                    >
                      <Text style={[
                        styles.gradeButtonText,
                        g === grade && styles.gradeButtonTextSelected,
                        styles.gradeButtonTextDisabled,
                      ]}>
                        {g}학년
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.gradeHintError}>학년 변경 횟수를 모두 사용했습니다. (3회/3회)</Text>
              </>
            ) : (
              <>
                <View style={styles.gradeGrid}>
                  {[1, 2, 3, 4, 5, 6].map((g) => {
                    const isCurrentGrade = g === originalGrade;
                    const isNextGrade = g === originalGrade + 1 && originalGrade < 6;
                    const isSelectable = isCurrentGrade || isNextGrade;
                    const isSelected = g === grade;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.gradeButton,
                          isSelected && styles.gradeButtonSelected,
                          !isSelectable && styles.gradeButtonDisabled,
                        ]}
                        onPress={() => { if (isSelectable) setGrade(g); }}
                        disabled={!isSelectable}
                      >
                        <Text style={[
                          styles.gradeButtonText,
                          isSelected && styles.gradeButtonTextSelected,
                          !isSelectable && styles.gradeButtonTextDisabled,
                        ]}>
                          {g}학년
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.gradeHint}>
                  현재 학년에서 한 학년 위로만 변경할 수 있습니다{'\n'}
                  학년 변경 가능 횟수: {3 - gradeChangeCount}회 남음
                </Text>
              </>
            )}
          </View>
        )}

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>

        {/* 삭제 버튼 */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 수정 완료 모달 */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>수정 완료</Text>
            <Text style={styles.modalMessage}>자녀 정보가 수정되었습니다</Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => { setShowCompleteModal(false); router.back(); }}
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

      {/* 삭제 오류 모달 */}
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

      {/* 학년 변경 모달 */}
      <Modal visible={showGradeChangeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>학년 변경</Text>
            <Text style={styles.modalMessage}>
              {originalGrade}학년에서 {grade}학년으로 변경합니다.{'\n'}변경하시겠습니까?{'\n\n'}
              (변경 가능 횟수: {3 - gradeChangeCount - 1}회 남음)
            </Text>
            <View style={styles.gradeModalButtons}>
              <TouchableOpacity
                style={styles.gradeModalCancelBtn}
                onPress={() => { setShowGradeChangeModal(false); setGrade(originalGrade); }}
              >
                <Text style={styles.gradeModalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gradeModalConfirmBtn}
                onPress={() => { setShowGradeChangeModal(false); saveData(); }}
              >
                <Text style={styles.gradeModalConfirmText}>변경</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomTabBar />
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
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

  // 아바타 그리드 - 중앙 정렬
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOption: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#5BBFAA',
    backgroundColor: '#F0F9F7',
  },
  avatarGridImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  // 이름 입력
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

  // 저장/삭제 버튼
  saveButton: {
    backgroundColor: '#5BBFAA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 40,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4444',
  },

  // 학년
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 70,
    alignItems: 'center',
  },
  gradeButtonSelected: {
    backgroundColor: '#5BBFAA',
  },
  gradeButtonDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.4,
  },
  gradeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  gradeButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  gradeButtonTextDisabled: {
    color: '#CCC',
  },
  gradeDisplayRow: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 14,
  },
  gradeDisplayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  gradeNotice: {
    fontSize: 12,
    color: '#999',
  },
  gradeHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  gradeHintError: {
    fontSize: 12,
    color: '#FF4444',
    marginTop: 8,
    fontWeight: 'bold',
  },

  // 모달 오버레이
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  // 태블릿 대응: 고정 300px → 화면 폭의 90%, 최대 400px
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
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
    textAlign: 'center',
    lineHeight: 22,
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
    width: '100%',
  },
  deleteModalCancelBtn: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  deleteModalConfirmBtn: {
    flex: 1,
    backgroundColor: '#FF4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gradeModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  gradeModalCancelBtn: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  gradeModalCancelText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
  },
  gradeModalConfirmBtn: {
    flex: 1,
    backgroundColor: '#5BBFAA',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  gradeModalConfirmText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
