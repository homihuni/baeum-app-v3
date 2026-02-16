import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { testLogin } from '../../utils/testAuth';
import { getChildren } from '../../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const parent = await testLogin();
      await AsyncStorage.setItem('parentId', parent.parentId);
      await AsyncStorage.setItem('parentName', parent.name);
      await AsyncStorage.setItem('parentEmail', parent.email);

      const children = await getChildren(parent.parentId);

      if (children.length === 0) {
        router.replace('/(auth)/create-profile');
      } else if (children.length === 1) {
        await AsyncStorage.setItem('childId', children[0].id);
        await AsyncStorage.setItem('childName', (children[0] as any).name);
        await AsyncStorage.setItem('childGrade', String((children[0] as any).grade));
        await AsyncStorage.setItem('childTier', (children[0] as any).tier);
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/select-child');
      }
    } catch (error: any) {
      Alert.alert('로그인 실패', '네트워크를 확인해주세요.\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>배움학습</Text>
        <Text style={styles.subtitle}>초등학생을 위한 학습 앱</Text>
        <TouchableOpacity style={styles.googleBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#333" /> : <Text style={styles.googleText}>Google로 시작하기</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.appleBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.appleText}>Apple로 시작하기</Text>}
        </TouchableOpacity>
        <Text style={styles.terms}>로그인 시 이용약관 및 개인정보처리방침에 동의합니다.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#7ED4C0', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666666', marginBottom: 48 },
  googleBtn: { width: '100%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  googleText: { fontSize: 16, color: '#333333' },
  appleBtn: { width: '100%', backgroundColor: '#000000', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  appleText: { fontSize: 16, color: '#FFFFFF' },
  terms: { fontSize: 12, color: '#9E9E9E', marginTop: 24, textAlign: 'center' },
});
