import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Alert, Animated, Image, Linking, Dimensions, ImageSourcePropType } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { checkSerialExpiry } from '../../utils/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { resolveAvatar } from '../../utils/avatars';
import { SUBJECT_ICONS, SUBJECT_LABELS } from '../../utils/subjects';
import { wp, SCREEN_WIDTH } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';

// 배너/카드 좌우 여백: 화면 폭의 5% (375px 기준 약 19px, 태블릿에서 비례 확대)
const BANNER_MARGIN = wp(5);
type SubjectKey = keyof typeof SUBJECT_ICONS;

const getSubjectsForGrade = (grade: number): SubjectKey[] => {
  if (grade <= 2) return ['korean', 'math', 'integrated'];
  return ['korean', 'math', 'science', 'social', 'english'];
};

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [childTier, setChildTier] = useState('free');
  const [childAvatar, setChildAvatar] = useState<ImageSourcePropType>(require('../../assets/images/avatar_01.png'));
  const [studyDays, setStudyDays] = useState<Set<number>>(new Set());
  const [totalProblems, setTotalProblems] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [accessDays, setAccessDays] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [todaySubjects, setTodaySubjects] = useState<Set<string>>(new Set());
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiryMessage, setExpiryMessage] = useState('');
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const bannerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const characters = ['학', '습', '하', '기', ' 🏆'];
  const charAnims = useRef(characters.map(() => new Animated.Value(0))).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const TIER_LABELS: Record<string, string> = { free: '무료회원', baeum: '배움회원', sky: '스카이회원' };
  const TIER_COLORS: Record<string, string> = { free: '#E0E0E0', baeum: '#4ECDC4', sky: '#87CEEB' };
  const TIER_TEXT_COLORS: Record<string, string> = { free: '#666666', baeum: '#FFFFFF', sky: '#333333' };
  const MEMBER_TEXT_COLORS: Record<string, string> = { free: '#666666', baeum: '#E978A2', sky: '#55A9D8' };

  useEffect(() => {
    loadChildData();
    loadBanners();

    const animation = Animated.loop(
      Animated.sequence([
        Animated.stagger(
          300,
          charAnims.map(anim =>
            Animated.timing(anim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            })
          )
        ),
        Animated.delay(500),
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.parallel(
          charAnims.map(anim =>
            Animated.timing(anim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          )
        ),
        Animated.delay(300),
      ])
    );
    animation.start();
    return () => animation.stop();
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
          if (childData.avatar) setChildAvatar(resolveAvatar(childData.avatar));
          if (childData.name) setChildName(childData.name);
        }
      }
    } catch (error) {
      console.log('Load child data error:', error);
    }
  };

  const loadBanners = async () => {
    try {
      const bannersRef = collection(db, 'Banners');
      const snapshot = await getDocs(bannersRef);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const activeBanners = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((banner: any) => {
          return (
            banner.isActive === true &&
            banner.startDate <= todayStr &&
            banner.endDate >= todayStr
          );
        })
        .sort((a: any, b: any) => a.order - b.order);

      setBanners(activeBanners);

      if (activeBanners.length > 0) {
        startBannerAutoScroll(activeBanners.length);
      }
    } catch (error) {
      console.log('Load banners error:', error);
    }
  };

  const startBannerAutoScroll = (totalBanners: number) => {
    if (bannerIntervalRef.current) {
      clearInterval(bannerIntervalRef.current);
    }
    if (totalBanners <= 1) return;
    bannerIntervalRef.current = setInterval(() => {
      setCurrentBannerIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % totalBanners;
        const screenWidth = Dimensions.get('window').width;
        const bannerWidth = screenWidth - 2 * BANNER_MARGIN;
        scrollViewRef.current?.scrollTo({ x: nextIndex * bannerWidth, animated: true });
        return nextIndex;
      });
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }
    };
  }, []);

  const handleBannerPress = (banner: any) => {
    if (banner.linkType === 'url') {
      Linking.openURL(banner.linkValue);
    } else if (banner.linkType === 'screen') {
      router.push(banner.linkValue);
    }
  };

  const handleBannerScroll = (event: any) => {
    const screenWidth = Dimensions.get('window').width;
    const bannerWidth = screenWidth - 2 * BANNER_MARGIN;
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / bannerWidth);
    setCurrentBannerIndex(index);
  };

  useEffect(() => {
    checkExpiry();
    loadMonthlyData();
    refreshChildAvatar();
  }, [currentYear, currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadChildData();
      loadMonthlyData();
      refreshChildAvatar();
    }, [])
  );

  const checkExpiry = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) return;

      const result = await checkSerialExpiry(parentId);

      if (result.hasExpired) {
        if (result.expiredChildren.length === 1) {
          setExpiryMessage(
            result.expiredChildren[0] + '의 시리얼이 만료되었습니다.\n새 시리얼을 등록하거나 스카이회원으로 업그레이드해주세요.'
          );
        } else {
          setExpiryMessage(
            result.expiredChildren.join(', ') + '의 시리얼이 만료되었습니다.\n새 시리얼을 등록하거나 스카이회원으로 업그레이드해주세요.'
          );
        }
        setShowExpiryModal(true);
      }

      const currentChildId = await AsyncStorage.getItem('childId');
      if (result.expiredList && result.expiredList.some(c => c.id === currentChildId)) {
        const childrenRef = collection(db, 'Parents', parentId, 'Children');
        const snap = await getDocs(childrenRef);
        let freeChild: { id: string; name: string } | null = null;
        snap.forEach((childDoc) => {
          const data = childDoc.data();
          if (data.isDeleted !== true && data.tier === 'free' && data.isLocked !== true && !freeChild) {
            freeChild = { id: childDoc.id, name: data.name || '자녀' };
          }
        });
        if (freeChild) {
          await AsyncStorage.setItem('childId', (freeChild as { id: string; name: string }).id);
          await AsyncStorage.setItem('childName', (freeChild as { id: string; name: string }).name);
          loadChildData();
          loadMonthlyData();
          refreshChildAvatar();
        }
      }
    } catch (error) {
      console.log('시리얼 만료 체크 오류:', error);
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
          if (childData.avatar) setChildAvatar(resolveAvatar(childData.avatar));
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
      const todaySubjectSet = new Set<string>();
      const now = new Date();
      const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
      const kstDate = new Date(kstTime);
      const todayStr = kstDate.getUTCFullYear() + '-' + String(kstDate.getUTCMonth() + 1).padStart(2, '0') + '-' + String(kstDate.getUTCDate()).padStart(2, '0');
      let problems = 0;
      let correct = 0;
      let totalScore = 0;
      let scoreCount = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const day = parseInt(data.date.split('-')[2]);
        daysSet.add(day);
        if (data.date === todayStr && data.subject) {
          todaySubjectSet.add(data.subject);
        }
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
      setTodaySubjects(todaySubjectSet);
      setMonthlyAverage(scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0);
    } catch (error) {
      console.log('Load error:', error);
    }
  };

  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const todayYear = new Date().getFullYear();
  const todayMonth = new Date().getMonth() + 1;
  const isCurrentMonth = currentYear === todayYear && currentMonth === todayMonth;

  const previousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    setCurrentYear(todayYear);
    setCurrentMonth(todayMonth);
  };

  const renderCalendarDays = () => {
    const days = [];
    const todayDate = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();
    const isViewingCurrentMonth = currentYear === todayYear && currentMonth === todayMonth;

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-start-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (firstDay + day - 1) % 7;
      const isToday = isViewingCurrentMonth && day === todayDate;
      const isSelected = day === selectedDate && !isToday;
      const hasCompleted = studyDays.has(day);
      const hasMissed = isViewingCurrentMonth && day < todayDate && !studyDays.has(day);

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
            <Text style={[styles.dayText, { color: isToday ? '#FFFFFF' : textColor }]}>
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
  const gradeNumber = Number(childGrade) || 1;
  const missionSubjects = getSubjectsForGrade(gradeNumber);
  const completedMissionCount = missionSubjects.filter((subjectKey) => todaySubjects.has(subjectKey)).length;
  const mondayOffset = (today.getDay() + 6) % 7;
  const weekStampDays = ['월', '화', '수', '목', '금', '토', '일'].map((label, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset + index);
    return {
      label,
      day: date.getDate(),
      isCurrentMonth: date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth,
      isToday: date.toDateString() === today.toDateString(),
    };
  });

  return (
    <SafeLayout backgroundColor="#FFFDF7">
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.homeContent}
      >
        <View style={styles.topTitleRow}>
          <View style={styles.topTitleSpacer} />
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={23} color="#147B60" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroProfile}>
          <Image source={childAvatar} style={styles.heroAvatar} />
          <View style={styles.heroTextBox}>
            <Text style={styles.heroGreeting}>
              <Text style={styles.heroName}>{childName || '학생'}</Text> 님, 반가워요!
            </Text>
            <Text style={styles.heroSubText}>오늘도 즐겁게 배워볼까요?</Text>
          </View>
        </View>

        <View style={styles.heroBadgeRow}>
          <View style={styles.gradePill}>
            <Text style={styles.gradePillText}>{gradeNumber}학년</Text>
          </View>
          <View style={styles.memberPill}>
            <Text style={[styles.memberPillText, { color: MEMBER_TEXT_COLORS[childTier] || '#666666' }]}>
              {TIER_LABELS[childTier] || '무료회원'}
            </Text>
          </View>
        </View>

        <View style={styles.missionCard}>
          <View style={styles.missionLeft}>
            <Text style={styles.missionRibbon}>오늘의 배움 미션</Text>
            <Text style={styles.missionTitle}>오늘의 {missionSubjects.length}과목 미션을 완료해보세요!</Text>
            <Text style={styles.missionProgress}>
              <Text style={styles.missionProgressNumber}>{completedMissionCount}</Text>
              {' / '}{missionSubjects.length} 과목 완료
            </Text>
            <TouchableOpacity style={styles.missionButton} onPress={() => router.replace('/(tabs)/study')}>
              <Text style={styles.missionButtonText}>학습하기 〉</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.missionSubjects}>
            {missionSubjects.map((subjectKey) => (
              <View key={subjectKey} style={styles.missionSubjectItem}>
                <Image source={SUBJECT_ICONS[subjectKey]} style={styles.missionSubjectIcon} />
                <Text style={styles.missionSubjectLabel}>{SUBJECT_LABELS[subjectKey]}</Text>
                {todaySubjects.has(subjectKey) ? (
                  <View style={styles.missionStamp}>
                    <Text style={styles.missionStampText}>참잘했어요</Text>
                  </View>
                ) : (
                  <View style={styles.missionPending} />
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.weekCard}>
          <Text style={styles.sectionTitle}>이번 주 별 스탬프</Text>
          <View style={styles.weekStampBox}>
            {weekStampDays.map((item) => (
              <View key={item.label} style={[styles.weekStampItem, item.isToday && styles.weekStampToday]}>
                <Text style={styles.weekStampLabel}>{item.label}</Text>
                <Text style={[styles.weekStampStar, item.isCurrentMonth && studyDays.has(item.day) && styles.weekStampDone]}>
                  {item.isCurrentMonth && studyDays.has(item.day) ? '★' : '☆'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>이번 달 학습 요약</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryColumn}>
                <Text style={styles.summaryLabel}>학습한 날</Text>
                <Text style={styles.summaryValue}>{accessDays}<Text style={styles.summaryUnit}>일</Text></Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryColumn}>
                <Text style={styles.summaryLabel}>완료한 미션</Text>
                <Text style={styles.summaryValue}>{totalProblems}<Text style={styles.summaryUnit}>개</Text></Text>
              </View>
            </View>
            <TouchableOpacity style={styles.summaryMessage} onPress={() => router.push('/(tabs)/growth')}>
              <Text style={styles.summaryMessageText}>⭐ 이번달 성장 보러가기 〉</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarCard}>
            <Text style={styles.sectionTitle}>학습 캘린더</Text>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={previousMonth}>
                <Text style={styles.arrowText}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{currentMonth}월</Text>
              <TouchableOpacity onPress={nextMonth} disabled={isCurrentMonth}>
                <Text style={[styles.arrowText, isCurrentMonth && { color: '#D0D0D0' }]}>{'>'}</Text>
              </TouchableOpacity>
            </View>

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

            <View style={styles.daysGrid}>
              {renderCalendarDays()}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* EXPIRY NOTIFICATION MODAL */}
      <Modal visible={showExpiryModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>시리얼 만료 안내</Text>
            <Text style={styles.modalMessage}>{expiryMessage}</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#4ECDC4', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, marginTop: 16, width: '100%', alignItems: 'center' }}
              onPress={() => {
                setShowExpiryModal(false);
                router.push('/serial/enter');
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>새 시리얼 등록</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 12, paddingVertical: 10 }}
              onPress={() => setShowExpiryModal(false)}
            >
              <Text style={{ color: '#999', fontSize: 14 }}>나중에 하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  homeContent: {
    paddingBottom: 24,
  },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BANNER_MARGIN,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFDF7',
  },
  topTitleSpacer: {
    width: 32,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDF2EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B5F',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BANNER_MARGIN,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFDF7',
  },
  heroAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: '#B8D8BC',
    marginRight: 16,
  },
  heroTextBox: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 19,
    color: '#1F2A24',
    marginBottom: 8,
  },
  heroName: {
    fontWeight: 'bold',
  },
  heroSubText: {
    fontSize: 14,
    color: '#1F2A24',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: BANNER_MARGIN,
    paddingBottom: 20,
    backgroundColor: '#FFFDF7',
  },
  gradePill: {
    borderWidth: 1,
    borderColor: '#DDEBD5',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#FBFCF6',
  },
  gradePillText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E8D66',
  },
  memberPill: {
    borderWidth: 1,
    borderColor: '#E7E2D8',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#FFFDF9',
  },
  memberPillText: {
    fontSize: 14,
    color: '#1F2A24',
  },
  // 1. Profile Header — paddingHorizontal: BANNER_MARGIN (반응형)
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: BANNER_MARGIN,
    paddingVertical: 12,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  // 2. Banner — marginHorizontal: BANNER_MARGIN (반응형)
  missionCard: {
    flexDirection: 'row',
    marginHorizontal: BANNER_MARGIN,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#F7FBF2',
    borderWidth: 1,
    borderColor: '#DDEBD5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  missionLeft: {
    flex: 1,
    paddingRight: 10,
  },
  missionRibbon: {
    alignSelf: 'flex-start',
    backgroundColor: '#4FA37C',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 12,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2A24',
    lineHeight: 26,
    marginBottom: 10,
  },
  missionProgress: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2A24',
    marginBottom: 12,
  },
  missionProgressNumber: {
    fontSize: 26,
    color: '#4FA37C',
  },
  missionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E7E2D8',
  },
  missionButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2A24',
  },
  missionSubjects: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  missionSubjectItem: {
    width: 64,
    alignItems: 'center',
    marginBottom: 6,
  },
  missionSubjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 4,
  },
  missionSubjectLabel: {
    fontSize: 11,
    color: '#333333',
    textAlign: 'center',
  },
  missionStamp: {
    marginTop: 5,
    borderWidth: 1.5,
    borderColor: '#FF9AA8',
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: '#FFF6F7',
    transform: [{ rotate: '-6deg' }],
  },
  missionStampText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#F26B7A',
  },
  missionPending: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#8BCBB4',
    marginTop: 7,
  },
  weekCard: {
    marginHorizontal: BANNER_MARGIN,
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE6DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2A24',
    marginBottom: 12,
  },
  weekStampBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1E9DF',
    overflow: 'hidden',
  },
  weekStampItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  weekStampToday: {
    backgroundColor: '#EEF7EE',
  },
  weekStampLabel: {
    fontSize: 12,
    color: '#1F2A24',
    marginBottom: 6,
  },
  weekStampStar: {
    fontSize: 28,
    color: '#D9CEC2',
  },
  weekStampDone: {
    color: '#F7A928',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: BANNER_MARGIN,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE6DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  summaryColumn: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#1F2A24',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#4FA37C',
  },
  summaryUnit: {
    fontSize: 18,
  },
  summaryDivider: {
    width: 1,
    height: 46,
    backgroundColor: '#EADFD4',
    marginHorizontal: 12,
  },
  summaryMessage: {
    backgroundColor: '#F4F7ED',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  summaryMessageText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3E8D66',
  },
  banner: {
    height: 90,
    marginHorizontal: BANNER_MARGIN,
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
  bannerContainer: {
    marginHorizontal: BANNER_MARGIN,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  // 배너 이미지 폭: BANNER_MARGIN 기준으로 동적 계산
  bannerImage: {
    width: SCREEN_WIDTH - 2 * BANNER_MARGIN,
    height: ((SCREEN_WIDTH - 2 * BANNER_MARGIN) * 280) / 720,
    borderRadius: 12,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // 3. Stats Card — marginHorizontal: BANNER_MARGIN (반응형)
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: BANNER_MARGIN,
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
  // 4. Calendar Card — marginHorizontal: BANNER_MARGIN (반응형)
  calendarCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE6DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  currentMonthButton: {
    marginLeft: 10,
  },
  currentMonthText: {
    fontSize: 11,
    color: '#7ED4C0',
    textDecorationLine: 'underline',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
  },
  todayCircle: {
    backgroundColor: '#7ED4C0',
    borderRadius: 18,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    backgroundColor: '#E8F8F5',
    borderRadius: 18,
    width: 32,
    height: 32,
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
    marginTop: 12,
    marginBottom: 4,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#9E9E9E',
    marginLeft: 4,
  },
  // 5. Learn Button — paddingHorizontal: BANNER_MARGIN (반응형)
  learnButtonContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: BANNER_MARGIN,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  learnButton: {
    backgroundColor: '#7ED4C0',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
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
    lineHeight: 22,
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
