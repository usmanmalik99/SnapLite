import React from "react";
import { View } from "react-native";

export default function Divider({ margin = 12 }: { margin?: number }) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: "#E5E7EB",
        opacity: 1,
        marginVertical: margin,
      }}
    />
  );
}
