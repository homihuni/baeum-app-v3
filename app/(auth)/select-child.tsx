import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

export default function SelectChildScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>누가 공부할까요?</Text>
      <Text style={styles.subtitle}>학습할 자녀를 선택하세요</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileCircle}>
          <Text style={styles.profileEmoji}>🍓</Text>
        </View>
        <Text style={styles.profileName}>김배움</Text>
        <Text style={styles.profileInfo}>3학년</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>무료회원</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonPlus}>+</Text>
        <Text style={styles.addButtonText}>프로필 추가</Text>
      </TouchableOpacity>

      <View style={styles.bottomSection}>
        <Text style={styles.parentSettingText}>부모님 설정</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 24,
    width: 140,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 40,
  },
  profileCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7ED4C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 32,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 12,
  },
  profileInfo: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 11,
    color: '#666666',
  },
  addButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9E9E9E',
    borderRadius: 16,
    width: 140,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  addButtonPlus: {
    fontSize: 24,
    color: '#9E9E9E',
  },
  addButtonText: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 4,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  parentSettingText: {
    fontSize: 14,
    color: '#999999',
    textDecorationLine: 'underline',
  },
});
