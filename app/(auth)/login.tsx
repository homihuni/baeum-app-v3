import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GoogleAuthProvider,
  signInWithCredential,
  auth,
  doc,
  getDoc,
  setDoc,
  db,
} from '../../utils/firebase';

WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  // 입력값 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 구글 로그인 설정
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '184542935339-u5fljb9lmisij3vs31favhpqag6u4r15.apps.googleusercontent.com',
    androidClientId: '184542935339-u5fljb9lmisij3vs31favhpqag6u4r15.apps.googleusercontent.com',
    iosClientId: '184542935339-u5fljb9lmisij3vs31favhpqag6u4r15.apps.googleusercontent.com',
    redirectUri: 'https://auth.expo.io/@dknp/bolt-expo-nativewind',
  });

  // 구글 응답 처리
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleCredential(id_token);
      } else {
        setError('구글 인증 토큰을 받지 못했습니다.');
        setLoading(false);
      }
    } else if (response?.type === 'error') {
      setError('구글 로그인 실패: ' + (response.error?.message || '알 수 없는 오류'));
      setLoading(false);
    } else if (response?.type === 'dismiss') {
      setLoading(false);
    }
  }, [response]);

  // Firebase 구글 인증 처리
  const handleGoogleCredential = async (idToken: string) => {
    try {
      setLoading(true);
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      const parentRef = doc(db, 'Parents', user.uid);
      const parentSnap = await getDoc(parentRef);

      if (!parentSnap.exists()) {
        await setDoc(parentRef, {
          uid: user.uid,
          name: user.displayName || '부모님',
          email: user.email || '',
          photoURL: user.photoURL || '',
          loginType: 'google',
          createdAt: new Date().toISOString(),
        });
      }

      await AsyncStorage.setItem('parentId', user.uid);
      await AsyncStorage.setItem('loginType', 'google');
      await AsyncStorage.setItem('parentName', user.displayName || '부모님');
      await AsyncStorage.setItem('parentEmail', user.email || '');

      router.replace('/(auth)/select-child');
    } catch (err: any) {
      console.log('구글 로그인 에러:', err);
      setError('로그인 처리 중 오류: ' + (err.message || '알 수 없는 오류'));
      setLoading(false);
    }
  };

  // 구글 로그인 버튼
  const handleGoogleLogin = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setError('');
      const result = await promptAsync();
      if (result.type !== 'success') {
        setLoading(false);
      }
    } catch (err: any) {
      console.log('promptAsync 에러:', err);
      setError('구글 로그인을 열 수 없습니다.');
      setLoading(false);
    }
  };

  // 이메일 로그인 (임시)
  const handleEmailLogin = async () => {
    if (loading) return;
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await AsyncStorage.setItem('parentId', 'test-parent-001');
      await AsyncStorage.setItem('loginType', 'email');
      await AsyncStorage.setItem('parentEmail', email);
      router.replace('/(auth)/select-child');
    } catch (e) {
      setError('로그인 중 오류가 발생했습니다');
      setLoading(false);
    }
  };

  // 소셜/테스트 로그인
  const handleTestLogin = async (loginType: string) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await AsyncStorage.setItem('parentId', 'test-parent-001');
      await AsyncStorage.setItem('loginType', loginType);
      router.replace('/(auth)/select-child');
    } catch (e) {
      setError('로그인 중 오류가 발생했습니다');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 상단: 캐릭터 배경 이미지 */}
      <ImageBackground
        source={require('../../assets/images/Mobile_app_login_hero.png')}
        style={styles.heroSection}
        resizeMode="cover"
      >
        <SafeAreaView edges={['top']} style={styles.heroSafe} />
      </ImageBackground>

      {/* 하단: 로그인 폼 카드 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.formCard}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 환영 메시지 (한 줄) */}
          <Text style={styles.welcomeText}>
            <Text style={styles.welcomeBrand}>제철배움학습</Text>
            <Text>에 오신 것을 환영합니다!</Text>
          </Text>

          {/* 이메일 입력 */}
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력하세요"
              placeholderTextColor="#BBB"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* 비밀번호 입력 */}
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor="#BBB"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.6 }]}
            onPress={handleEmailLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>

          {/* 에러 메시지 */}
          {error !== '' && (
            <TouchableOpacity
              style={styles.errorBox}
              onPress={() => setError('')}
              activeOpacity={0.8}
            >
              <Text style={styles.errorText}>{error}</Text>
            </TouchableOpacity>
          )}

          {/* 간편 로그인 구분선 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>간편 로그인</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 소셜 로그인 4개: 카카오 / 네이버 / 구글 / 애플 */}
          <View style={styles.socialRow}>
            {/* 카카오 */}
            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => handleTestLogin('kakao')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.socialButton, { backgroundColor: '#FEE500' }]}>
                <Ionicons name="chatbubble" size={24} color="#000" />
              </View>
              <Text style={styles.socialLabel}>카카오</Text>
            </TouchableOpacity>

            {/* 네이버 */}
            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => handleTestLogin('naver')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.socialButton, { backgroundColor: '#03C75A' }]}>
                <Text style={styles.naverN}>N</Text>
              </View>
              <Text style={styles.socialLabel}>네이버</Text>
            </TouchableOpacity>

            {/* 구글 */}
            <TouchableOpacity
              style={styles.socialItem}
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.socialButton, styles.googleBtn]}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.socialLabel}>구글</Text>
            </TouchableOpacity>

            {/* 애플 */}
            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => handleTestLogin('apple')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.socialButton, { backgroundColor: '#000' }]}>
                <Ionicons name="logo-apple" size={26} color="#FFF" />
              </View>
              <Text style={styles.socialLabel}>애플</Text>
            </TouchableOpacity>
          </View>

          {/* 회원가입 링크 */}
          <TouchableOpacity
            style={styles.signupRow}
            onPress={() => router.push('/(auth)/signup')}
            disabled={loading}
          >
            <Text style={styles.signupText}>아직 계정이 없으신가요? </Text>
            <Text style={styles.signupLink}>회원가입 ›</Text>
          </TouchableOpacity>

          {/* 개발 모드 (개발 환경에서만) */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.devNotice}
              onPress={() => handleTestLogin('test')}
              disabled={loading}
            >
              <Text style={styles.devNoticeText}>🛠 개발 모드: 테스트 자동 로그인</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 로딩 오버레이 */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7ED957" />
          <Text style={styles.loadingText}>로그인 중...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  // 상단 캐릭터 영역
  heroSection: {
    height: height * 0.55,
    width: '100%',
  },
  heroSafe: {
    flex: 1,
  },
  // 하단 폼 카드
  formWrapper: {
    flex: 1,
    marginTop: -32,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
    flexGrow: 1,
  },
  welcomeText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  welcomeBrand: {
    color: '#7ED957',
    fontWeight: '700',
    fontSize: 16,
  },
  inputBox: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F7F7F7',
  borderRadius: 12,
  paddingHorizontal: 16,
  marginBottom: 12,
  gap: 10,
  height: 52,
},
input: {
  flex: 1,
  fontSize: 15,
  color: '#333',
  ...Platform.select({
    web: {
      outlineStyle: 'none',
      paddingVertical: 0,
    },
    default: {
      paddingVertical: 0,
    },
  }),
},


  loginButton: {
    backgroundColor: '#7ED957',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7ED957',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: '#FDECEA',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
  },
  // 소셜 로그인 (4개 + 라벨)
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  socialItem: {
    alignItems: 'center',
    gap: 6,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  googleBtn: {
    backgroundColor: '#FFF',
    borderColor: '#EEE',
    borderWidth: 1,
  },
  googleG: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4285F4',
    fontStyle: 'italic',
  },
  naverN: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 13,
    color: '#999',
  },
  signupLink: {
    fontSize: 13,
    color: '#7ED957',
    fontWeight: '600',
  },
  devNotice: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  devNoticeText: {
    fontSize: 12,
    color: '#856404',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7ED957',
    fontWeight: '600',
  },
});
