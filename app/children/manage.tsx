import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChildren, getParent } from '../../utils/firestore';
import { resolveAvatar } from '../../utils/avatars';

interface Child {
  id: string;
  name: string;
  avatar: string;
  grade: number;
  gender: string;
  birthDate: string;
  subjects: string[];
  questionsPerSubject: number;
  tier?: string;
  isDeleted?: boolean;
  deletedAt?: any;
  isLocked?: boolean;
}

type Tier = 'free' | 'baeum' | 'sky';

export default function ManageChildrenScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [currentChildId, setCurrentChildId] = useState<string>('');
  const [highestTier, setHighestTier] = useState<Tier>('free');
  const [loading, setLoading] = useState(true);
  const [latestDeletedAt, setLatestDeletedAt] = useState<any>(null);
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [cooldownHours, setCooldownHours] = useState(0);
  const [showFreeChildModal, setShowFreeChildModal] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [selectedLockedChild, setSelectedLockedChild] = useState<Child | null>(null);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [pendingChild, setPendingChild] = useState<Child | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const getHighestTier = (childrenList: Child[]): Tier => {
    if (childrenList.some(c => c.tier === 'sky')) return 'sky';
    if (childrenList.some(c => c.tier === 'baeum')) return 'baeum';
    return 'free';
  };

  const loadData = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');

      if (parentId) {
        const childrenData = await getChildren(parentId) as Child[];
        const activeChildren = childrenData.filter(c => !c.isDeleted);
        setChildren(activeChildren);

        const tier = getHighestTier(activeChildren);
        setHighestTier(tier);

        const deletedChildren = childrenData.filter(c => c.isDeleted && c.deletedAt);
        if (deletedChildren.length > 0) {
          const latest = deletedChildren.reduce((prev, curr) => {
            return (curr.deletedAt?.toMillis?.() || 0) > (prev.deletedAt?.toMillis?.() || 0) ? curr : prev;
          });
          setLatestDeletedAt(latest.deletedAt);
        } else {
          setLatestDeletedAt(null);
        }
      }

      if (childId) {
        setCurrentChildId(childId);
      }
    } catch (error) {
      console.log('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChild = async (child: Child) => {
    if (child.isLocked) {
      setSelectedLockedChild(child);
      setShowLockedModal(true);
      return;
    }

    if (child.id === currentChildId) {
      return;
    }

    setPendingChild(child);
    setShowChangeModal(true);
  };

  const confirmChangeChild = async () => {
    if (!pendingChild) return;

    try {
      await AsyncStorage.setItem('childId', pendingChild.id);
      await AsyncStorage.setItem('childName', pendingChild.name);
      setCurrentChildId(pendingChild.id);
      setShowChangeModal(false);
      setPendingChild(null);
      await loadData();
    } catch (error) {
      console.log('Select child error:', error);
    }
  };

  const handleAddChild = () => {
    // 1. 최대 3명 체크
    if (children.length >= 3) {
      return;
    }

    // 2. 24시간 쿨다운 체크
    if (latestDeletedAt) {
      const now = Date.now();
      const deletedTime = latestDeletedAt.toMillis?.() || 0;
      const diff = now - deletedTime;
      const hours24 = 24 * 60 * 60 * 1000;

      if (diff < hours24) {
        const remainHours = Math.ceil((hours24 - diff) / (60 * 60 * 1000));
        setCooldownHours(remainHours);
        setShowCooldownModal(true);
        return;
      }
    }

    // 3. 무료 자녀 1명 제한 체크
    const freeChildrenCount = children.filter(c => c.tier === 'free').length;
    if (freeChildrenCount >= 1) {
      setShowFreeChildModal(true);
      return;
    }

    // 4. 모든 조건 통과 → 자녀 추가 화면으로 이동
    router.push('/children/add');
  };

  const handleEditChild = (childId: string) => {
    router.push(`/children/edit?childId=${childId}`);
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>자녀 관리</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>로딩 중...</Text>
        ) : (
          <>
            {children.map((child) => (
              <View key={child.id} style={[styles.childCard, child.isLocked && styles.childCardLocked]}>
                <TouchableOpacity
                  style={styles.childInfo}
                  onPress={() => handleSelectChild(child)}
                >
                  <Image source={resolveAvatar(child.avatar)} style={styles.childEmoji} />
                  <View style={styles.childDetails}>
                    <View style={styles.childNameRow}>
                      <Text style={styles.childName}>{child.name}</Text>
                      {child.isLocked && (
                        <View style={styles.badgeLocked}>
                          <Text style={styles.badgeLockedText}>잠금</Text>
                        </View>
                      )}
                      {!child.isLocked && child.tier === 'free' && (
                        <View style={styles.tierBadgeFree}>
                          <Text style={styles.tierBadgeTextFree}>무료</Text>
                        </View>
                      )}
                      {!child.isLocked && child.tier === 'baeum' && (
                        <View style={styles.tierBadgeBaeum}>
                          <Text style={styles.tierBadgeTextBaeum}>배움</Text>
                        </View>
                      )}
                      {!child.isLocked && child.tier === 'sky' && (
                        <View style={styles.tierBadgeSky}>
                          <Text style={styles.tierBadgeTextSky}>스카이</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.childGradeRow}>
                      <Text style={styles.childGrade}>{child.grade}학년</Text>
                      {currentChildId === child.id && (
                        <View style={styles.badgeSelected}>
                          <Text style={styles.badgeSelectedText}>현재 선택됨</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditChild(child.id)}
                >
                  <Ionicons name="create-outline" size={20} color="#5BBFAA" />
                </TouchableOpacity>
              </View>
            ))}

            {children.length < 3 && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddChild}>
                <Ionicons name="add-circle-outline" size={24} color="#5BBFAA" />
                <Text style={styles.addButtonText}>자녀 추가</Text>
              </TouchableOpacity>
            )}

            {children.length >= 3 && (
              <View style={styles.maxReachedContainer}>
                <Text style={styles.maxReachedText}>최대 자녀 수(3명)에 도달했습니다.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 24시간 쿨다운 모달 */}
      <Modal visible={showCooldownModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>자녀 등록 제한</Text>
            <Text style={styles.modalMessage}>
              자녀 삭제 후 24시간이 지나야 새 자녀를 등록할 수 있습니다.{'\n'}약 {cooldownHours}시간 후에 등록 가능합니다.
            </Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setShowCooldownModal(false)}
            >
              <Text style={styles.modalConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 무료 자녀 1명 제한 모달 */}
      <Modal visible={showFreeChildModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>자녀 추가 안내</Text>
            <Text style={styles.modalMessage}>
              무료회원 자녀는 1명만 등록할 수 있습니다.{'\n'}기존 자녀를 배움 또는 스카이회원으로 업그레이드한 후 새 자녀를 추가할 수 있습니다.
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowFreeChildModal(false)}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalUpgradeBtn}
                onPress={() => {
                  setShowFreeChildModal(false);
                  router.push('/settings/grade');
                }}
              >
                <Text style={styles.modalUpgradeText}>학습 플랜 보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 잠긴 자녀 모달 */}
      <Modal visible={showLockedModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>잠긴 자녀</Text>
            <Text style={styles.modalMessage}>
              {selectedLockedChild?.name}은(는) 현재 잠겨있습니다.{'\n'}시리얼 등록 또는 구독으로 잠금을 해제할 수 있습니다.
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowLockedModal(false);
                  setSelectedLockedChild(null);
                }}
              >
                <Text style={styles.modalCancelText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalUpgradeBtn}
                onPress={() => {
                  setShowLockedModal(false);
                  if (selectedLockedChild) {
                    router.push({
                      pathname: '/serial/enter',
                      params: {
                        childId: selectedLockedChild.id,
                        childName: selectedLockedChild.name
                      }
                    });
                  }
                  setSelectedLockedChild(null);
                }}
              >
                <Text style={styles.modalUpgradeText}>시리얼 등록</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 자녀 변경 확인 모달 */}
      <Modal visible={showChangeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>자녀 변경</Text>
            <Text style={styles.modalMessage}>
              {pendingChild?.name}(으)로 변경하시겠습니까?
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowChangeModal(false);
                  setPendingChild(null);
                }}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalChangeConfirmBtn}
                onPress={confirmChangeChild}
              >
                <Text style={styles.modalChangeConfirmText}>변경</Text>
              </TouchableOpacity>
            </View>
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
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  childCardLocked: {
    opacity: 0.5,
  },
  childInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  childEmoji: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  childDetails: {
    flex: 1,
  },
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  childGradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  badgeSelected: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeSelectedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badgeLocked: {
    backgroundColor: '#999999',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeLockedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childGrade: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9F7',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5BBFAA',
    marginLeft: 8,
  },
  maxReachedContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  maxReachedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
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
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
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
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
  },
  modalUpgradeBtn: {
    flex: 1,
    backgroundColor: '#87CEEB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalUpgradeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalChangeConfirmBtn: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalChangeConfirmText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tierBadgeFree: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  tierBadgeTextFree: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666666',
  },
  tierBadgeBaeum: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  tierBadgeTextBaeum: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tierBadgeSky: {
    backgroundColor: '#87CEEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  tierBadgeTextSky: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
  },
});
