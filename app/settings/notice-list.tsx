import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';

interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  isPinned: boolean;
  isActive: boolean;
}

export default function NoticeListScreen() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadNotices();
    }, [])
  );

  const loadNotices = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'Notices'),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const noticesList: Notice[] = [];

      querySnapshot.forEach((doc) => {
        noticesList.push({
          id: doc.id,
          ...doc.data()
        } as Notice);
      });

      const sorted = noticesList.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });

      setNotices(sorted);
    } catch (error) {
      console.log('공지사항 로드 에러:', error);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>공지사항</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7ED4C0" />
          </View>
        ) : notices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 공지사항이 없습니다.</Text>
          </View>
        ) : (
          notices.map((notice, index) => (
            <TouchableOpacity
              key={notice.id}
              style={styles.noticeItem}
              onPress={() => router.push({ pathname: '/settings/notice-detail', params: { noticeId: notice.id } })}
            >
              <View style={styles.noticeContent}>
                <View style={styles.titleRow}>
                  {notice.isPinned && (
                    <View style={styles.pinnedBadge}>
                      <Text style={styles.pinnedBadgeText}>[중요]</Text>
                    </View>
                  )}
                  <Text style={styles.noticeTitle} numberOfLines={1}>
                    {notice.title}
                  </Text>
                </View>
                <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
              </View>
              {index < notices.length - 1 && <View style={styles.separator} />}
            </TouchableOpacity>
          ))
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerBtn: {
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
  noticeItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  noticeContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pinnedBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  pinnedBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  noticeDate: {
    fontSize: 13,
    color: '#999999',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: 16,
  },
});
