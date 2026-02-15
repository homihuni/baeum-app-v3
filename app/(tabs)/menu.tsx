import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

export default function MenuScreen() {
  const menuItems = [
    { icon: '👶', label: '자녀 관리' },
    { icon: '⭐', label: '등급 관리' },
    { icon: '🔑', label: '시리얼번호 입력' },
    { icon: '💎', label: '구독 관리' },
    { icon: '📊', label: '학습 리포트' },
    { icon: '🔔', label: '알림 설정' },
    { icon: '💬', label: '1:1 문의' },
    { icon: '📢', label: '공지사항' },
    { icon: '📋', label: '이용약관' },
    { icon: '🔒', label: '개인정보처리방침' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.profileSection}>
          <Text style={styles.profileName}>🍓 김배움의 부모님</Text>
          <Text style={styles.profileEmail}>dknp10@gmail.com</Text>
        </View>

        {menuItems.map((item, index) => (
          <View key={index} style={styles.menuItem}>
            <Text style={styles.menuText}>
              {item.icon}  {item.label}
            </Text>
          </View>
        ))}

        <View style={styles.menuItem}>
          <View style={styles.versionRow}>
            <Text style={styles.menuText}>ℹ️  앱 버전</Text>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.deleteText}>🚪  회원탈퇴</Text>
        </View>
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
