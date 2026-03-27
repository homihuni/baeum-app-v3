import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getChildren } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATAR_MAP: Record<string, any> = {
  avatar_01: require('../../assets/images/avatar_01.png'),
  avatar_02: require('../../assets/images/avatar_02.png'),
  avatar_03: require('../../assets/images/avatar_03.png'),
  avatar_04: require('../../assets/images/avatar_04.png'),
  avatar_05: require('../../assets/images/avatar_05.png'),
  avatar_06: require('../../assets/images/avatar_06.png'),
  avatar_07: require('../../assets/images/avatar_07.png'),
  avatar_08: require('../../assets/images/avatar_08.png'),
  avatar_09: require('../../assets/images/avatar_09.png'),
  avatar_10: require('../../assets/images/avatar_10.png'),
  avatar_11: require('../../assets/images/avatar_11.png'),
  avatar_12: require('../../assets/images/avatar_12.png'),
  avatar_13: require('../../assets/images/avatar_13.png'),
  avatar_14: require('../../assets/images/avatar_14.png'),
  avatar_15: require('../../assets/images/avatar_15.png'),
  avatar_16: require('../../assets/images/avatar_16.png'),
  avatar_17: require('../../assets/images/avatar_17.png'),
  avatar_18: require('../../assets/images/avatar_18.png'),
  avatar_19: require('../../assets/images/avatar_19.png'),
  avatar_20: require('../../assets/images/avatar_20.png'),
  avatar_21: require('../../assets/images/avatar_21.png'),
  avatar_22: require('../../assets/images/avatar_22.png'),
  avatar_23: require('../../assets/images/avatar_23.png'),
  avatar_24: require('../../assets/images/avatar_24.png'),
  avatar_25: require('../../assets/images/avatar_25.png'),
  avatar_26: require('../../assets/images/avatar_26.png'),
  avatar_27: require('../../assets/images/avatar_27.png'),
  avatar_28: require('../../assets/images/avatar_28.png'),
  avatar_29: require('../../assets/images/avatar_29.png'),
};
const DEFAULT_AVATAR = require('../../assets/images/avatar_01.png');
function resolveAvatar(value: any): any {
  if (!value) return DEFAULT_AVATAR;
  if (typeof value === 'string' && AVATAR_MAP[value]) return AVATAR_MAP[value];
  if (typeof value === 'string') {
    const match = value.match(/avatar_(\d+)/);
    if (match && AVATAR_MAP['avatar_' + match[1]]) return AVATAR_MAP['avatar_' + match[1]];
    return DEFAULT_AVATAR;
  }
  return DEFAULT_AVATAR;
}

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
                <Image source={resolveAvatar(child.avatar)} style={styles.avatar} />
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
                      Expired
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
              <Image source={resolveAvatar(activeChildren[2].avatar)} style={styles.avatar} />
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
            <Image source={resolveAvatar(child.avatar)} style={styles.avatar} />
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
  avatar: { width: 50, height: 50, borderRadius: 25, marginBottom: 8 },
  childName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  childGrade: { fontSize: 13, color: '#666', marginTop: 4 },
  tierBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  tierText: { fontSize: 11, fontWeight: 'bold' },
});
