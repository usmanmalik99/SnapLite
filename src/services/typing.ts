import { api } from "./api";

export async function setTyping(chatId: string, isTyping: boolean) {
  return api(`/api/chats/${chatId}/typing`, { method: "POST", json: { isTyping } });
}

export async function getTyping(chatId: string): Promise<{ typingUserIds: string[] }> {
  return api(`/api/chats/${chatId}/typing`, { method: "GET" });
}
