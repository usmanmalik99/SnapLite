import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Alert } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";
import * as Location from "expo-location";
import MapView, { Marker, Region } from "react-native-maps";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../navigation/MainTabs";
import { logout } from "../services/auth";
import { listFriendLocations, updateMyLocation, FriendLocation } from "../services/location";

type Props = BottomTabScreenProps<MainTabParamList, "Map">;

export default function MapScreen({ navigation }: Props) {
  const theme = useTheme();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [friends, setFriends] = useState<FriendLocation[]>([]);

  const region: Region | null = useMemo(() => {
    if (!coords) return null;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [coords]);

  const loadLocation = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const next = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setCoords(next);
      // save latest location for friends (if you are sharing with anyone)
      try { await updateMyLocation(next.latitude, next.longitude); } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to get location");
    } finally {
      setBusy(false);
    }
  }, []);


  const loadFriends = useCallback(async () => {
    try {
      const data = await listFriendLocations();
      setFriends(data);
    } catch {
      // silent (map should still work if API is down)
    }
  }, []);

  useEffect(() => {
    loadLocation();
    loadFriends();
  }, [loadLocation, loadFriends]);

  // keep map live (like Snap Map): refresh my position + friend markers
  useEffect(() => {
    const t = setInterval(async () => {
      await loadLocation();
      await loadFriends();
    }, 12000);
    return () => clearInterval(t);
  }, [loadLocation, loadFriends]);

  const openMenu = useCallback(() => {
    Alert.alert("Map", "", [
      {
        text: "Refresh location",
        onPress: () => loadLocation(),
      },
      {
        text: "Who can see me?",
        onPress: () => Alert.alert("Tip", "Open a chat → tap the menu (⋯) → Share Location to share with a friend."),
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.getParent()?.navigate("Login" as never);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [coords, loadLocation, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* FULL SCREEN MAP */}
      {region ? (
        <MapView
          style={ABSOLUTE_FILL}
          region={region}
          showsUserLocation
          showsMyLocationButton={false} // keep it clean like Snap
        >
          <Marker coordinate={coords!} title="You" />

          {friends.map((f) => {
            if (!f.location) return null;
            const lat = (f.location as any).lat;
            const lng = (f.location as any).lng;
            if (typeof lat !== "number" || typeof lng !== "number") return null;
            const label = f.username || `${f.firstName || ""} ${f.lastName || ""}`.trim() || "Friend";
            return (
              <Marker
                key={f.id}
                coordinate={{ latitude: lat, longitude: lng }}
                title={label}
                description={"Sharing location"}
              />
            );
          })}
        </MapView>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", opacity: 0.85 }}>
            Getting your location…
          </Text>
        </View>
      )}

      {/* TOP-LEFT PROFILE BUTTON (floating) */}
      <View style={{ position: "absolute", top: 44, left: 12 }}>
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.45)",
            borderRadius: 999,
          }}
        >
          <IconButton
            icon="account-circle"
            iconColor="#fff"
            size={28}
            onPress={() => navigation.getParent()?.navigate("Profile" as never)}
          />
        </View>
      </View>

      {/* TOP-RIGHT MENU BUTTON (floating) */}
      <View style={{ position: "absolute", top: 44, right: 12 }}>
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.45)",
            borderRadius: 999,
          }}
        >
          <IconButton
            icon="dots-vertical"
            iconColor="#fff"
            size={26}
            onPress={openMenu}
          />
        </View>
      </View>

      {/* BOTTOM ERROR CHIP */}
      {error ? (
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 18,
            backgroundColor: "rgba(0,0,0,0.60)",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: "#fff" }}>{error}</Text>
        </View>
      ) : null}

      {/* OPTIONAL: tiny loading chip when refreshing */}
      {busy ? (
        <View
          style={{
            position: "absolute",
            alignSelf: "center",
            bottom: error ? 70 : 18,
            backgroundColor: "rgba(0,0,0,0.60)",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: "#fff", opacity: 0.9 }}>Updating…</Text>
        </View>
      ) : null}
    </View>
  );
}

const ABSOLUTE_FILL = {
  position: "absolute" as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
