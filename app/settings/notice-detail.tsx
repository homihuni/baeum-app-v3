import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import SubHeader from '../../components/SubHeader';
import BottomTabBar from '../../components/BottomTabBar';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

interface Notice {
  title: string;
  content: string;
  createdAt: any;
  isPinned: boolean;
}

export default function NoticeDetailScreen() {
  const router = useRouter();
  const { noticeId } = useLocalSearchParams<{ noticeId: string }>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadNotice();
    }, [noticeId])
  );

  const loadNotice = async () => {
    if (!noticeId) return;

    try {
      setLoading(true);
      const noticeDoc = await getDoc(doc(db, 'Notices', noticeId));

      if (noticeDoc.exists()) {
        setNotice(noticeDoc.data() as Notice);
      }
    } catch (error) {
      console.log('공지사항 상세 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <SubHeader title="공지사항" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7ED4C0" />
          </View>
        ) : notice ? (
          <View style={styles.noticeContainer}>
            {notice.isPinned && (
              <View style={styles.pinnedBadge}>
                <Text style={styles.pinnedBadgeText}>[중요]</Text>
              </View>
            )}
            <Text style={styles.noticeTitle}>{notice.title}</Text>
            <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
            <View style={styles.separator} />
            <Text style={styles.noticeContent}>{notice.content}</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>공지사항을 찾을 수 없습니다.</Text>
          </View>
        )}
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },
  noticeContainer: {
    flex: 1,
  },
  pinnedBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  pinnedBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  noticeDate: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 20,
  },
  noticeContent: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 24,
  },
});
