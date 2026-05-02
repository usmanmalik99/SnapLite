import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button, Card, Text, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import SnapHeader from "../components/SnapHeader";
import { RootStackParamList } from "../navigation/AppNavigator";
import { api } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "UserProfile">;

type User = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

export default function UserProfileScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { userId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rel, setRel] = useState<{ isFriend: boolean; requestedOut: boolean; requestedIn: boolean } | null>(null);
  const [relLoading, setRelLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const u = await api<User>(`/api/users/${userId}`, { method: "GET" });
      setUser(u);

      // load relationship status after we have a user
      setRelLoading(true);
      try {
        const s = await api<any>(`/api/friends/status/${userId}`, { method: "GET" });
        setRel({
          isFriend: !!s?.isFriend,
          requestedOut: !!s?.requestedOut,
          requestedIn: !!s?.requestedIn,
        });
      } catch {
        setRel(null);
      } finally {
        setRelLoading(false);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load profile");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const displayName = useMemo(() => {
    if (!user) return "User";
    const full = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return user.username || full || user.email || "User";
  }, [user]);

  const addFriend = useCallback(async () => {
    if (!user) return;
    try {
      const r = await api<any>("/api/friends/request", { method: "POST", json: { toUserId: user.id } });
      // ✅ stay on this screen; update button state
      setRel((prev) => ({
        isFriend: prev?.isFriend || r?.status === "already_friends",
        requestedOut: true,
        requestedIn: false,
      }));
    } catch (e: any) {
      setError(e?.message || "Could not send friend request");
    }
  }, [user]);

  const acceptFriend = useCallback(async () => {
    if (!user) return;
    try {
      await api("/api/friends/accept", { method: "POST", json: { fromUserId: user.id } });
      setRel({ isFriend: true, requestedOut: false, requestedIn: false });
    } catch (e: any) {
      setError(e?.message || "Could not accept request");
    }
  }, [user]);

  const message = useCallback(async () => {
    if (!user) return;
    try {
      const chat = await api<any>("/api/chats/direct", {
        method: "POST",
        json: { otherUserId: user.id },
      });
      if (chat?._id) navigation.navigate("Chat", { chatId: chat._id });
      else if (chat?.id) navigation.navigate("Chat", { chatId: chat.id });
      else navigation.navigate("Chats" as never);
    } catch (e: any) {
      setError(e?.message || "Could not start chat");
    }
  }, [navigation, user]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SnapHeader title="Profile" leftIcon="chevron-left" onPressLeft={() => navigation.goBack()} />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, opacity: 0.7 }}>Loading…</Text>
        </View>
      ) : !user ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Text variant="titleMedium">Couldn’t load user</Text>
          {error ? <Text style={{ color: theme.colors.error, marginTop: 10 }}>{error}</Text> : null}
          <Button mode="outlined" onPress={load} style={{ marginTop: 12 }}>
            Retry
          </Button>
        </View>
      ) : (
        <View style={{ padding: 14 }}>
          {error ? <Text style={{ color: theme.colors.error, marginBottom: 10 }}>{error}</Text> : null}

          <Card style={{ borderRadius: 22, backgroundColor: theme.colors.surface }}>
            <Card.Content>
              <Text variant="titleLarge" style={{ fontWeight: "900" }}>
                {displayName}
              </Text>
              <Text style={{ opacity: 0.7, marginTop: 4 }}>{user.email}</Text>
            </Card.Content>
          </Card>

          <View style={{ height: 12 }} />

          <Button mode="contained" onPress={message} style={{ borderRadius: 16 }}>
            Message
          </Button>
          <View style={{ height: 10 }} />

          {/* Friend button */}
          {rel?.isFriend ? (
            <Button mode="outlined" disabled style={{ borderRadius: 16 }}>
              Friends
            </Button>
          ) : rel?.requestedOut ? (
            <Button mode="outlined" disabled style={{ borderRadius: 16 }}>
              Request Sent
            </Button>
          ) : rel?.requestedIn ? (
            <Button mode="contained" onPress={acceptFriend} style={{ borderRadius: 16 }}>
              Accept Request
            </Button>
          ) : (
            <Button mode="outlined" onPress={addFriend} disabled={relLoading} style={{ borderRadius: 16 }}>
              {relLoading ? "Loading…" : "Add Friend"}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
