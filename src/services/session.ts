import * as SecureStore from "expo-secure-store";

// Single-device login support:
// We generate a stable device id once and send it to the API so the backend can
// detect logins from another device.
const DEVICE_ID_KEY = "snaplite_device_id";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export async function setSession(token: string, user: SessionUser) {
  await SecureStore.setItemAsync("snaplite_token", token);
  await SecureStore.setItemAsync("snaplite_user", JSON.stringify(user));
}

export async function clearSession() {
  await SecureStore.deleteItemAsync("snaplite_token");
  await SecureStore.deleteItemAsync("snaplite_user");
}

export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("snaplite_token");
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = await SecureStore.getItemAsync("snaplite_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function getDeviceId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existing) return existing;

    // Expo-safe id (no native crypto dependency required)
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    return id;
  } catch {
    // If SecureStore fails for some reason, fall back to an in-memory-ish id.
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
