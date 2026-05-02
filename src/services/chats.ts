import { api } from "./api";

export type Chat = {
  title: string;
  _id: string;
  members: string[];
  lastMessage?: string;
  lastMessageAt?: string | null;
  createdAt?: string;
};

export async function listChats(): Promise<Chat[]> {
  return api("/api/chats");
}

export async function createDirectChat(otherUserId: string): Promise<Chat> {
  return api("/api/chats/direct", { method: "POST", json: { otherUserId } });
}


export async function getChat(chatId: string): Promise<Chat> {
  return api(`/api/chats/${chatId}`);
}
