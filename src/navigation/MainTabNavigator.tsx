import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { Home, Wallet, Receipt, User } from 'lucide-react-native';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();



// Main tab navigator - completely driven by config
export const MainTabNavigator = () => {
    const {
        tabBarBackground,
        tabBarActiveIcon,
        tabBarInactiveIcon,
        tabBarBorder,
        tabBarBorderTopWidth,
        tabBarIconSize,
        tabBarLabelFontSize
    } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: tabBarActiveIcon,
                tabBarInactiveTintColor: tabBarInactiveIcon,
                tabBarStyle: {
                    backgroundColor: tabBarBackground,
                    borderTopColor: tabBarBorder,
                    height: Platform.OS === 'ios' ? 72 : 60,
                    paddingBottom: 8,
                    borderTopWidth: tabBarBorderTopWidth,
                    elevation: 0,
                    shadowOpacity: 0,
                    // Ensure tab bar doesn't overlap with bottom notch
                    ...(Platform.OS === 'ios' ? {paddingBottom: 0} : {}),
                },
                tabBarLabelStyle: {
                    fontSize: tabBarLabelFontSize,
                    fontWeight: '500',
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({color}) => <Home size={tabBarIconSize} color={color} />
                }}
            />
            
            <Tab.Screen
                name="Accounts"
                component={AccountsScreen}
                options={{
                    tabBarLabel: 'Accounts',
                    tabBarIcon: ({color}) => <Wallet size={tabBarIconSize} color={color} />
                }}
            />
            
            <Tab.Screen
                name="Transactions"
                component={TransactionsScreen}
                options={{
                    tabBarLabel: 'History',
                    tabBarIcon: ({color}) => <Receipt size={tabBarIconSize} color={color} />
                }}
            />
            
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({color}) => <User size={tabBarIconSize} color={color} />
                }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
