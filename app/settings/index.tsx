import { View, Text, StyleSheet } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import BottomTabBar from '../../components/BottomTabBar';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeLayout showHeader headerTitle="설정">
      <View style={styles.content}>
        <Text style={styles.messageText}>준비 중입니다</Text>
      </View>
      <BottomTabBar />
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
});
