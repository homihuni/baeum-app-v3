import { View, Text, StyleSheet } from 'react-native';

export default function CreateProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>자녀 프로필 만들기</Text>
      <Text style={styles.subtitle}>준비 중입니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#999999',
  },
});
