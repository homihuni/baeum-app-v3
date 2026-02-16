import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Platform } from 'react-native';

const ACTIVE = '#5BBFAA';
const INACTIVE = '#B0BEC5';

function TabIcon({ children, label, focused }: { children: React.ReactNode; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 60, paddingTop: 6 }}>
      {children}
      <Text style={{
        fontSize: 10,
        fontWeight: '600',
        color: focused ? ACTIVE : INACTIVE,
        marginTop: 3,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        height: Platform.OS === 'ios' ? 85 : 65,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#D4EDE7',
        paddingBottom: Platform.OS === 'ios' ? 25 : 5,
      },
    }}>

      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="홈" focused={focused}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={focused ? ACTIVE : INACTIVE} />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="study"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="스터디" focused={focused}>
              <Ionicons name={focused ? 'book' : 'book-outline'} size={20} color={focused ? ACTIVE : INACTIVE} />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="growth"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="성장" focused={focused}>
              <View style={{ flexDirection: 'row', gap: 1 }}>
                <Ionicons name="star" size={9} color={focused ? ACTIVE : INACTIVE} />
                <Ionicons name="star" size={9} color={focused ? ACTIVE : INACTIVE} />
                <Ionicons name="star" size={9} color={focused ? ACTIVE : INACTIVE} />
              </View>
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => {
            const c = focused ? ACTIVE : INACTIVE;
            return (
              <TabIcon label="전체메뉴" focused={focused}>
                <View style={{ width: 20, height: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 1.5, backgroundColor: c }} />
                  <View style={{ width: 7, height: 7, borderRadius: 1.5, backgroundColor: c }} />
                  <View style={{ width: 7, height: 7, borderRadius: 1.5, backgroundColor: c }} />
                  <View style={{ width: 7, height: 7, borderRadius: 1.5, backgroundColor: c }} />
                </View>
              </TabIcon>
            );
          },
        }}
      />

    </Tabs>
  );
}
