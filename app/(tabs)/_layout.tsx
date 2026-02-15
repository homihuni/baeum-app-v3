import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#7ED4C0',
        tabBarInactiveTintColor: '#9E9E9E',
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.iconText, { color }]}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: '스터디',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.iconText, { color }]}>📚</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: '성장',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.iconText, { color }]}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: '전체',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.iconText, { color }]}>☰</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E0E0E0',
    borderTopWidth: 1,
  },
  iconText: {
    fontSize: 20,
  },
});
