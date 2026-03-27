import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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

export default function MenuScreen() {
  const router = useRouter();
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [childEmoji, setChildEmoji] = useState<ImageSourcePropType>(require('../../assets/images/avatar_01.png'));

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      console.log('=== 전체메뉴 프로필 로드 시작 ===');
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      console.log('parentId:', parentId);
      console.log('childId:', childId);

      if (parentId) {
        const parentDoc = await getDoc(doc(db, 'Parents', parentId));
        if (parentDoc.exists()) {
          const data = parentDoc.data();
          setParentName(data.name || '부모님');
          setParentEmail(data.email || '');
          console.log('부모 이름:', data.name);
        }
      }

      if (parentId && childId) {
        const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
        if (childDoc.exists()) {
          const data = childDoc.data();
          console.log('settings avatar:', data.avatar);
          setChildEmoji(resolveAvatar(data.avatar));
        }
      }
    } catch (error) {
      console.log('Profile load error:', error);
    }
  };

  const menuItems = [
    { icon: '👦👧', label: '자녀 관리', route: '/children/manage' },
    { icon: '📋', label: '학습 플랜', route: '/settings/grade' },
    { icon: '📢', label: '공지사항', route: '/settings/notice-list' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Image source={childEmoji} style={styles.avatarImage} />
              <Text style={styles.profileName}>{parentName || '부모님'}</Text>
            </View>
            <Text style={styles.profileEmail}>{parentEmail || ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings/detail')}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={() => router.push(item.route)}>
            <Text style={styles.menuText}>
              {item.icon}  {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileSection: {
    backgroundColor: '#B8E8DC',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  profileEmail: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  settingsButton: {
    padding: 4,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  menuText: {
    fontSize: 15,
    color: '#333333',
  },
});
