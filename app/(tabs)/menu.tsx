import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MenuScreen() {
  const router = useRouter();
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [childEmoji, setChildEmoji] = useState('🍎');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');

      if (parentId) {
        const parentDoc = await getDoc(doc(db, 'Parents', parentId));
        if (parentDoc.exists()) {
          const data = parentDoc.data();
          setParentName(data.name || '부모님');
          setParentEmail(data.email || '');
        }
      }

      if (parentId && childId) {
        const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
        if (childDoc.exists()) {
          const data = childDoc.data();
          setChildEmoji(data.avatar || '🍎');
        }
      }
    } catch (error) {
      console.log('Profile load error:', error);
    }
  };

  const menuItems = [
    { icon: '👶', label: '자녀 관리', route: '/settings/children' },
    { icon: '⭐', label: '등급 관리', route: '/settings/grade' },
    { icon: '🔑', label: '시리얼번호 입력', route: '/settings/serial' },
    { icon: '💎', label: '구독 관리', route: '/settings/subscribe' },
    { icon: '📊', label: '학습 리포트', route: '/settings/report' },
    { icon: '🔔', label: '알림 설정', route: '/settings/notifications' },
    { icon: '💬', label: '1:1 문의', route: '/settings/inquiry-list' },
    { icon: '📢', label: '공지사항', route: '/settings/notice-list' },
    { icon: '📋', label: '이용약관', route: '/settings/terms' },
    { icon: '🔒', label: '개인정보처리방침', route: '/settings/privacy' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.profileSection}>
          <Text style={styles.profileName}>{childEmoji} {parentName || '부모님'}</Text>
          <Text style={styles.profileEmail}>{parentEmail || ''}</Text>
        </View>

        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={() => router.push(item.route)}>
            <Text style={styles.menuText}>
              {item.icon}  {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.menuItem}>
          <View style={styles.versionRow}>
            <Text style={styles.menuText}>ℹ️  앱 버전</Text>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/withdraw')}>
          <Text style={styles.deleteText}>🚪  회원탈퇴</Text>
        </TouchableOpacity>
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
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 15,
    color: '#9E9E9E',
  },
  deleteText: {
    fontSize: 15,
    color: '#FF6B6B',
  },
});
