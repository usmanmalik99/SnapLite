import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator } from "react-native-paper";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ChatScreen from "../screens/ChatScreen";
import CallScreen from "../screens/CallScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import MainTabs from "./MainTabs";
import { getSessionUser } from "../services/session";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Tabs: undefined;
  Profile: undefined;
  Notifications: undefined;
  Settings: undefined;
  UserProfile: { userId: string };
  Chat: { chatId: string };
  Call: { chatId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>("Login");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const u = await getSessionUser();
        if (!mounted) return;
        setInitialRoute(u ? "Tabs" : "Login");
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#fff" }, 
        animation: "fade",
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

      {/* Snapchat-like home */}
      <Stack.Screen name="Tabs" component={MainTabs} />

      {/* Secondary pages */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />

      {/* Keep these on Stack */}
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Call" component={CallScreen} />
    </Stack.Navigator>
  );
}
