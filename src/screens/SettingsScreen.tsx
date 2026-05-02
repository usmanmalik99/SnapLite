import React from "react";
import { View } from "react-native";
import { Button, List, Text, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import SnapHeader from "../components/SnapHeader";
import { RootStackParamList } from "../navigation/AppNavigator";
import { logout } from "../services/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SnapHeader title="Settings" leftIcon="chevron-left" onPressLeft={() => navigation.goBack()} />

      <View style={{ padding: 14 }}>
        <Text variant="titleMedium" style={{ fontWeight: "800" }}>
          SnapLite
        </Text>
        <Text style={{ opacity: 0.7, marginTop: 6 }}>
          Basic settings page (demo). Add more options as needed.
        </Text>

        <View style={{ height: 12 }} />

        <List.Section>
          <List.Item
            title="Profile"
            description="Edit your info"
            left={(props) => <List.Icon {...props} icon="account-circle" />}
            onPress={() => navigation.navigate("Profile")}
          />
          <List.Item
            title="Notifications"
            description="Friend requests"
            left={(props) => <List.Icon {...props} icon="bell-outline" />}
            onPress={() => navigation.navigate("Notifications")}
          />
        </List.Section>

        <Button
          mode="outlined"
          onPress={async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          }}
          style={{ marginTop: 6 }}
        >
          Log out
        </Button>
      </View>
    </View>
  );
}
