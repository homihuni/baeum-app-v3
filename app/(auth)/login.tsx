import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>배움학습</Text>

      <TouchableOpacity style={styles.googleButton}>
        <Text style={styles.googleButtonText}>Google로 시작하기</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.appleButton}>
        <Text style={styles.appleButtonText}>Apple로 시작하기</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.testButton}>[테스트] 홈으로 이동</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    color: '#7ED4C0',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 60,
  },
  googleButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginBottom: 16,
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    color: '#9E9E9E',
    fontSize: 12,
    marginTop: 30,
  },
});
