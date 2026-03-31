import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';

interface SafeLayoutProps {
  children: ReactNode;
  backgroundColor?: string;
  showHeader?: boolean;
  headerTitle?: string;
}

export default function SafeLayout({
  children,
  backgroundColor = '#FFFFFF',
  showHeader,
  headerTitle,
}: SafeLayoutProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 24)
    : insets.top;

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: topPadding, paddingBottom: 0 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} translucent />
      {showHeader && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333333" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333333',
  },
});
