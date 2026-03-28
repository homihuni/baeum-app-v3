import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE = '#5BBFAA';
const INACTIVE = '#B0BEC5';

const TABS = [
  { key: 'home', label: '홈', icon: 'home', iconOutline: 'home-outline', route: '/(tabs)/home' },
  { key: 'study', label: '스터디', icon: 'book', iconOutline: 'book-outline', route: '/(tabs)/study' },
  { key: 'growth', label: '성장', icon: 'star', iconOutline: 'star-outline', route: '/(tabs)/growth' },
  { key: 'menu', label: '전체메뉴', icon: 'menu', iconOutline: 'menu', route: '/(tabs)/menu' },
];

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
      {TABS.map((tab) => {
        const focused = pathname.includes(tab.key);
        return (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => router.replace(tab.route)}>
            <Ionicons name={focused ? tab.icon : tab.iconOutline} size={20} color={focused ? ACTIVE : INACTIVE} />
            <Text style={[styles.label, { color: focused ? ACTIVE : INACTIVE }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D4EDE7',
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
