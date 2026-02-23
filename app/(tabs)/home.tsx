import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { checkSerialExpiry, lockExcessFreeChildren } from '../../utils/firestore';

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(2);
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [childTier, setChildTier] = useState('free');
  const [childAvatar, setChildAvatar] = useState('🍓');
  const [studyDays, setStudyDays] = useState<Set<number>>(new Set());
  const [totalProblems, setTotalProblems] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [accessDays, setAccessDays] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showLockSelectionModal, setShowLockSelectionModal] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [showLockCompleteModal, setShowLockCompleteModal] = useState(false);
  const [expiryMessage, setExpiryMessage] = useState('');
  const [selectedChildName, setSelectedChildName] = useState('');
  const [freeChildren, setFreeChildren] = useState<any[]>([]);

  const TIER_LABELS: Record<string, string> = { free: '무료회원', baeum: '배움회원', sky: '스카이회원' };
  const TIER_COLORS: Record<string, string> = { free: '#E0E0E0', baeum: '#4ECDC4', sky: '#87CEEB' };
  const TIER_TEXT_COLORS: Record<string, string> = { free: '#666666', baeum: '#FFFFFF', sky: '#333333' };

  useEffect(() => {
    loadChildData();
  }, []);

  const loadChildData = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      const grade = await AsyncStorage.getItem('childGrade');
      const tier = await AsyncStorage.getItem('childTier');

      if (grade) setChildGrade(grade);
      if (tier) setChildTier(tier);

      if (parentId && childId) {
        const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
        if (childDoc.exists()) {
          const childData = childDoc.data();
          console.log('홈 화면 avatar:', childData.avatar);
          console.log('홈 화면 name:', childData.name);
          if (childData.avatar) setChildAvatar(childData.avatar);
          if (childData.name) setChildName(childData.name);
        }
      }
    } catch (error) {
      console.log('Load child data error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkExpiry();
      loadMonthlyData();
      refreshChildAvatar();
    }, [currentYear, currentMonth])
  );

  const checkExpiry = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) return;

      const result = await checkSerialExpiry(parentId);

      if (result.expiredChildren.length > 0) {
        console.log('만료된 자녀:', result.expiredChildren);

        if (result.freeChildrenCount < 2) {
          setExpiryMessage(
            `${result.expiredChildren.join(', ')}의 시리얼이 만료되어 무료회원으로 전환되었습니다.`
          );
          setShowExpiryModal(true);
        }
      }

      if (result.freeChildrenCount >= 2) {
        const childrenRef = collection(db, 'Parents', parentId, 'Children');
        const snap = await getDocs(childrenRef);
        const freeList: any[] = [];

        snap.forEach((childDoc) => {
          const childData = childDoc.data();
          if (childData.isDeleted !== true && childData.tier === 'free') {
            freeList.push({
              id: childDoc.id,
              name: childData.name || '자녀',
              avatar: childData.avatar || '🍓',
              grade: childData.grade || '초1',
            });
          }
        });

        setFreeChildren(freeList);
        console.log('무료 자녀 목록:', JSON.stringify(freeList));
        console.log('모달 표시 예정, freeList 수:', freeList.length);
        setShowLockSelectionModal(true);
      }
    } catch (error) {
      console.log('시리얼 만료 체크 오류:', error);
    }
  };

  const handleSelectChild = async (childId: string, childName: string) => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) return;

      await AsyncStorage.setItem('childId', childId);
      await AsyncStorage.setItem('childName', childName);

      await lockExcessFreeChildren(parentId, childId);

      setShowLockSelectionModal(false);
      setSelectedChildName(childName);
      setShowLockCompleteModal(true);

      console.log(`자녀 선택 완료: ${childName}, 나머지 잠금 처리`);

      loadChildData();
      loadMonthlyData();
      refreshChildAvatar();
    } catch (error) {
      console.log('자녀 선택 오류:', error);
    }
  };

  const refreshChildAvatar = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      if (parentId && childId) {
        const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
        if (childDoc.exists()) {
          const childData = childDoc.data();
          console.log('홈 화면 avatar:', childData.avatar);
          console.log('홈 화면 name:', childData.name);
          console.log('홈 화면 tier:', childData.tier);
          if (childData.avatar) setChildAvatar(childData.avatar);
          if (childData.name) setChildName(childData.name);
          if (childData.tier) setChildTier(childData.tier);
        }
      }
    } catch (error) {
      console.log('Refresh avatar error:', error);
    }
  };

  const loadMonthlyData = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');
      if (!parentId || !childId) return;
      const recordsRef = collection(db, 'Parents', parentId, 'Children', childId, 'Records');
      const monthStr = currentYear + '-' + String(currentMonth).padStart(2, '0');
      const q = query(recordsRef, where('date', '>=', monthStr + '-01'), where('date', '<=', monthStr + '-31'));
      const snapshot = await getDocs(q);
      const daysSet = new Set<number>();
      let problems = 0;
      let correct = 0;
      let totalScore = 0;
      let scoreCount = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const day = parseInt(data.date.split('-')[2]);
        daysSet.add(day);
        if (data.totalQuestions !== undefined) {
          problems += data.totalQuestions;
          correct += data.correctCount || 0;
        }
        if (data.score !== undefined) {
          totalScore += data.score;
          scoreCount++;
        }
      });

      setStudyDays(daysSet);
      setAccessDays(daysSet.size);
      setTotalProblems(problems);
      setCorrectCount(correct);
      setMonthlyAverage(scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0);
    } catch (error) { console.log('Load error:', error); }
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const isAtMinMonth = currentYear === 2026 && currentMonth === 1;
  const isPastMonth = currentYear < 2026 || (currentYear === 2026 && currentMonth < 2);

  const previousMonth = () => {
    if (isAtMinMonth) return;
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToCurrentMonth = () => {
    setCurrentYear(2026);
    setCurrentMonth(2);
  };

  const renderCalendarDays = () => {
    const days = [];
    const todayDate = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();
    const isCurrentMonth = currentYear === todayYear && currentMonth === todayMonth;

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-start-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (firstDay + day - 1) % 7;
      const isToday = isCurrentMonth && day === todayDate;
      const isSelected = day === selectedDate && !isToday;
      const hasCompleted = studyDays.has(day);
      const hasMissed = isCurrentMonth && day < todayDate && !studyDays.has(day);

      let textColor = '#333333';
      if (dayOfWeek === 0) textColor = '#FF6B6B';
      else if (dayOfWeek === 6) textColor = '#4A90D9';

      const showDot = !isToday && (hasCompleted || hasMissed);

      days.push(
        <TouchableOpacity
          key={day}
          style={styles.dayCell}
          onPress={() => setSelectedDate(day)}
        >
          <View style={isToday ? styles.todayCircle : isSelected ? styles.selectedCircle : null}>
            <Text style={[
              styles.dayText,
              { color: isToday ? '#FFFFFF' : textColor }
            ]}>
              {day}
            </Text>
          </View>
          {showDot && (
            <View style={[styles.dot, { backgroundColor: hasCompleted ? '#4CAF50' : '#FF6B6B' }]} />
          )}
        </TouchableOpacity>
      );
    }

    const totalCells = firstDay + daysInMonth;
    const emptyCellsAtEnd = 42 - totalCells;
    for (let i = 0; i < emptyCellsAtEnd; i++) {
      days.push(<View key={`empty-end-${i}`} style={styles.dayCell} />);
    }

    return days;
  };

  const displayName = childName.length > 5 ? childName.substring(0, 5) + '..' : childName;

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 1. PROFILE HEADER BAR */}
        <View style={styles.profileHeader}>
          <View style={styles.profileLeft}>
            <Text style={styles.profileEmoji}>{childAvatar}</Text>
            <Text style={styles.profileName}>{displayName || '김배움'}</Text>
            <View style={[styles.badge, { backgroundColor: TIER_COLORS[childTier] || '#E0E0E0' }]}>
              <Text style={[styles.badgeText, { color: TIER_TEXT_COLORS[childTier] || '#666666' }]}>{TIER_LABELS[childTier] || '무료회원'}</Text>
            </View>
          </View>
          <Text style={styles.bellIcon}>🔔</Text>
        </View>

        {/* 2. BANNER AREA */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>배움학습 소식</Text>
          <Text style={styles.bannerSubtitle}>매일 학습하고 성장해요!</Text>
        </View>

        {/* 3. MONTHLY STATS ROW */}
        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>이번달 접속</Text>
            <Text style={[styles.statValue, { color: '#7ED4C0' }]}>{accessDays}일</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>학습결과</Text>
            <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{monthlyAverage}점</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>문제풀이수</Text>
            <Text style={[styles.statValue, { color: '#87CEEB' }]}>{totalProblems}개</Text>
          </View>
        </View>

        {/* 4. CALENDAR */}
        <View style={styles.calendarCard}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={previousMonth} disabled={isAtMinMonth}>
              <Text style={[styles.arrowText, isAtMinMonth && { color: '#D0D0D0' }]}>{'<'}</Text>
            </TouchableOpacity>
            <View style={styles.monthTitleContainer}>
              <Text style={styles.monthTitle}>{currentYear}년 {currentMonth}월</Text>
              {isPastMonth && (
                <TouchableOpacity onPress={goToCurrentMonth} style={styles.currentMonthButton}>
                  <Text style={styles.currentMonthText}>이번 달</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.emptySpace} />
          </View>

          {/* Week Days Header */}
          <View style={styles.weekRow}>
            {weekDays.map((day, index) => {
              let color = '#9E9E9E';
              if (index === 0) color = '#FF6B6B';
              else if (index === 6) color = '#4A90D9';
              return (
                <View key={index} style={styles.dayCell}>
                  <Text style={[styles.weekDayText, { color }]}>{day}</Text>
                </View>
              );
            })}
          </View>

          {/* Calendar Days */}
          <View style={styles.daysGrid}>
            {renderCalendarDays()}
          </View>

          {/* Calendar Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>완료</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.legendText}>미완료</Text>
            </View>
          </View>
        </View>

        {/* 5. LEARN BUTTON */}
        <TouchableOpacity style={styles.learnButton} onPress={() => router.replace('/(tabs)/study')}>
          <Text style={styles.learnButtonText}>학습하기 📝</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* EXPIRY NOTIFICATION MODAL */}
      <Modal
        visible={showExpiryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExpiryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>시리얼 만료 안내</Text>
            <Text style={styles.modalMessage}>{expiryMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowExpiryModal(false)}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LOCK COMPLETE MODAL */}
      <Modal
        visible={showLockCompleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLockCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>선택 완료</Text>
            <Text style={styles.modalMessage}>
              {selectedChildName}이(가) 선택되었습니다.{'\n'}
              나머지 자녀는 잠금 처리되었습니다.{'\n'}
              잠금 해제는 시리얼 등록 또는 구독으로 가능합니다.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowLockCompleteModal(false)}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>

      {showLockSelectionModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          elevation: 9999,
        }}>
          <View style={{
            width: '85%',
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>자녀 선택 필요</Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 }}>
              무료회원은 1명만 이용할 수 있습니다.{'\n'}학습할 자녀를 선택해주세요.
            </Text>
            {freeChildren.map((child) => (
              <Pressable
                key={child.id}
                onPress={() => handleSelectChild(child.id, child.name)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: pressed ? '#E0E0E0' : '#F5F5F5',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 8,
                  width: '100%',
                })}
              >
                <Text style={{ fontSize: 32, marginRight: 12 }}>{child.avatar}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{child.name}</Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>{child.grade}학년</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // 1. Profile Header
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  bellIcon: {
    fontSize: 24,
    color: '#9E9E9E',
  },
  // 2. Banner
  banner: {
    height: 120,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  // 3. Stats Card
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  // 4. Calendar Card
  calendarCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowText: {
    fontSize: 18,
    color: '#333333',
    paddingHorizontal: 12,
  },
  monthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  currentMonthButton: {
    marginLeft: 12,
  },
  currentMonthText: {
    fontSize: 12,
    color: '#7ED4C0',
    textDecorationLine: 'underline',
  },
  emptySpace: {
    width: 42,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 264,
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
  },
  todayCircle: {
    backgroundColor: '#7ED4C0',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    backgroundColor: '#E8F8F5',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: '#9E9E9E',
    marginLeft: 4,
  },
  // 5. Learn Button
  learnButton: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#7ED4C0',
    borderRadius: 16,
    paddingVertical: 18,
  },
  learnButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#7ED4C0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childrenList: {
    width: '100%',
    gap: 12,
  },
  childButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  childAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  childGrade: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
});
