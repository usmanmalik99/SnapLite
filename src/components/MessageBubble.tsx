import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  text: string;
  isMe?: boolean;
  time?: string; // optional "2:41 PM"
};

export default function MessageBubble({ text, isMe = false, time }: Props) {
  return (
    <View style={[styles.wrap, isMe ? styles.meWrap : styles.themWrap]}>
      <View style={[styles.bubble, isMe ? styles.meBubble : styles.themBubble]}>
        <Text style={[styles.text, isMe ? styles.meText : styles.themText]}>{text}</Text>
      </View>
      {!!time && <Text style={styles.time}>{time}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    marginVertical: 6,
    maxWidth: "85%",
  },
  meWrap: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  themWrap: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
  },
  meBubble: {
    backgroundColor: "#1b6cff",
    borderTopRightRadius: 6,
  },
  themBubble: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderTopLeftRadius: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  meText: { color: "#fff" },
  themText: { color: "#111" },
  time: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(0,0,0,0.45)",
  },
});
