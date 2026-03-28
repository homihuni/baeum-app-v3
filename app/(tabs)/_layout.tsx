import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE = '#5BBFAA';
const INACTIVE = '#B0BEC5';

function TabIcon({ children, label, focused }: { children: React.ReactNode; label: string; focused: boolean }) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'flex-end',
      width: 70,
      height: 42,
    }}>
      <View style={{ height: 24, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
      <Text style={{
        fontSize: 10,
        fontWeight: '600',
        color: focused ? ACTIVE : INACTIVE,
        marginTop: 2,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        height: 56 + insets.bottom,
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
              <Ionicons name={focused ? 'star' : 'star-outline'} size={22} color={focused ? ACTIVE : INACTIVE} />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="전체메뉴" focused={focused}>
              <Ionicons name="menu" size={22} color={focused ? ACTIVE : INACTIVE} />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen name="children/manage" options={{ href: null, tabBarStyle: { display: 'flex' } }} />
      <Tabs.Screen name="children/edit" options={{ href: null, tabBarStyle: { display: 'flex' } }} />
      <Tabs.Screen name="children/add" options={{ href: null, tabBarStyle: { display: 'flex' } }} />
      <Tabs.Screen name="children/serial" options={{ href: null, tabBarStyle: { display: 'flex' } }} />
      <Tabs.Screen name="serial/enter" options={{ href: null, tabBarStyle: { display: 'flex' } }} />
      <Tabs.Screen name="settings/grade" options={{ href: null, tabBarStyle: { display: 'flex' } }} />
      <Tabs.Screen name="settings/subscribe" options={{ href: null, tabBarStyle: { display: 'flex' } }} />
      <Tabs.Screen name="settings/notice-list" options={{ href: null, tabBarStyle: { display: 'flex' } }} />
      <Tabs.Screen name="settings/detail" options={{ href: null, tabBarStyle: { display: 'flex' } }} />
      <Tabs.Screen name="settings/index" options={{ href: null, tabBarStyle: { display: 'flex' } }} />

    </Tabs>
  );
}
