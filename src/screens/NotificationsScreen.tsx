import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Divider from "../components/Divider";
import SnapHeader from "../components/SnapHeader";
import UserRow from "../components/UserRow";
import { RootStackParamList } from "../navigation/AppNavigator";
import { api } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

type User = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

type NotificationItem = {
  id: string;
  type: "friend_request" | "friend_accepted" | "info";
  message: string;
  createdAt: string;
  readAt?: string | null;
  actor?: User | null;
};

export default function NotificationsScreen({ navigation }: Props) {
  const theme = useTheme();
  const [requests, setRequests] = useState<User[]>([]);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [reqs, notes] = await Promise.all([
        api<User[]>("/api/friends/requests", { method: "GET" }),
        api<NotificationItem[]>("/api/notifications", { method: "GET" }),
      ]);
      setRequests(Array.isArray(reqs) ? reqs : []);
      setNotifs(Array.isArray(notes) ? notes : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load notifications");
      setRequests([]);
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const label = (u: User) => {
    const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return u.username || full || u.email || "User";
  };

  const accept = async (fromUserId: string) => {
    try {
      await api("/api/friends/accept", { method: "POST", json: { fromUserId } });
      load();
    } catch (e) {
      // keep it simple; the header already shows errors if any
      load();
    }
  };

  const uiList = useMemo(() => {
    // Build a combined list where friend requests show as actionable rows.
    const rows: Array<{ kind: "request"; user: User } | { kind: "notif"; notif: NotificationItem }> = [];
    (requests || []).forEach((u) => rows.push({ kind: "request", user: u }));
    (notifs || [])
      .filter((n) => n.type === "friend_accepted" || n.type === "info")
      .forEach((n) => rows.push({ kind: "notif", notif: n }));
    return rows;
  }, [requests, notifs]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SnapHeader title="Notifications" leftIcon="chevron-left" onPressLeft={() => navigation.goBack()} />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, opacity: 0.7 }}>Loading…</Text>
        </View>
      ) : uiList.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Text variant="titleMedium">No notifications</Text>
          <Text style={{ opacity: 0.7, marginTop: 6, textAlign: "center" }}>
            Friend requests will show up here.
          </Text>
          {error ? <Text style={{ color: theme.colors.error, marginTop: 10 }}>{error}</Text> : null}
          <Button mode="outlined" onPress={load} style={{ marginTop: 12 }}>
            Refresh
          </Button>
        </View>
      ) : (
        <FlatList
          data={uiList}
          keyExtractor={(row) => (row.kind === "request" ? `req:${row.user.id}` : `n:${row.notif.id}`)}
          ItemSeparatorComponent={() => <Divider margin={0} />}
          renderItem={({ item }) => {
            if (item.kind === "request") {
              return (
                <UserRow
                  name={label(item.user)}
                  subtitle="Sent you a friend request"
                  rightText="Accept"
                  onPress={() => accept(item.user.id)}
                />
              );
            }

            const actorLabel = item.notif.actor ? label(item.notif.actor) : "Someone";
            const msg = item.notif.message ? `${actorLabel} ${item.notif.message}` : actorLabel;

            return <UserRow name={msg} subtitle="" />;
          }}
        />
      )}
    </View>
  );
}
