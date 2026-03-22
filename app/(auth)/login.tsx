import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../utils/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const googleProvider = new GoogleAuthProvider();

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const parentRef = doc(db, 'Parents', user.uid);
      const parentDoc = await getDoc(parentRef);

      if (!parentDoc.exists()) {
        await setDoc(parentRef, {
          email: user.email || '',
          name: user.displayName || '',
          loginType: 'google',
          tier: 'free',
          maxChildren: 5,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          notificationSettings: {
            marketing: false,
            nightMarketing: false,
            notice: true,
            payment: true,
          },
        });
      } else {
        await setDoc(parentRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      }

      await AsyncStorage.setItem('parentId', user.uid);

      setLoading(false);
      router.replace('/(auth)/select-child');
    } catch (err: any) {
      console.log('Google 로그인 실패:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError(null);
      } else if (err.code === 'auth/popup-blocked') {
        setError('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
      } else {
        setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      }
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <Text style={styles.title}>배움학습</Text>
          <Text style={styles.subtitle}>초등학생을 위한 학습 앱</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#333333" />
            ) : (
              <Text style={styles.googleButtonText}>Google로 시작하기</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.appleButton, styles.buttonDisabled]} disabled={true}>
            <Text style={styles.appleButtonText}>Apple로 시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.kakaoButton, styles.buttonDisabled]} disabled={true}>
            <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.naverButton, styles.buttonDisabled]} disabled={true}>
            <Text style={styles.naverButtonText}>네이버로 시작하기</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            로그인 시 이용약관 및 개인정보처리방침에 동의합니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#7ED4C0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999999',
  },
  buttonArea: {
    gap: 12,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  kakaoButtonText: {
    color: '#191919',
    fontSize: 16,
    fontWeight: '600',
  },
  naverButton: {
    backgroundColor: '#03C75A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  naverButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  terms: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 12,
  },
});
