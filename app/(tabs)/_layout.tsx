import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import HeaderIcon from '../../assets/images/header-icon.svg';
import NewsTabIcon from '../../assets/images/news.svg';
import HomeTabIcon from '../../assets/images/home.svg';


import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { View, Text } from '@/components/Themed';
import { useIsFocused } from '@react-navigation/native';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        headerTitleStyle: {
          fontSize: 28,
          lineHeight: 36,
          marginLeft: 5,
          fontFamily: 'Montserrat-Bold'
        },
        tabBarLabelStyle: { fontSize: 11 }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color }) => <HomeTabIcon width={24} height={24} color={color} />,
          headerLeft: () => (
            <View style={{ marginLeft: 15 }}>
              <HeaderIcon width={24} height={24} />
            </View>
          ),

        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'Новости',
          tabBarIcon: ({ color }) => <NewsTabIcon width={24} height={24} color={color} />,
          headerLeft: () => (
            <View style={{ marginLeft: 15 }}>
              <HeaderIcon width={24} height={24} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
