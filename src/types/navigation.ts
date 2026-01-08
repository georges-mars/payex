import type { NavigatorScreenParams } from '@react-navigation/native';

// Main Tab Navigator Types
export type MainTabsParamList = {
  Home: undefined;
  Accounts: undefined;
  Transactions: undefined;
  Profile: undefined;
};

// Root Stack Navigator Types
export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  Feedback: undefined;
  Profile: undefined;
  SendMoney: undefined;
  LinkAccount: undefined;
  Link: undefined;
  Deposit: undefined;
  Withdraw: undefined;
};

// Declare global types for type-safe navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
