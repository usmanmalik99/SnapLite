import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Divider from "../components/Divider";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Portal, Modal, List, Text, IconButton, useTheme } from "react-native-paper";
import { CameraView, CameraType, FlashMode, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import type { MainTabParamList } from "../navigation/MainTabs";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { listChats, Chat } from "../services/chats";
import { sendImage } from "../services/messages";

type Props = BottomTabScreenProps<MainTabParamList, "Camera">;

export default function CameraScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const cameraRef = useRef<CameraView | null>(null);
  const stackNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [libPerm, requestLibPerm] = MediaLibrary.usePermissions();

  const [type, setType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");

  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const [sendOpen, setSendOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [sendBusy, setSendBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseCamera = !!camPerm?.granted;

  useEffect(() => {
    if (!camPerm) requestCamPerm();
  }, [camPerm, requestCamPerm]);

  const openProfile = useCallback(() => {
    stackNav?.navigate("Profile" as any);
  }, [stackNav]);

  const openNotifications = useCallback(() => {
    stackNav?.navigate("Notifications" as any);
  }, [stackNav]);

  const toggleCamera = useCallback(() => {
    setType((t) => (t === "back" ? "front" : "back"));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash((f) => (f === "off" ? "on" : "off"));
  }, []);

  const takePhoto = useCallback(async () => {
    setError(null);
    try {
      if (!cameraRef.current) return;
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (pic?.uri) setCapturedUri(pic.uri);
    } catch (e: any) {
      setError(e?.message || "Could not take photo");
    }
  }, []);

  const discard = useCallback(() => {
    setCapturedUri(null);
    setSendOpen(false);
    setError(null);
  }, []);

  const saveToLibrary = useCallback(async () => {
    if (!capturedUri) return;
    setError(null);
    try {
      if (!libPerm?.granted) {
        const r = await requestLibPerm();
        if (!r.granted) {
          setError("Photo library permission denied");
          return;
        }
      }
      await MediaLibrary.saveToLibraryAsync(capturedUri);
      setError("Saved ✅");
    } catch (e: any) {
      setError(e?.message || "Could not save");
    }
  }, [capturedUri, libPerm, requestLibPerm]);

  const pickFromLibrary = useCallback(async () => {
    setError(null);
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (!r.canceled && r.assets?.[0]?.uri) {
        setCapturedUri(r.assets[0].uri);
      }
    } catch (e: any) {
      setError(e?.message || "Could not open gallery");
    }
  }, []);

  const openSend = useCallback(async () => {
    setError(null);
    setSendOpen(true);
    try {
      const data = await listChats();
      setChats(data);
    } catch (e: any) {
      setChats([]);
      setError(e?.message || "Could not load chats (is your API running?)");
    }
  }, []);

  const sendToChat = useCallback(
    async (chatId: string) => {
      if (!capturedUri) return;
      setSendBusy(true);
      setError(null);
      try {
        // Default Snap-like behavior: disappearing by default (24h)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await sendImage(chatId, capturedUri, expiresAt);
        discard();
        stackNav?.navigate("Chat" as any, { chatId });
      } catch (e: any) {
        setError(e?.message || "Could not send");
      } finally {
        setSendBusy(false);
      }
    },
    [capturedUri, discard, stackNav]
  );

  const headerTitle = useMemo(() => (capturedUri ? "Preview" : "SnapLite"), [capturedUri]);

  // Permission UI
  if (!canUseCamera) {
    return (
      <View style={{ flex: 1, backgroundColor: "black", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ color: "white", fontWeight: "800", marginBottom: 8 }}>Camera access needed</Text>
        <Text style={{ color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: 14 }}>
          SnapLite needs permission to use the camera.
        </Text>
        <Pressable
          onPress={() => requestCamPerm()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            backgroundColor: "white",
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 14,
          })}
        >
          <Text style={{ fontWeight: "800" }}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Top controls (Snap-like) */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <IconButton icon="account-circle" iconColor="white" onPress={openProfile} accessibilityLabel="Open profile" />
          <IconButton
            icon="magnify"
            iconColor="white"
            onPress={() => navigation.navigate("People" as any)}
            accessibilityLabel="Search / add friends"
          />
          {/* ✅ FIX: navigate to Notifications screen */}
          <IconButton icon="bell-outline" iconColor="white" onPress={openNotifications} accessibilityLabel="Notifications" />
          <IconButton
            icon="dots-horizontal"
            iconColor="white"
            onPress={() => stackNav?.navigate("Settings" as any)}
            accessibilityLabel="Menu"
          />
        </View>

        <Text style={{ color: "white", opacity: 0.9, fontWeight: "800", letterSpacing: 0.4 }}>{headerTitle}</Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {!capturedUri ? (
            <>
              <IconButton icon={flash === "on" ? "flash" : "flash-off"} iconColor="white" onPress={toggleFlash} />
              <IconButton icon="camera-flip-outline" iconColor="white" onPress={toggleCamera} />
            </>
          ) : (
            <IconButton icon="close" iconColor="white" onPress={discard} />
          )}
        </View>
      </View>

      {/* Main view: Camera OR Preview */}
      <View style={{ flex: 1 }}>
        {capturedUri ? (
          <Image source={{ uri: capturedUri }} style={{ flex: 1 }} resizeMode="cover" />
        ) : (
          <CameraView
            ref={(r) => {
              cameraRef.current = r;
            }}
            style={{ flex: 1 }}
            facing={type}
            flash={flash}
          />
        )}
      </View>

      {/* Errors / status */}
      {error ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 12, right: 12, top: insets.top + 52 }}>
          <View style={{ backgroundColor: "rgba(0,0,0,0.55)", padding: 10, borderRadius: 14 }}>
            <Text style={{ color: "white" }}>{error}</Text>
          </View>
        </View>
      ) : null}

      {/* Bottom controls */}
      <View style={{ paddingBottom: 22, paddingHorizontal: 18 }}>
        {/* Capture button */}
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Pressable
            onPress={capturedUri ? openSend : takePhoto}
            style={({ pressed }) => ({
              opacity: pressed ? 0.75 : 1,
              width: 78,
              height: 78,
              borderRadius: 39,
              borderWidth: 5,
              borderColor: "white",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: "white",
                opacity: capturedUri ? 0.85 : 0.95,
              }}
            />
          </Pressable>

          <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 8 }}>{capturedUri ? "Tap to Send" : "Tap to Snap"}</Text>
        </View>

        {/* Quick actions row */}
        <View
          style={{
            marginTop: 10,
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <IconButton icon="image-outline" iconColor="white" onPress={pickFromLibrary} />
          <IconButton
            icon={capturedUri ? "content-save-outline" : "emoticon-outline"}
            iconColor="white"
            onPress={capturedUri ? saveToLibrary : undefined}
          />
          <IconButton icon="cog-outline" iconColor="white" onPress={openProfile} />
        </View>
      </View>

      {/* Send modal */}
      <Portal>
        <Modal
          visible={sendOpen}
          onDismiss={() => setSendOpen(false)}
          contentContainerStyle={{
            marginHorizontal: 14,
            backgroundColor: theme.colors.surface,
            borderRadius: 18,
            paddingVertical: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 }}>
            <Text style={{ fontWeight: "800" }}>Send to…</Text>
            <IconButton icon="close" onPress={() => setSendOpen(false)} />
          </View>

          <Divider />

          {chats.length ? (
            chats.slice(0, 20).map((c) => (
              <List.Item
                key={c._id}
                title={c.title || "Chat"}
                description={c.lastMessage ? String(c.lastMessage).slice(0, 40) : "Tap to send"}
                left={(p) => <List.Icon {...p} icon="chat" />}
                onPress={() => (sendBusy ? null : sendToChat(c._id))}
              />
            ))
          ) : (
            <View style={{ padding: 14 }}>
              <Text style={{ opacity: 0.75 }}>No chats yet. Create a chat from the Chats tab first.</Text>
            </View>
          )}

          <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
            <Text style={{ opacity: 0.6, fontSize: 12 }}>
              Demo note: images are stored as a URI. For real production apps, you’d upload to cloud storage.
            </Text>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}
