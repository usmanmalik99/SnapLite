import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import ChatListScreen from "../screens/ChatListScreen";
import PeopleScreen from "../screens/PeopleScreen";
import CameraScreen from "../screens/CameraScreen";
import MapScreen from "../screens/MapScreen";

export type MainTabParamList = {
  Chats: undefined;
  Camera: undefined;
  Map: undefined;
  People: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Camera"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0.5,
          borderTopColor: "rgba(0,0,0,0.08)",
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarIcon: ({ color, size, focused }) => {
          // ✅ Change the icon names here
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = "help-circle-outline";

          if (route.name === "Chats") iconName = focused ? "chat" : "chat-outline";
          if (route.name === "Camera") iconName = focused ? "camera" : "camera-outline";
          if (route.name === "Map") iconName = focused ? "map-marker" : "map-marker-outline";
          if (route.name === "People") iconName = focused ? "account-group" : "account-group-outline";

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* ✅ Your requested order: Chats 1st, Map 3rd */}
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="People" component={PeopleScreen} />
    </Tab.Navigator>
  );
}
