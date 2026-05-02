import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Divider from "../components/Divider";
import {
  Avatar,
  Button,
  Card,
    IconButton,
  List,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RootStackParamList } from "../navigation/AppNavigator";
import { logout } from "../services/auth";
import { api } from "../services/api";
import { getSessionToken, getSessionUser, setSession, SessionUser } from "../services/session";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

// Snapchat-like profile (simple + clean):
// - Top bar w/ back + save
// - Avatar header + Snapcode placeholder
// - Basic profile editing
// - Quick actions + logout
export default function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [me, setMe] = useState<SessionUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const initials = useMemo(() => {
    const a = (firstName || me?.firstName || "").slice(0, 1).toUpperCase();
    const b = (lastName || me?.lastName || "").slice(0, 1).toUpperCase();
    return (a + b).trim() || (me?.email?.slice(0, 1).toUpperCase() ?? "U");
  }, [firstName, lastName, me]);

  const loadMe = useCallback(async () => {
    setError(null);
    try {
      const local = await getSessionUser();
      setMe(local);
      setUsername((local as any)?.username || "");
      setFirstName(local?.firstName || "");
      setLastName(local?.lastName || "");

      // Refresh from API if available
      const fresh = await api<SessionUser>("/api/users/me");
      setMe(fresh);
      setUsername((fresh as any)?.username || "");
      setFirstName(fresh?.firstName || "");
      setLastName(fresh?.lastName || "");
    } catch {
      // Ignore if API isn't running. Local session still works.
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const onSave = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        username: username.trim() || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };

      const updated = await api<SessionUser>("/api/users/me", {
        method: "PATCH",
        json: payload,
      });

      // Keep token, update stored user
      const token = await getSessionToken();
      if (token) await setSession(token, updated);
      setMe(updated);
    } catch (e: any) {
      setError(e?.message || "Could not save profile");
    } finally {
      setBusy(false);
    }
  }, [firstName, lastName, username]);

  const onLogout = useCallback(async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Top bar */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 10,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <IconButton
          icon="chevron-left"
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate("Tabs");
          }}
        />
        <Text style={{ fontWeight: "800", letterSpacing: 0.3 }}>Profile</Text>
        <IconButton icon="content-save-outline" disabled={busy} onPress={onSave} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 24 }}>
        {error ? <Text style={{ color: theme.colors.error, marginBottom: 10 }}>{error}</Text> : null}

        {/* Header */}
        <Card style={{ borderRadius: 22, backgroundColor: theme.colors.surface }}>
          <Card.Content>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar.Text size={64} label={initials} style={{ backgroundColor: theme.colors.primary }} />
              <View style={{ flex: 1 }}>
                <Text variant="titleLarge" style={{ fontWeight: "800" }} numberOfLines={1}>
                  {(firstName + " " + lastName).trim() || me?.email || "SnapLite"}
                </Text>
                <Text style={{ opacity: 0.75 }} numberOfLines={1}>
                  {username?.trim() ? `@${username.trim()}` : "Add a username"}
                </Text>
              </View>
              <Pressable
                onPress={loadMe}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  padding: 8,
                  borderRadius: 999,
                  backgroundColor: theme.colors.surfaceVariant,
                })}
              >
                <Text style={{ fontWeight: "700" }}>↻</Text>
              </Pressable>
            </View>

            <View style={{ height: 12 }} />

            {/* Snapcode-like card (demo) */}
            <View
              style={{
                borderRadius: 18,
                backgroundColor: theme.colors.surfaceVariant,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "900", letterSpacing: 1.2 }}>SNAPLITE</Text>
              <Text style={{ opacity: 0.7, marginTop: 4 }}>Your Snapcode-style card (demo)</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={{ height: 14 }} />

        {/* Edit basics */}
        <Card style={{ borderRadius: 22, backgroundColor: theme.colors.surface }}>
          <Card.Content>
            <Text style={{ opacity: 0.75, marginBottom: 10 }}>Edit profile</Text>

            <TextInput
              mode="outlined"
              label="Username"
              value={username}
              autoCapitalize="none"
              onChangeText={setUsername}
              outlineStyle={{ borderRadius: 16 }}
              style={{ marginBottom: 10 }}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  mode="outlined"
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  outlineStyle={{ borderRadius: 16 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  mode="outlined"
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  outlineStyle={{ borderRadius: 16 }}
                />
              </View>
            </View>

            <Button
              mode="contained"
              loading={busy}
              disabled={busy}
              onPress={onSave}
              style={{ borderRadius: 16, marginTop: 12 }}
            >
              Save
            </Button>
          </Card.Content>
        </Card>

        <View style={{ height: 14 }} />

        {/* Quick actions */}
        <Card style={{ borderRadius: 22, backgroundColor: theme.colors.surface }}>
          <Card.Content style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
            <List.Item
              title="My Friends"
              description="View and manage friends"
              left={(p) => <List.Icon {...p} icon="account-group" />}
              onPress={() => navigation.navigate("Tabs")}
            />
            <Divider />
            <List.Item
              title="Snap Map"
              description="Location + sharing"
              left={(p) => <List.Icon {...p} icon="map" />}
              onPress={() => navigation.navigate("Tabs")}
            />
            <Divider />
            <List.Item
              title="Privacy"
              description="Screenshot alerts enabled"
              left={(p) => <List.Icon {...p} icon="shield-check" />}
            />
            <Divider />
            <List.Item title="Logout" left={(p) => <List.Icon {...p} icon="logout" />} onPress={onLogout} />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
