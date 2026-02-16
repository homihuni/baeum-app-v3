import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(2);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const completedDays = [2, 5, 10];
  const missedDays = [3, 9];

  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const previousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const todayDate = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();
    const isCurrentMonth = currentYear === todayYear && currentMonth === todayMonth;

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (firstDay + day - 1) % 7;
      const isToday = isCurrentMonth && day === todayDate;
      const isSelected = day === selectedDate && !isToday;
      const hasCompleted = completedDays.includes(day);
      const hasMissed = missedDays.includes(day);

      let textColor = '#333333';
      if (dayOfWeek === 0) textColor = '#FF6B6B'; // Sunday
      else if (dayOfWeek === 6) textColor = '#4A90D9'; // Saturday

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
          {(hasCompleted || hasMissed) && !isToday && (
            <View style={[styles.dot, { backgroundColor: hasCompleted ? '#4CAF50' : '#FF6B6B' }]} />
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 1. PROFILE HEADER BAR */}
        <View style={styles.profileHeader}>
          <View style={styles.profileLeft}>
            <Text style={styles.profileEmoji}>🍓</Text>
            <Text style={styles.profileName}>김배움</Text>
          </View>
          <View style={styles.profileRight}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>무료회원</Text>
            </View>
            <Text style={styles.bellIcon}>🔔</Text>
          </View>
        </View>

        {/* 2. BANNER AREA */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>배움학습 소식</Text>
          <Text style={styles.bannerSubtitle}>매일 학습하고 성장해요!</Text>
        </View>

        {/* 3. MONTHLY STATS ROW */}
        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>월별 학습</Text>
            <Text style={[styles.statValue, { color: '#7ED4C0' }]}>1일</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>연속 학습</Text>
            <Text style={[styles.statValue, { color: '#FF6B6B' }]}>0일</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>문제 수</Text>
            <Text style={[styles.statValue, { color: '#87CEEB' }]}>3개</Text>
          </View>
        </View>

        {/* 4. CALENDAR */}
        <View style={styles.calendarCard}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={previousMonth}>
              <Text style={styles.arrowText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{currentYear}년 {currentMonth}월</Text>
            <TouchableOpacity onPress={nextMonth}>
              <Text style={styles.arrowText}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={styles.weekRow}>
            {weekDays.map((day, index) => {
              let color = '#9E9E9E';
              if (index === 0) color = '#FF6B6B'; // Sunday
              else if (index === 6) color = '#4A90D9'; // Saturday
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
        </View>

        {/* 5. SELECTED DATE STATS */}
        <View style={styles.dateStatsCard}>
          <Text style={styles.dateStatsTitle}>오늘의 학습</Text>
          <Text style={styles.dateStatsText}>남은 문제: 3문제</Text>
          <Text style={styles.dateStatsText}>이번 달 학습일: 5일</Text>
          <Text style={[styles.dateStatsText, { color: '#7ED4C0' }]}>학습 결과: 2일 100점, 1일 80점</Text>
        </View>

        {/* 6. LEARN BUTTON */}
        <TouchableOpacity style={styles.learnButton} onPress={() => router.push('/study/questions')}>
          <Text style={styles.learnButtonText}>학습하기 📝</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  profileRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#7ED4C0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    fontSize: 12,
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
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
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
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
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
  // 5. Date Stats Card
  dateStatsCard: {
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
  dateStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  dateStatsText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  // 6. Learn Button
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
});
