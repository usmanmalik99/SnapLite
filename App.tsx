import React from "react";
import { NavigationContainer, DefaultTheme as NavDefaultTheme } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { snapTheme } from "./src/theme/snapTheme";

const navTheme = {
  ...NavDefaultTheme,
  colors: {
    ...NavDefaultTheme.colors,
    background: snapTheme.colors.background,
    card: snapTheme.colors.surface,
    primary: snapTheme.colors.primary,
    text: "#111827",
    border: snapTheme.colors.outline,
    notification: snapTheme.colors.primary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={snapTheme}>
        <NavigationContainer theme={navTheme}>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
