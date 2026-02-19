import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function MenuScreen() {
  const router = useRouter();
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [childEmoji, setChildEmoji] = useState('🍎');

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
          setChildEmoji(data.avatar || '🍎');
        }
      }
    } catch (error) {
      console.log('Profile load error:', error);
    }
  };

  const menuItems = [
    { icon: '👦👧', label: '자녀 관리', route: '/children/manage' },
    { icon: '⭐', label: '등급 관리', route: '/settings/grade' },
    { icon: '🔑', label: '시리얼번호 입력', route: '/serial/enter' },
    { icon: '💎', label: '구독 관리', route: '/settings/subscribe' },
    { icon: '📢', label: '공지사항', route: '/settings/notice-list' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{childEmoji} {parentName || '부모님'}</Text>
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
