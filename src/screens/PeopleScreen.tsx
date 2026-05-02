import React, { useEffect, useRef, useState, useCallback } from "react";
import { FlatList, View, ScrollView, Pressable, Alert } from "react-native";
import { Avatar, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import SnapHeader from "../components/SnapHeader";
import UserRow from "../components/UserRow";
import Divider from "../components/Divider";
import { api } from "../services/api";
import { logout } from "../services/auth";

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
};

export default function PeopleScreen({ navigation }: any) {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");

  const storyRef = useRef<ScrollView>(null);

  const label = useCallback((u: User) => {
    const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return (u.username || "").trim() || full || u.email || "User";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<User[]>("/api/users", { method: "GET" });
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        setUsers([]);
      }
    })();
  }, []);

  const openMenu = useCallback(() => {
    Alert.alert("Options", "", [
      {
        text: "Go to Stories",
        onPress: () => storyRef.current?.scrollTo({ x: 0, animated: true }),
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.replace("Login");
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [navigation]);

  const filtered = users.filter((u) =>
    label(u).toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      <SnapHeader
        title="People"
        leftIcon="account-circle"
        onPressLeft={() => navigation.navigate("Profile")}
        // ✅ IMPORTANT: Use YOUR SnapHeader's menu handler for "..."
        onPressMenu={openMenu}
        // ✅ If SnapHeader shows bell only when provided, leave this out.
        // If it *forces* a bell icon, keep it but do nothing:
        onPressBell={() => {}}
      >
        <TextInput
          mode="outlined"
          value={query}
          onChangeText={setQuery}
          placeholder="Search friends"
          autoCapitalize="none"
          left={<TextInput.Icon icon="magnify" />}
          outlineStyle={{ borderRadius: 999 }}
          style={{ height: 44 }}
        />
      </SnapHeader>

      {/* Stories row */}
      <ScrollView
        ref={storyRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingVertical: 12, paddingLeft: 12 }}
      >
        <Pressable style={{ alignItems: "center", marginRight: 14 }}>
          <Avatar.Icon size={60} icon="plus" />
          <Text variant="labelSmall">Your Story</Text>
        </Pressable>

        {users.slice(0, 10).map((u) => (
          <Pressable
            key={u.id}
            style={{ alignItems: "center", marginRight: 14, width: 76 }}
            onPress={() => navigation.navigate("UserProfile", { userId: u.id })}
          >
            <Avatar.Text size={60} label={label(u)[0] || "U"} />
            <Text variant="labelSmall" numberOfLines={1}>
              {label(u)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Divider />

      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id}
        ItemSeparatorComponent={() => <Divider margin={0} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <UserRow
            name={label(item)}
            subtitle={item.email || ""}
            onPress={() =>
              navigation.navigate("UserProfile", { userId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ opacity: 0.75 }}>
              {query.trim() ? "No users found." : "Search people to add friends."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
