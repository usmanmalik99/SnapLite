import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { clearSession, getDeviceId } from "./session";

// API base URL
// - iOS Simulator can use http://127.0.0.1:5001
// - Real device must use your Mac LAN IP (same Wi‑Fi), e.g. http://10.0.0.188:5001
// This tries to auto-detect the Expo dev host IP and fall back safely.
function guessDevHost(): string | null {
  const hostUri: string | undefined =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.hostUri;

  if (!hostUri) return null;
  // hostUri examples: "10.0.0.188:8081" or "exp://10.0.0.188:8081"
  const cleaned = hostUri.replace(/^exp:\/\//, "");
  const host = cleaned.split(":")[0];
  return host || null;
}

const devHost = guessDevHost();
export const API_URL = devHost ? `http://${devHost}:5001` : "http://127.0.0.1:5001";

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("snaplite_token");
  } catch {
    return null;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { json?: any } = {}
): Promise<T> {
  const token = await getToken();
  const deviceId = await getDeviceId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as any),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (deviceId) headers["X-Device-Id"] = deviceId;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.json ? JSON.stringify(options.json) : options.body,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    err.code = data?.code;
    err.data = data;

    // If backend says this session is no longer valid (logged out elsewhere),
    // clear local session so the UI can take the user back to Login.
    if (res.status === 401 && (data?.code === "SESSION_EXPIRED" || data?.code === "SESSION_INVALID")) {
      await clearSession();
    }

    throw err;
  }

  return data as T;
}
