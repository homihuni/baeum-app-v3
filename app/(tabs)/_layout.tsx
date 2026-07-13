import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const ACTIVE = '#1DA884';
const INACTIVE = '#B0BEC5';

function TabIcon({ children, label, focused }: { children: React.ReactNode; label: string; focused: boolean }) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 70,
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
  const [childGrade, setChildGrade] = useState(1);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadChildGrade = async () => {
        try {
          const storedGrade = await AsyncStorage.getItem('childGrade');
          if (isMounted) {
            setChildGrade(Number(storedGrade) || 1);
          }
        } catch (error) {
          console.log('tab child grade load error:', error);
        }
      };

      loadChildGrade();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const showPlayTab = childGrade <= 2;

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
            <TabIcon label="학습" focused={focused}>
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
        name="play"
        options={{
          href: showPlayTab ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="놀이" focused={focused}>
              <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={21} color={focused ? ACTIVE : INACTIVE} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="메뉴" focused={focused}>
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={focused ? ACTIVE : INACTIVE} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}
