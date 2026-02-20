import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChildren, getParent } from '../../utils/firestore';

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
}

type Tier = 'free' | 'baeum' | 'sky';

export default function ManageChildrenScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [currentChildId, setCurrentChildId] = useState<string>('');
  const [highestTier, setHighestTier] = useState<Tier>('free');
  const [loading, setLoading] = useState(true);

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
        setChildren(childrenData);

        const tier = getHighestTier(childrenData);
        setHighestTier(tier);
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

  const handleSelectChild = async (childId: string) => {
    try {
      await AsyncStorage.setItem('childId', childId);
      setCurrentChildId(childId);
      Alert.alert('자녀 선택', '자녀가 변경되었습니다.', [
        { text: '확인', onPress: () => router.push('/(tabs)/home') }
      ]);
    } catch (error) {
      console.log('Select child error:', error);
    }
  };

  const handleAddChild = () => {
    router.push('/children/add');
  };

  const handleEditChild = (childId: string) => {
    router.push(`/children/edit?childId=${childId}`);
  };

  const canAddMoreChildren = (): boolean => {
    if (highestTier === 'free') {
      return children.length < 1;
    }
    return children.length < 3;
  };

  const getMaxChildrenForTier = (): number => {
    if (highestTier === 'free') return 1;
    return 3;
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
              <View key={child.id} style={styles.childCard}>
                <TouchableOpacity
                  style={styles.childInfo}
                  onPress={() => handleSelectChild(child.id)}
                >
                  <Text style={styles.childEmoji}>{child.avatar}</Text>
                  <View style={styles.childDetails}>
                    <View style={styles.childNameRow}>
                      <Text style={styles.childName}>{child.name}</Text>
                      {currentChildId === child.id && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>현재 선택됨</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.childGrade}>{child.grade}학년</Text>
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

            {canAddMoreChildren() && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddChild}>
                <Ionicons name="add-circle-outline" size={24} color="#5BBFAA" />
                <Text style={styles.addButtonText}>자녀 추가</Text>
              </TouchableOpacity>
            )}

            {!canAddMoreChildren() && highestTier === 'free' && (
              <View style={styles.upgradeContainer}>
                <Text style={styles.upgradeText}>
                  배움회원 또는 스카이회원으로 업그레이드하면 최대 3명까지 자녀를 추가할 수 있습니다.
                </Text>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => router.push('/settings/grade')}
                >
                  <Text style={styles.upgradeButtonText}>학습 플랜 보기</Text>
                </TouchableOpacity>
              </View>
            )}

            {!canAddMoreChildren() && (highestTier === 'baeum' || highestTier === 'sky') && (
              <View style={styles.maxReachedContainer}>
                <Text style={styles.maxReachedText}>최대 자녀 수(3명)에 도달했습니다.</Text>
              </View>
            )}
          </>
        )}
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
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  childInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  childEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  childDetails: {
    flex: 1,
  },
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#5BBFAA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
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
  upgradeContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: '#1565C0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#87CEEB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
