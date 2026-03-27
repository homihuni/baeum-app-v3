import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const animButtons = useRef(new Animated.Value(0)).current;

  const slide1 = useRef(new Animated.Value(40)).current;
  const slide2 = useRef(new Animated.Value(40)).current;
  const slide3 = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(anim1, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slide1, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(anim2, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slide2, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(anim3, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slide3, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.timing(animButtons, { toValue: 1, duration: 400, useNativeDriver: true }),
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
        <Animated.View style={{ opacity: anim1, transform: [{ translateY: slide1 }] }}>
          <Image source={require('../../assets/images/logo_jeocheol.png')} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>
        <Animated.View style={{ opacity: anim2, transform: [{ translateY: slide2 }] }}>
          <Image source={require('../../assets/images/logo_baeum.png')} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>
        <Animated.View style={{ opacity: anim3, transform: [{ translateY: slide3 }] }}>
          <Image source={require('../../assets/images/logo_chodeung.png')} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>
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
    marginBottom: 60,
  },
  logoImage: {
    width: width * 0.5,
    height: 80,
    marginBottom: 4,
  },
  buttonArea: {
    width: '100%',
    alignItems: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  socialIcon: {
    width: 56,
    height: 56,
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: '#FDECEA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
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
