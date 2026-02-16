import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';

export default function SettingsDetailScreen() {
  const router = useRouter();

  useEffect(() => {
    console.log('=== 설정 화면 진입 ===');
  }, []);

  const renderMenuItem = (
    label: string,
    onPress: () => void,
    textColor: string = '#333333',
    iconColor: string = '#999999'
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={[styles.menuText, { color: textColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={iconColor} />
    </TouchableOpacity>
  );

  const renderDivider = () => <View style={styles.divider} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView>
        {/* 섹션 1: 고객센터 */}
        <Text style={styles.sectionHeader}>고객센터</Text>
        {renderMenuItem('자주 묻는 질문', () => console.log('FAQ 클릭'))}
        {renderDivider()}
        {renderMenuItem('1:1 문의 접수', () => console.log('문의 접수 클릭'))}
        {renderDivider()}
        {renderMenuItem('1:1 문의 내역 확인', () => console.log('문의 내역 클릭'))}

        {/* 섹션 2: 알림 */}
        <Text style={styles.sectionHeader}>알림</Text>
        {renderMenuItem('푸시 알림 설정', () => console.log('푸시 알림 설정 클릭'))}

        {/* 섹션 3: 약관 및 정책 */}
        <Text style={styles.sectionHeader}>약관 및 정책</Text>
        {renderMenuItem('이용약관', () => console.log('이용약관 클릭'))}
        {renderDivider()}
        {renderMenuItem('개인정보 처리방침', () => console.log('개인정보 처리방침 클릭'))}
        {renderDivider()}
        {renderMenuItem('운영정책', () => console.log('운영정책 클릭'))}

        {/* 섹션 4: 앱 정보 */}
        <Text style={styles.sectionHeader}>앱 정보</Text>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>앱 버전</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>

        {/* 섹션 5: 계정 */}
        <View style={styles.accountSection}>
          <Text style={styles.withdrawWarning}>
            배움학습을 탈퇴하면 동일한 계정으로 재가입 및 접속이 불가능합니다.
          </Text>
          {renderMenuItem('회원탈퇴', () => console.log('회원탈퇴 클릭'), '#FF4444', '#FF4444')}
        </View>

        {/* 섹션 6: 로그아웃 */}
        <View style={styles.logoutSection}>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => console.log('로그아웃 클릭')}
          >
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSpacer: {
    width: 32,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444444',
    paddingLeft: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    color: '#333333',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  versionText: {
    fontSize: 15,
    color: '#888888',
  },
  accountSection: {
    paddingTop: 30,
  },
  withdrawWarning: {
    fontSize: 13,
    color: '#999999',
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 18,
  },
  logoutSection: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    paddingVertical: 14,
    marginHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555555',
    textAlign: 'center',
  },
});
