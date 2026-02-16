import { Tabs } from 'expo-router';
import { Text, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#D4EDE7',
          height: Platform.OS === 'ios' ? 88 : 72,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
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
