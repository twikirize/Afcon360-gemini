import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider } from './src/context/AuthContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { AdventureScreen } from './src/screens/AdventureScreen';
import { EventsScreen } from './src/screens/EventsScreen';
import { EventDetailScreen } from './src/screens/EventDetailScreen';
import { StaysScreen } from './src/screens/StaysScreen';
import { TransportScreen } from './src/screens/TransportScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { colors } from './src/theme/tokens';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const EventsStack = createNativeStackNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.brandPrimaryDark },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Adventure" component={AdventureScreen} options={{ title: 'Adventure & Tours' }} />
    </HomeStack.Navigator>
  );
}

function EventsNavigator() {
  return (
    <EventsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.brandPrimaryDark },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <EventsStack.Screen name="EventsList" component={EventsScreen} options={{ title: 'Events & Tickets' }} />
      <EventsStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Pass' }} />
    </EventsStack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerStyle: { backgroundColor: colors.brandPrimaryDark },
              headerTintColor: colors.white,
              headerTitleStyle: { fontWeight: '700' },
              tabBarActiveTintColor: '#141915',
              tabBarInactiveTintColor: '#6C766E',
              tabBarStyle: { height: 60, paddingBottom: 6, paddingTop: 4, backgroundColor: '#FFFFFF', borderTopColor: '#E6EAE4' },
              tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
              tabBarItemStyle: { paddingHorizontal: 0, paddingVertical: 2 },
              tabBarAllowFontScaling: false,
              tabBarIcon: ({ color, focused }) => {
                const map: Record<string, keyof typeof Ionicons.glyphMap> = {
                  Home: 'home-outline',
                  Events: 'calendar-outline',
                  Stays: 'bed-outline',
                  Rides: 'car-outline',
                  Wallet: 'wallet-outline',
                  Account: 'person-outline',
                  About: 'information-circle-outline',
                };
                return (
                  <View
                    style={{
                      backgroundColor: focused ? '#FCEEE2' : 'transparent',
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 2,
                    }}
                  >
                    <Ionicons name={map[route.name] || 'ellipse-outline'} size={20} color={color} />
                  </View>
                );
              },
            })}
          >
            <Tab.Screen name="Home" component={HomeNavigator} options={{ headerShown: false, title: 'Pamoja' }} />
            <Tab.Screen name="Events" component={EventsNavigator} options={{ headerShown: false }} />
            <Tab.Screen name="Stays" component={StaysScreen} options={{ title: 'Verified Stays' }} />
            <Tab.Screen name="Rides" component={TransportScreen} options={{ title: 'Transport' }} />
            <Tab.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
            <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
            <Tab.Screen name="About" component={AboutScreen} options={{ title: 'About App' }} />
          </Tab.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
