import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onSend: (text: string) => void;
  onTyping?: (isTyping: boolean) => void;
  onPressAttach?: () => void;
  onPressCamera?: () => void;
  onPressMic?: () => void;
  onPressLocation?: () => void;
  isRecording?: boolean;
};

const EMOJIS = ["😀", "😂", "😍", "🔥", "👏", "❤️", "👍", "😎", "😢", "😡", "🎉", "💯", "📍", "📸"];

export default function ComposerBar({
  onSend,
  onTyping,
  onPressAttach,
  onPressCamera,
  onPressMic,
  onPressLocation,
  isRecording = false,
}: Props) {
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const lastTypingSent = useRef(0);

  const emitTyping = (typing: boolean) => {
    if (!onTyping) return;
    const now = Date.now();
    if (typing && now - lastTypingSent.current < 800) return;
    lastTypingSent.current = now;
    onTyping(typing);
  };

  useEffect(() => {
    if (!text.trim()) emitTyping(false);
    else emitTyping(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
    setEmojiOpen(false);
    emitTyping(false);
  };

  const addEmoji = (emoji: string) => {
    setText((current) => `${current}${emoji}`);
  };

  return (
    <View style={styles.outer}>
      {emojiOpen ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
          {EMOJIS.map((emoji) => (
            <Pressable key={emoji} onPress={() => addEmoji(emoji)} style={styles.emojiBtn}>
              <Text style={styles.emoji}>{emoji}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.row}>
        <IconBtn name="camera-outline" onPress={onPressCamera} />
        <IconBtn name="happy-outline" onPress={() => setEmojiOpen((v) => !v)} active={emojiOpen} />

        <View style={styles.inputWrap}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Send a Chat"
            placeholderTextColor="rgba(0,0,0,0.35)"
            style={styles.input}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
        </View>

        <IconBtn name={isRecording ? "stop-circle" : "mic-outline"} onPress={onPressMic} active={isRecording} />
        <IconBtn name="attach-outline" onPress={onPressAttach} />
        <IconBtn name="location-outline" onPress={onPressLocation} />
        <IconBtn name="send" onPress={handleSend} active={!!text.trim()} />
      </View>
    </View>
  );
}

function IconBtn({
  name,
  onPress,
  active,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={12}
      style={({ pressed }) => [
        styles.iconBtn,
        active ? styles.activeIcon : null,
        pressed && onPress ? styles.pressed : null,
        !onPress ? styles.disabled : null,
      ]}
    >
      <Ionicons name={name} size={22} color={active ? "#fff" : "#111"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.10)",
    backgroundColor: "#fff",
  },
  emojiRow: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  emojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.045)",
  },
  emoji: { fontSize: 22 },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  input: {
    color: "#111",
    fontSize: 15,
    maxHeight: 120,
    padding: 0,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    marginBottom: 3,
  },
  activeIcon: {
    backgroundColor: "#1b6cff",
  },
  pressed: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  disabled: {
    opacity: 0.35,
  },
});
