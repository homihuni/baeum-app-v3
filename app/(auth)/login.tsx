import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const TEXT_HEIGHT = width * 0.5;

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const textSlide = useRef(new Animated.Value(TEXT_HEIGHT)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(500),
      Animated.spring(textSlide, { toValue: 0, friction: 7, tension: 35, useNativeDriver: true }),
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
      <Image
        source={require('../../assets/images/login_bg.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      <View style={styles.textMask}>
        <Animated.View style={{ transform: [{ translateY: textSlide }] }}>
          <Image
            source={require('../../assets/images/login_text.png')}
            style={styles.textImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <View style={styles.buttonArea}>
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialTouch} onPress={() => handleTestLogin('google')} disabled={loading} />
          <TouchableOpacity style={styles.socialTouch} onPress={() => handleTestLogin('apple')} disabled={loading} />
          <TouchableOpacity style={styles.socialTouch} onPress={() => handleTestLogin('kakao')} disabled={loading} />
          <TouchableOpacity style={styles.socialTouch} onPress={() => handleTestLogin('naver')} disabled={loading} />
        </View>
      </View>

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
  },
  bgImage: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  textMask: {
    position: 'absolute',
    top: height * 0.12,
    left: 24,
    width: width * 0.7,
    height: TEXT_HEIGHT,
    overflow: 'hidden',
  },
  textImage: {
    width: width * 0.7,
    height: TEXT_HEIGHT,
  },
  buttonArea: {
    position: 'absolute',
    bottom: height * 0.12,
    width: '100%',
    alignItems: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialTouch: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  errorBox: {
    position: 'absolute',
    bottom: height * 0.22,
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
