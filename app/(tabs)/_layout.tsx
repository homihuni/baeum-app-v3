import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 80,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          paddingTop: 8,
          paddingBottom: 16,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#7ED4C0',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
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
  iconText: {
    fontSize: 28,
  },
});
