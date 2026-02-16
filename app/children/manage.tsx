import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
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
}

export default function ManageChildrenScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [currentChildId, setCurrentChildId] = useState<string>('');
  const [maxChildren, setMaxChildren] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');

      if (parentId) {
        const parentData = await getParent(parentId);
        if (parentData) {
          setMaxChildren(parentData.maxChildren || 1);
        }

        const childrenData = await getChildren(parentId);
        setChildren(childrenData as Child[]);
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
    if (children.length >= maxChildren) {
      Alert.alert('알림', '최대 자녀 수에 도달했습니다.');
      return;
    }
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

            {children.length < maxChildren && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddChild}>
                <Ionicons name="add-circle-outline" size={24} color="#5BBFAA" />
                <Text style={styles.addButtonText}>자녀 추가</Text>
              </TouchableOpacity>
            )}

            {children.length >= maxChildren && (
              <View style={styles.maxReachedContainer}>
                <Text style={styles.maxReachedText}>최대 자녀 수에 도달했습니다</Text>
                <Text style={styles.maxReachedSubtext}>구독을 업그레이드하여 더 많은 자녀를 추가하세요</Text>
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
    marginBottom: 4,
  },
  maxReachedSubtext: {
    fontSize: 12,
    color: '#856404',
  },
});
