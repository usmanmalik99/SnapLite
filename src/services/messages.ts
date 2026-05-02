import { api } from "./api";

export type Message = {
  _id: string;
  chatId: string;
  senderId: string;
  type: "text" | "image" | "audio" | "file" | "location" | "screenshot";
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  location?: { lat: number; lng: number };
  sender?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  createdAt: string;
  expiresAt?: string | null;
};

export async function listMessages(chatId: string): Promise<Message[]> {
  return api(`/api/chats/${chatId}/messages`);
}

export async function sendText(chatId: string, text: string, expiresAt: string | null) {
  return api(`/api/chats/${chatId}/messages`, {
    method: "POST",
    json: { type: "text", text, expiresAt },
  });
}

export async function sendScreenshot(chatId: string) {
  return api(`/api/chats/${chatId}/messages`, {
    method: "POST",
    json: { type: "screenshot", text: "", expiresAt: null },
  });
}

export async function sendImage(chatId: string, mediaUrl: string, expiresAt: string | null) {
  return api(`/api/chats/${chatId}/messages`, {
    method: "POST",
    json: { type: "image", text: "", mediaUrl, expiresAt },
  });
}

export async function sendAudio(chatId: string, mediaUrl: string, expiresAt: string | null) {
  return api(`/api/chats/${chatId}/messages`, {
    method: "POST",
    json: { type: "audio", text: "Voice note", mediaUrl, expiresAt },
  });
}

export async function sendFile(chatId: string, mediaUrl: string, fileName: string, expiresAt: string | null) {
  return api(`/api/chats/${chatId}/messages`, {
    method: "POST",
    json: { type: "file", text: fileName || "Attachment", fileName, mediaUrl, expiresAt },
  });
}

export async function sendLocationMessage(chatId: string, lat: number, lng: number) {
  return api(`/api/chats/${chatId}/messages`, {
    method: "POST",
    json: { type: "location", text: "", location: { lat, lng }, expiresAt: null },
  });
}
