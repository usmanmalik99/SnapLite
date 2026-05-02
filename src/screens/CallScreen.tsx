import React from "react";
import { View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Call">;

export default function CallScreen({ navigation, route }: Props) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background, padding: 20 }}>
      <Text variant="headlineSmall" style={{ color: theme.colors.primary, marginBottom: 8 }}>Call (Demo)</Text>
      <Text style={{ opacity: 0.8, marginBottom: 16 }}>Chat ID: {route.params.chatId}</Text>
      <Text style={{ opacity: 0.7, marginBottom: 20, textAlign: "center" }}>
        For a college project demo, you can present this screen as the call feature placeholder.
        Real audio/video calls require WebRTC (more setup).
      </Text>
      <Button mode="contained" onPress={() => navigation.goBack()} style={{ borderRadius: 16 }}>
        End
      </Button>
    </View>
  );
}
