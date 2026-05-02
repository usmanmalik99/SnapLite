import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";

type Props = {
  name: string;
  subtitle?: string;
  avatarUrl?: string | null;
  onPress?: () => void;
  rightText?: string; // e.g. "2m", "Yesterday"
};

export default function UserRow({
  name,
  subtitle = "",
  avatarUrl = null,
  onPress,
  rightText,
}: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed && onPress ? theme.colors.surfaceVariant : theme.colors.surface,
        },
      ]}
    >
      <View style={styles.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.avatarLetter, { color: theme.colors.onSurface }]}>
              {name?.[0]?.toUpperCase() ?? "U"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.mid}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        {!!subtitle && (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>

      {!!rightText && (
        <Text style={styles.rightText}>{rightText}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontWeight: "700",
    fontSize: 16,
  },
  mid: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(17,24,39,0.65)",
    marginTop: 2,
    fontSize: 13,
  },
  rightText: {
    marginLeft: 10,
    color: "rgba(17,24,39,0.55)",
    fontSize: 12,
  },
});
