import { MD3LightTheme, type MD3Theme } from "react-native-paper";

// Snapchat-ish (light): white surfaces + yellow accent
export const snapTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#FFD400",
    secondary: "#4C7DFF",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceVariant: "#F3F4F6",
    outline: "#E5E7EB",
  },
  roundness: 16,
};
