import { api } from "./api";

export type FriendLocation = {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email?: string;
  location: { lat: number; lng: number; updatedAt?: string | null } | null;
};

export async function updateMyLocation(lat: number, lng: number) {
  return api<{ ok: boolean }>("/api/location/update", { method: "POST", json: { lat, lng } });
}

export async function shareMyLocation(friendId: string, enabled: boolean) {
  return api<{ ok: boolean; enabled: boolean }>("/api/location/share", { method: "POST", json: { friendId, enabled } });
}

export async function getShareStatus(friendId: string) {
  return api<{ enabled: boolean }>(`/api/location/share-status/${friendId}`);
}

export async function listFriendLocations() {
  return api<FriendLocation[]>("/api/location/friends");
}
