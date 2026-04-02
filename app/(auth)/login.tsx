import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  Animated, Dimensions, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GoogleAuthProvider, signInWithCredential, auth,
  doc, getDoc, setDoc, db
} from '../../utils/firebase';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');
const LINE1 = ['제', '철'];
const LINE2 = ['배', '움', '초', '등'];
const ALL_CHARS = [...LINE1, ...LINE2];

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const charAnims = useRef(ALL_CHARS.map(() => new Animated.Value(0))).current;
  const charScales = useRef(ALL_CHARS.map(() => new Animated.Value(0))).current;

  // ✅ redirectUri 정확히 설정
  const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: '184542935339-u5fljb9lmisij3vs31favhpqag6u4r15.apps.googleusercontent.com',
  androidClientId: '184542935339-u5fljb9lmisij3vs31favhpqag6u4r15.apps.googleusercontent.com',
  iosClientId: '184542935339-u5fljb9lmisij3vs31favhpqag6u4r15.apps.googleusercontent.com',
  redirectUri: 'https://auth.expo.io/@dknp/bolt-expo-nativewind',
});


  // 구글 로그인 응답 처리
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

  // 텍스트 애니메이션
  useEffect(() => {
    const animations = ALL_CHARS.map((_, index) =>
      Animated.sequence([
        Animated.delay(index * 120),
        Animated.parallel([
          Animated.spring(charScales[index], {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(charAnims[index], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel(animations),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(2000),
          ...ALL_CHARS.map((_, i) =>
            Animated.sequence([
              Animated.timing(charScales[i], {
                toValue: 1.08,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.spring(charScales[i], {
                toValue: 1,
                friction: 4,
                tension: 80,
                useNativeDriver: true,
              }),
            ])
          ),
        ])
      ).start();
    });
  }, []);

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

  const renderChar = (char: string, index: number) => (
    <Animated.Text
      key={index}
      style={[
        styles.titleChar,
        {
          opacity: charAnims[index],
          transform: [
            { scale: charScales[index] },
            {
              translateY: charAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            },
          ],
        },
      ]}
    >
      {char}
    </Animated.Text>
  );

  return (
    <View style={styles.container}>

      {/* 배경 이미지 */}
      <Image
        source={require('../../assets/images/login_bg.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* 애니메이션 타이틀 */}
      <View style={styles.titleArea}>
        <View style={styles.titleRow}>
          {LINE1.map((char, index) => renderChar(char, index))}
        </View>
        <View style={styles.titleRow}>
          {LINE2.map((char, index) => renderChar(char, LINE1.length + index))}
        </View>
      </View>

      {/* ✅ 소셜 버튼 — 투명 오버레이 (이미지 파일 불필요) */}
      <View style={styles.buttonArea}>
        {/* 구글 */}
        <TouchableOpacity
          style={styles.socialTouch}
          onPress={handleGoogleLogin}
          disabled={loading}
          activeOpacity={0.7}
        />
        {/* 애플 */}
        <TouchableOpacity
          style={styles.socialTouch}
          onPress={() => handleTestLogin('apple')}
          disabled={loading}
          activeOpacity={0.7}
        />
        {/* 카카오 */}
        <TouchableOpacity
          style={styles.socialTouch}
          onPress={() => handleTestLogin('kakao')}
          disabled={loading}
          activeOpacity={0.7}
        />
        {/* 네이버 */}
        <TouchableOpacity
          style={styles.socialTouch}
          onPress={() => handleTestLogin('naver')}
          disabled={loading}
          activeOpacity={0.7}
        />
      </View>

      {/* ✅ 로딩 오버레이 — pointerEvents="none" 으로 터치 차단 없음 */}
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#7ED4C0" />
          <Text style={styles.loadingText}>로그인 중...</Text>
        </View>
      )}

      {/* 에러 메시지 — 탭하면 닫힘 */}
      {error !== '' && (
        <TouchableOpacity
          style={styles.errorBox}
          onPress={() => setError('')}
          activeOpacity={0.8}
        >
          <Text style={styles.errorText}>{error}  (탭하여 닫기)</Text>
        </TouchableOpacity>
      )}

      {/* 개발 모드 안내 */}
      <View style={styles.devNotice}>
        <Text style={styles.devNoticeText}>개발 모드: 테스트 자동 로그인</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  titleArea: {
    position: 'absolute',
    top: height * 0.08,
    alignSelf: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleChar: {
    fontSize: width * 0.22,
    fontWeight: '900',
    color: '#7ED4C0',
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 2, height: 4 },
    textShadowRadius: 6,
    marginHorizontal: 2,
    letterSpacing: -2,
  },
  buttonArea: {
    position: 'absolute',
    bottom: height * 0.16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  // ✅ 투명 오버레이 버튼 — 배경 이미지의 버튼 위치에 맞게 조정
  socialTouch: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7ED4C0',
    fontWeight: '600',
  },
  errorBox: {
    position: 'absolute',
    bottom: height * 0.28,
    left: 20,
    right: 20,
    backgroundColor: '#FDECEA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  devNotice: {
    position: 'absolute',
    bottom: 40,
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
});
