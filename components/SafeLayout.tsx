import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export default function SafeLayout({ children, backgroundColor = '#FFFFFF' }: SafeLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
