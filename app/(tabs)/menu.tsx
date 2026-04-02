import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { resolveAvatar } from '../../utils/avatars';

export default function MenuScreen() {
  const router = useRouter();
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [childEmoji, setChildEmoji] = useState<ImageSourcePropType>(
    require('../../assets/images/avatar_01.png')
  );

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

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
          setChildEmoji(resolveAvatar(data.avatar));
        }
      }
    } catch (error) {
      console.log('Profile load error:', error);
    }
  };

  const menuSections = [
    {
      title: '학습',
      items: [
        { icon: 'book-outline', label: '학습 플랜', route: '/settings/grade' },
        { icon: 'people-outline', label: '자녀 관리', route: '/children/manage' },
      ],
    },
    {
      title: '설정',
      items: [
        { icon: 'notifications-outline', label: '알림 설정', route: '/settings/notifications' },
        { icon: 'megaphone-outline', label: '공지사항', route: '/settings/notice-list' },
      ],
    },
    {
      title: '정보',
      items: [
        { icon: 'document-text-outline', label: '이용약관', route: '/settings/terms' },
        { icon: 'shield-checkmark-outline', label: '개인정보 처리방침', route: '/settings/privacy' },
        { icon: 'clipboard-outline', label: '운영정책', route: '/settings/policy' },
      ],
    },
  ];

  return (
    <SafeLayout showHeader headerTitle="전체메뉴">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Image source={childEmoji} style={styles.avatarImage} />
              <View>
                <Text style={styles.profileName}>{parentName || '부모님'}</Text>
                <Text style={styles.profileEmail}>{parentEmail || ''}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings/detail')}
          >
            <Ionicons name="settings-outline" size={22} color="#5BBFAA" />
          </TouchableOpacity>
        </View>

        {/* 메뉴 섹션들 */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={styles.menuLeft}>
                      <View style={styles.iconBox}>
                        <Ionicons name={item.icon as any} size={18} color="#5BBFAA" />
                      </View>
                      <Text style={styles.menuText}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                  </TouchableOpacity>
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  // 프로필
  profileSection: {
    backgroundColor: '#E8F8F5',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  profileEmail: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  // 섹션
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // 메뉴 아이템
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0FAF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
  },
});
