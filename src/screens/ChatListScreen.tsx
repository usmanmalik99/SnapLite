import React, { useCallback, useMemo, useState } from "react";
import SnapHeader from "../components/SnapHeader";
import { View, FlatList, Pressable, RefreshControl } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { listChats, Chat } from "../services/chats";
import type { MainTabParamList } from "../navigation/MainTabs";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = BottomTabScreenProps<MainTabParamList, "Chats">;

export default function ChatListScreen({ navigation }: Props) {
  const theme = useTheme();

  const [chats, setChats] = useState<Chat[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const stackNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const loadChats = useCallback(async () => {
    setError(null);
    try {
      const data = await listChats();
      setChats(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setChats([]);
      setError(e?.message || "Failed to load chats (is your API running?)");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }, [loadChats]);

  const filteredChats = useMemo(() => {
    // ✅ remove the unwanted placeholder/system row: title "Chat" + lastMessage "[location]"
    const cleaned = chats.filter((c) => {
      const title = String(c.title || "").trim().toLowerCase();
      const last = String(c.lastMessage || "").trim().toLowerCase();
      return !(title === "chat" && last === "[location]");
    });

    const s = q.trim().toLowerCase();
    if (!s) return cleaned;

    return cleaned.filter((c) => {
      const last = String(c.lastMessage || "").toLowerCase();
      const title = String(c.title || "Chat").toLowerCase();
      return title.includes(s) || last.includes(s);
    });
  }, [chats, q]);

  const openChat = useCallback(
    (chatId: string) => {
      stackNav?.navigate("Chat", { chatId });
    },
    [stackNav]
  );

  const renderChatItem = ({ item }: { item: Chat }) => {
    const title = item.title || "Chat";
    const subtitle = item.lastMessage || "Tap to start chatting";

    return (
      <Pressable
        onPress={() => openChat(item._id)}
        style={({ pressed }) => ({
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.backdrop,
          opacity: pressed ? 0.6 : 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.surfaceVariant,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ opacity: 0.9, fontWeight: "700" }}>
            {title.slice(0, 1).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ opacity: 0.75 }} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <Text style={{ opacity: 0.35 }}>›</Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SnapHeader
        title="Chats"
        onPressLeft={() => stackNav?.navigate("Profile" as any)}
        onPressSearch={() => navigation.navigate("People" as never)}
        onPressBell={() => stackNav?.navigate("Notifications" as any)}
        onPressMenu={() => stackNav?.navigate("Settings" as any)}
      />

      <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
        <TextInput
          mode="outlined"
          placeholder="Search chats"
          value={q}
          onChangeText={setQ}
          dense
          outlineStyle={{ borderRadius: 999 }}
          style={{ height: 44 }}
        />

        {error ? (
          <Text style={{ color: theme.colors.error, marginTop: 6, marginLeft: 6 }}>
            {error}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item._id}
        renderItem={renderChatItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ opacity: 0.75 }}>
              {q.trim()
                ? "No chats match your search."
                : "No chats yet. Start a new chat from People tab."}
            </Text>
          </View>
        }
      />
    </View>
  );
}
