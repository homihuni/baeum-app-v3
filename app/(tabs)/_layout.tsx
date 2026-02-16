import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#D4EDE7',
          paddingTop: 8,
          paddingBottom: insets.bottom,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#5BBFAA',
        tabBarInactiveTintColor: '#B0BEC5',
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
          marginBottom: 0,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: '스터디',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: '성장',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: '전체메뉴',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconText: {
    fontSize: 28,
  },
});
