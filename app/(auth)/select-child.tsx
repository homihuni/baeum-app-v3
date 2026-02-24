import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getChildren } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIER_LABELS: Record<string, string> = { free: '무료회원', baeum: '배움회원', sky: '스카이회원' };
const TIER_COLORS: Record<string, string> = { free: '#E0E0E0', baeum: '#4ECDC4', sky: '#87CEEB' };
const TIER_TEXT_COLORS: Record<string, string> = { free: '#666666', baeum: '#FFFFFF', sky: '#333333' };

export default function SelectChildScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) {
        router.replace('/(auth)/login');
        return;
      }
      const kids = await getChildren(parentId);
      setChildren(kids);
    } catch (error: any) {
      Alert.alert('오류', '자녀 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const selectChild = async (child: any) => {
    if (child.isLocked || child.tier === 'expired') {
      await AsyncStorage.setItem('childId', child.id);
      await AsyncStorage.setItem('childName', child.name);
      router.push('/children/manage');
      return;
    }
    await AsyncStorage.setItem('childId', child.id);
    await AsyncStorage.setItem('childName', child.name);
    await AsyncStorage.setItem('childGrade', String(child.grade));
    await AsyncStorage.setItem('childTier', child.tier);
    router.replace('/(tabs)/home');
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7ED4C0" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const renderChildCards = () => {
    const activeChildren = children.filter((c: any) => !c.isDeleted);

    if (activeChildren.length === 3) {
      return (
        <>
          <View style={styles.topRow}>
            {activeChildren.slice(0, 2).map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childCard,
                  (child.isLocked || child.tier === 'expired') && {
                    opacity: 0.5,
                    backgroundColor: '#E0E0E0',
                  },
                ]}
                onPress={() => selectChild(child)}
              >
                <Text style={styles.avatar}>{child.avatar || '🍓'}</Text>
                <Text style={styles.childName}>{child.name}</Text>
                {(child.isLocked || child.tier === 'expired') && (
                  <View style={{
                    backgroundColor: '#FF6B6B',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginTop: 4,
                  }}>
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                      만료 — 시리얼 등록 필요
                    </Text>
                  </View>
                )}
                <Text style={styles.childGrade}>{child.grade}학년</Text>
                <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[child.tier] || '#E0E0E0' }]}>
                  <Text style={[styles.tierText, { color: TIER_TEXT_COLORS[child.tier] || '#666666' }]}>{TIER_LABELS[child.tier] || '무료회원'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.bottomRow}>
            <TouchableOpacity
              key={activeChildren[2].id}
              style={[
                styles.childCard,
                (activeChildren[2].isLocked || activeChildren[2].tier === 'expired') && {
                  opacity: 0.5,
                  backgroundColor: '#E0E0E0',
                },
              ]}
              onPress={() => selectChild(activeChildren[2])}
            >
              <Text style={styles.avatar}>{activeChildren[2].avatar || '🍓'}</Text>
              <Text style={styles.childName}>{activeChildren[2].name}</Text>
              {(activeChildren[2].isLocked || activeChildren[2].tier === 'expired') && (
                <View style={{
                  backgroundColor: '#FF6B6B',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                    만료 — 시리얼 등록 필요
                  </Text>
                </View>
              )}
              <Text style={styles.childGrade}>{activeChildren[2].grade}학년</Text>
              <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[activeChildren[2].tier] || '#E0E0E0' }]}>
                <Text style={[styles.tierText, { color: TIER_TEXT_COLORS[activeChildren[2].tier] || '#666666' }]}>{TIER_LABELS[activeChildren[2].tier] || '무료회원'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    return (
      <>
        {activeChildren.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[
              styles.childCard,
              (child.isLocked || child.tier === 'expired') && {
                opacity: 0.5,
                backgroundColor: '#E0E0E0',
              },
            ]}
            onPress={() => selectChild(child)}
          >
            <Text style={styles.avatar}>{child.avatar || '🍓'}</Text>
            <Text style={styles.childName}>{child.name}</Text>
            {(child.isLocked || child.tier === 'expired') && (
              <View style={{
                backgroundColor: '#FF6B6B',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginTop: 4,
              }}>
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                  만료 — 시리얼 등록 필요
                </Text>
              </View>
            )}
            <Text style={styles.childGrade}>{child.grade}학년</Text>
            <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[child.tier] || '#E0E0E0' }]}>
              <Text style={[styles.tierText, { color: TIER_TEXT_COLORS[child.tier] || '#666666' }]}>{TIER_LABELS[child.tier] || '무료회원'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>누가 공부할까요?</Text>
      <Text style={styles.subtitle}>학습할 자녀를 선택하세요</Text>

      <View style={styles.cardContainer}>
        {renderChildCards()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', alignItems: 'center', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#7ED4C0', marginTop: 8 },
  cardContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 40, gap: 16, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', gap: 16, justifyContent: 'center', width: '100%' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 16 },
  childCard: { width: 140, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  avatar: { fontSize: 40, marginBottom: 8 },
  childName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  childGrade: { fontSize: 13, color: '#666', marginTop: 4 },
  tierBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  tierText: { fontSize: 11, fontWeight: 'bold' },
});
