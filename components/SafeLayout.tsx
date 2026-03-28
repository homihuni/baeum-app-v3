import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export default function SafeLayout({ children, backgroundColor = '#FFFFFF' }: SafeLayoutProps) {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 48)
    : insets.top;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor,
        paddingTop: topPadding,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
      }
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} translucent={true} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
