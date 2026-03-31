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
{ key: 'menu', label: '전체메뉴', icon: 'grid', iconOutline: 'grid-outline', route: '/(tabs)/menu' },
];

// 설정/공지 등 하위 페이지는 전체메뉴 탭을 활성화
const MENU_SUB_PATHS = ['/settings', '/children', '/study/', '/growth/'];

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (key: string) => {
    if (key === 'menu') {
      return pathname.includes('menu') || MENU_SUB_PATHS.some(p => pathname.startsWith(p));
    }
    return pathname.includes(key);
  };

  return (
    <View style={[styles.container, {
      height: 56 + insets.bottom,
      paddingBottom: insets.bottom,
    }]}>
      {TABS.map((tab) => {
        const focused = isActive(tab.key);
        return (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => router.replace(tab.route)}>
            <View style={styles.iconWrapper}>
              <Ionicons
                name={focused ? tab.icon : tab.iconOutline}
                size={20}
                color={focused ? ACTIVE : INACTIVE}
              />
            </View>
            <Text style={[styles.label, { color: focused ? ACTIVE : INACTIVE }]}>
              {tab.label}
            </Text>
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
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
