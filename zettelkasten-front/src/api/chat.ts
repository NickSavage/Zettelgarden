import { ChatCompletion } from "../models/Chat";

import { checkStatus } from "./common";

const base_url = import.meta.env.VITE_URL;

export function getChatConversation(
  conversationId: string,
): Promise<ChatCompletion[]> {
  const token = localStorage.getItem("token");
  const url = `${base_url}/chat/${encodeURIComponent(conversationId)}`;

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json().then((messages: ChatCompletion[]) => {
          return messages.map((message) => ({
            ...message,
            created_at: new Date(message.created_at),
          }));
        });
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}
export function postChatMessage(
  content: string,
  conversationId?: string, // Make conversationId optional and move it second
): Promise<ChatCompletion> {
  const token = localStorage.getItem("token");
  const url = `${base_url}/chat`; // Remove the ID from the URL
  console.log("message", content, conversationId)

  const newMessage = {
    conversation_id: conversationId, // Will be undefined for new conversations
    content,
  };

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newMessage),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json().then((message: ChatCompletion) => ({
          ...message,
          created_at: new Date(message.created_at),
        }));
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}
