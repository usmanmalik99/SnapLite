import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { Text, IconButton } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as ScreenCapture from "expo-screen-capture";
import type { RootStackParamList } from "../navigation/AppNavigator";
import MessageBubble from "../components/MessageBubble";
import ComposerBar from "../components/ComposerBar";
import { getSessionUser } from "../services/session";
import { getChat } from "../services/chats";
import { api } from "../services/api";
import {
  listMessages,
  sendAudio,
  sendFile,
  sendImage,
  sendLocationMessage,
  sendScreenshot,
  sendText,
  Message,
} from "../services/messages";
import { shareMyLocation, updateMyLocation } from "../services/location";
import { getTyping, setTyping } from "../services/typing";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export default function ChatScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { chatId } = route.params;

  const [meId, setMeId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string>("Chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingOther, setTypingOther] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const title = useMemo(() => chatTitle || "Chat", [chatTitle]);

  const load = useCallback(async () => {
    try {
      const data = await listMessages(chatId);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      // Keep chat usable even if one poll fails.
    }
  }, [chatId]);

  useEffect(() => {
    (async () => {
      const me = await getSessionUser();
      setMeId(me?.id || null);
      try {
        const chat = await getChat(chatId);
        setChatTitle(chat?.title || "Chat");
        const other = (chat.members || []).find((id) => String(id) !== String(me?.id)) || null;
        setOtherUserId(other);
      } catch {
        setOtherUserId(null);
        setChatTitle("Chat");
      }
    })();
  }, [chatId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const sub = ScreenCapture.addScreenshotListener(async () => {
      try {
        await sendScreenshot(chatId);
        await load();
      } catch {}
    });
    return () => sub.remove();
  }, [chatId, load]);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await getTyping(chatId);
        const ids = Array.isArray(r?.typingUserIds) ? r.typingUserIds : [];
        setTypingOther(ids.some((id: string) => String(id) !== String(meId)));
      } catch {
        setTypingOther(false);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [chatId, meId]);

  useEffect(() => {
    return () => {
      recording?.stopAndUnloadAsync().catch(() => {});
    };
  }, [recording]);

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const onSendText = useCallback(
    async (text: string) => {
      try {
        await sendText(chatId, text, null);
        await load();
      } catch (e: any) {
        Alert.alert("Message failed", e?.message || "Could not send message");
      }
    },
    [chatId, load]
  );

  const attachFromLibrary = useCallback(async () => {
    Alert.alert("Send attachment", "Choose what you want to share", [
      { text: "Photo from library", onPress: pickPhoto },
      { text: "File", onPress: pickFile },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

  const pickPhoto = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission needed", "Allow media library access to share photos.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      await sendImage(chatId, uri, null);
      await load();
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not attach image");
    }
  }, [chatId, load]);

  const pickFile = useCallback(async () => {
    try {
      let DocumentPicker: any;
      try {
        DocumentPicker = require("expo-document-picker");
      } catch {
        Alert.alert(
          "Document picker missing",
          "Install it with: npx expo install expo-document-picker. Photo, camera, voice note, emoji, and location sharing still work."
        );
        return;
      }

      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      await sendFile(chatId, asset.uri, asset.name || "Attachment", null);
      await load();
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not attach file");
    }
  }, [chatId, load]);

  const openCamera = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission needed", "Allow camera access to take and send snaps.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      await sendImage(chatId, uri, null);
      await load();
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not open camera");
    }
  }, [chatId, load]);

  const toggleVoiceNote = useCallback(async () => {
    try {
      if (recording) {
        const active = recording;
        setRecording(null);
        await active.stopAndUnloadAsync();
        const uri = active.getURI();
        if (uri) {
          await sendAudio(chatId, uri, null);
          await load();
        }
        return;
      }

      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission needed", "Allow microphone access to send voice notes.");
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const result = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(result.recording);
    } catch (e: any) {
      setRecording(null);
      Alert.alert("Voice note failed", e?.message || "Could not record voice note");
    }
  }, [chatId, load, recording]);

  const playAudio = useCallback(async (uri: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) sound.unloadAsync().catch(() => {});
      });
    } catch (e: any) {
      Alert.alert("Playback failed", e?.message || "Could not play voice note");
    }
  }, []);

  const onPressLocation = useCallback(() => {
    Alert.alert("Location", "Choose an option", [
      {
        text: "Send Current Location",
        onPress: async () => {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Permission needed", "Allow location access to send your current location.");
              return;
            }
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            await sendLocationMessage(chatId, pos.coords.latitude, pos.coords.longitude);
            await load();
          } catch (e: any) {
            Alert.alert("Failed", e?.message || "Could not send location");
          }
        },
      },
      {
        text: "Share Live Location on Map",
        onPress: async () => {
          if (!otherUserId) {
            Alert.alert("Not ready", "Could not find the other user yet.");
            return;
          }
          try {
            await shareMyLocation(otherUserId, true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
              const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
              await updateMyLocation(pos.coords.latitude, pos.coords.longitude);
            }
            await sendText(chatId, "📍 I shared my live location with you.", null);
            await load();
          } catch (e: any) {
            Alert.alert("Failed", e?.message || "Could not share live location");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [chatId, load, otherUserId]);

  const onTyping = useCallback(
    async (isTyping: boolean) => {
      try {
        await setTyping(chatId, isTyping);
      } catch {}
    },
    [chatId]
  );

  const removeFriend = useCallback(() => {
    if (!otherUserId) return Alert.alert("Not ready", "Could not find the other user yet.");
    Alert.alert("Remove friend?", "This chat will stay in history, but this user will be removed from your friends.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await api("/api/friends/remove", { method: "POST", json: { otherUserId } });
            Alert.alert("Removed", "Friend removed.", [{ text: "OK", onPress: () => navigation.goBack() }]);
          } catch (e: any) {
            Alert.alert("Failed", e?.message || "Could not remove friend");
          }
        },
      },
    ]);
  }, [navigation, otherUserId]);

  const blockUser = useCallback(() => {
    if (!otherUserId) return Alert.alert("Not ready", "Could not find the other user yet.");
    Alert.alert("Block user?", "They will not be able to contact you in SnapLite.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            await api("/api/users/block", { method: "POST", json: { otherUserId } });
            Alert.alert("Blocked", "User blocked.", [{ text: "OK", onPress: () => navigation.goBack() }]);
          } catch (e: any) {
            Alert.alert("Failed", e?.message || "Could not block user");
          }
        },
      },
    ]);
  }, [navigation, otherUserId]);

  const openMapForLocation = (lat: number, lng: number) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
      default: `https://maps.google.com/?q=${lat},${lng}`,
    });
    Linking.openURL(url || `https://maps.google.com/?q=${lat},${lng}`).catch(() => {
      navigation.navigate("Tabs" as any, { screen: "Map" });
    });
  };

  const header = (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: 10,
        paddingBottom: 8,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.08)",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <IconButton icon="chevron-left" size={28} onPress={() => navigation.goBack()} />
      <View style={{ flex: 1, paddingHorizontal: 6 }}>
        <Text style={{ fontWeight: "900", fontSize: 18 }} numberOfLines={1}>{title}</Text>
        <Text style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }} numberOfLines={1}>
          {recording ? "Recording voice note… tap stop to send" : typingOther ? "Typing…" : "SnapLite chat"}
        </Text>
      </View>
      <IconButton icon="phone" size={24} onPress={() => navigation.navigate("Call", { chatId })} />
      <IconButton icon="video" size={24} onPress={() => navigation.navigate("Call", { chatId })} />
      <IconButton
        icon="dots-horizontal"
        size={24}
        onPress={() =>
          Alert.alert(title, "Chat options", [
            { text: "Share Location", onPress: onPressLocation },
            { text: "Remove Friend", onPress: removeFriend, style: "destructive" },
            { text: "Block User", onPress: blockUser, style: "destructive" },
            { text: "Cancel", style: "cancel" },
          ])
        }
      />
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = meId ? String(item.senderId) === String(meId) : false;

    if (item.type === "image" && (item.mediaUrl || item.text)) {
      const uri = (item.mediaUrl || item.text) as string;
      return (
        <View style={{ paddingHorizontal: 12, marginVertical: 8, alignSelf: isMe ? "flex-end" : "flex-start" }}>
          <Image source={{ uri }} style={{ width: 220, height: 300, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.06)" }} resizeMode="cover" />
          <Text style={{ fontSize: 11, opacity: 0.5, marginTop: 4, alignSelf: isMe ? "flex-end" : "flex-start" }}>{fmtTime(item.createdAt)}</Text>
        </View>
      );
    }

    if (item.type === "audio" && item.mediaUrl) {
      return (
        <Pressable onPress={() => playAudio(item.mediaUrl || "")}>
          <MessageBubble isMe={isMe} text="🎙️ Voice note — tap to play" time={fmtTime(item.createdAt)} />
        </Pressable>
      );
    }

    if (item.type === "file") {
      const label = item.fileName || item.text || "Attachment";
      return (
        <Pressable onPress={() => item.mediaUrl && Linking.openURL(item.mediaUrl).catch(() => {})}>
          <MessageBubble isMe={isMe} text={`📎 ${label}`} time={fmtTime(item.createdAt)} />
        </Pressable>
      );
    }

    if (item.type === "location" && item.location) {
      const { lat, lng } = item.location;
      return (
        <Pressable onPress={() => openMapForLocation(lat, lng)} style={{ alignSelf: isMe ? "flex-end" : "flex-start" }}>
          <MessageBubble isMe={isMe} text={`📍 Location: ${lat.toFixed(5)}, ${lng.toFixed(5)} (tap to open)`} time={fmtTime(item.createdAt)} />
        </Pressable>
      );
    }

    if (item.type === "screenshot") {
      const name = item.sender?.username || item.sender?.firstName || "Someone";
      return <Text style={{ textAlign: "center", opacity: 0.55, marginVertical: 10 }}>{`📸 ${name} took a screenshot`}</Text>;
    }

    return <MessageBubble isMe={isMe} text={item.text || ""} time={fmtTime(item.createdAt)} />;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {header}
      <FlatList
        data={messages}
        keyExtractor={(m) => m._id}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 + insets.bottom + 72 }}
        renderItem={renderMessage}
      />
      <View style={{ paddingBottom: insets.bottom, backgroundColor: "#fff" }}>
        <ComposerBar
          onSend={onSendText}
          onTyping={onTyping}
          onPressAttach={attachFromLibrary}
          onPressCamera={openCamera}
          onPressMic={toggleVoiceNote}
          onPressLocation={onPressLocation}
          isRecording={!!recording}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
