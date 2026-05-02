import { logout } from "../services/auth";
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>You’re logged in ✅</Text>

      <Pressable style={styles.btn} onPress={async () => { await logout(); }}>
        <Text style={styles.btnText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
  btn: { backgroundColor: "black", padding: 12, borderRadius: 10 },
  btnText: { color: "white", fontWeight: "600" },
});
