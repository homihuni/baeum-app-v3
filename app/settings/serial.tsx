import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import BottomTabBar from '../../components/BottomTabBar';
import { useRouter } from 'expo-router';

export default function SerialScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.messageText}>준비 중입니다</Text>
      </View>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
