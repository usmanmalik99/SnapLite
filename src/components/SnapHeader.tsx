import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title?: string;
  leftIcon?: string; // 'chevron-left' | 'account-circle' etc.
  onPressLeft?: () => void;
  onPressSearch?: () => void;
  onPressBell?: () => void;
  onPressMenu?: () => void;
  children?: React.ReactNode; // optional row under title (e.g. search bar)
};

export default function SnapHeader({
  title,
  leftIcon = "account-circle",
  onPressLeft,
  onPressSearch,
  onPressBell,
  onPressMenu,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top,
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outline,
        },
      ]}
    >
      <View style={styles.row}>
        <IconButton
          icon={leftIcon}
          iconColor={theme.colors.onSurface}
          size={26}
          onPress={onPressLeft}
          disabled={!onPressLeft}
          style={styles.btn}
        />

        <View style={styles.center}>
          {title ? (
            <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>

        <IconButton
          icon="account-search"
          iconColor={theme.colors.onSurface}
          size={26}
          onPress={onPressSearch}
          disabled={!onPressSearch}
          style={styles.btn}
        />
        <IconButton
          icon="bell-outline"
          iconColor={theme.colors.onSurface}
          size={26}
          onPress={onPressBell}
          disabled={!onPressBell}
          style={styles.btn}
        />
        <IconButton
          icon="dots-horizontal"
          iconColor={theme.colors.onSurface}
          size={26}
          onPress={onPressMenu}
          disabled={!onPressMenu}
          style={styles.btn}
        />
      </View>

      {children ? <View style={styles.childWrap}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
  },
  row: {
    height: 56,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  btn: {
    margin: 0,
  },
  childWrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
});
