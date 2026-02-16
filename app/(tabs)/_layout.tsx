import { Tabs } from 'expo-router';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 50 + insets.bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#D4EDE7',
          paddingBottom: insets.bottom,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#5BBFAA',
        tabBarInactiveTintColor: '#B0BEC5',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          paddingTop: 4,
          paddingBottom: 4,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: '스터디',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: '성장',
          tabBarIcon: ({ color }) => (
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <Ionicons name="star" size={10} color={color} />
              <Ionicons name="star" size={10} color={color} />
              <Ionicons name="star" size={10} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '전체메뉴',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 20, height: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
            </View>
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
