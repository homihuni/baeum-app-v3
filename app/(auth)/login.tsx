import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const animButtons = useRef(new Animated.Value(0)).current;

  const slide1 = useRef(new Animated.Value(100)).current;
  const slide2 = useRef(new Animated.Value(100)).current;
  const slide3 = useRef(new Animated.Value(100)).current;

  const scale1 = useRef(new Animated.Value(0.3)).current;
  const scale2 = useRef(new Animated.Value(0.3)).current;
  const scale3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(anim1, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.spring(slide1, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.spring(scale1, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(anim2, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.spring(slide2, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.spring(scale2, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(anim3, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.spring(slide3, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.spring(scale3, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      Animated.delay(400),
      Animated.timing(animButtons, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleTestLogin = async (loginType: string) => {
    setLoading(true);
    setError('');
    try {
      await AsyncStorage.setItem('parentId', 'test-parent-001');
      await AsyncStorage.setItem('loginType', loginType);
      router.replace('/(auth)/select-child');
    } catch (e) {
      setError('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <Animated.View style={{ opacity: anim1, transform: [{ translateY: slide1 }, { scale: scale1 }] }}>
          <Image source={require('../../assets/images/logo_jeocheol.png')} style={styles.logoImageSmall} resizeMode="contain" />
        </Animated.View>
        <View style={styles.logoRow}>
          <Animated.View style={{ opacity: anim2, transform: [{ translateY: slide2 }, { scale: scale2 }] }}>
            <Image source={require('../../assets/images/logo_baeum.png')} style={styles.logoImageLarge} resizeMode="contain" />
          </Animated.View>
          <Animated.View style={{ opacity: anim3, transform: [{ translateY: slide3 }, { scale: scale3 }] }}>
            <Image source={require('../../assets/images/logo_chodeung.png')} style={styles.logoImageLarge} resizeMode="contain" />
          </Animated.View>
        </View>
      </View>

      <Animated.View style={[styles.buttonArea, { opacity: animButtons }]}>
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialCircle} onPress={() => handleTestLogin('google')} disabled={loading}>
            <Image source={require('../../assets/images/icon_google.png')} style={styles.socialIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialCircle} onPress={() => handleTestLogin('apple')} disabled={loading}>
            <Image source={require('../../assets/images/icon_apple.png')} style={styles.socialIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialCircle} onPress={() => handleTestLogin('kakao')} disabled={loading}>
            <Image source={require('../../assets/images/icon_kakao.png')} style={styles.socialIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialCircle} onPress={() => handleTestLogin('naver')} disabled={loading}>
            <Image source={require('../../assets/images/icon_naver.png')} style={styles.socialIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {error !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoImageSmall: {
    width: width * 0.45,
    height: height * 0.1,
    marginBottom: -4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImageLarge: {
    width: width * 0.38,
    height: height * 0.12,
  },
  buttonArea: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    alignItems: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  socialIcon: {
    width: 52,
    height: 52,
  },
  errorBox: {
    position: 'absolute',
    bottom: 160,
    backgroundColor: '#FDECEA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '90%',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  devNotice: {
    position: 'absolute',
    bottom: 40,
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
