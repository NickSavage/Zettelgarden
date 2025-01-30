import { ChatCompletion, ConversationSummary, LLMProvider, UserLLMConfiguration } from "../models/Chat";
import { PartialCard } from "../models/Card";
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
          console.log("messages", messages);
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
  contextCards?: PartialCard[],
  configurationId?: number
): Promise<ChatCompletion> {
  const token = localStorage.getItem("token");
  const url = `${base_url}/chat`; // Remove the ID from the URL
  console.log("message", content, conversationId, configurationId)

  const newMessage = {
    conversation_id: conversationId, // Will be undefined for new conversations
    user_query: content,
    referenced_card_pks: contextCards?.map((card) => card.id),
    configuration_id: configurationId, 
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

export function getUserConversations(): Promise<ConversationSummary[]> {
  const token = localStorage.getItem("token");
  const url = `${base_url}/chat`;

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json().then((conversations: ConversationSummary[]) => {
          return conversations.map((conversation) => ({
            ...conversation,
            created_at: new Date(conversation.created_at),
          }));
        });
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export function getUserLLMConfigurations(): Promise<UserLLMConfiguration[]> {
  const token = localStorage.getItem("token");
  const url = `${base_url}/llms/configurations`;

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json().then((configs: UserLLMConfiguration[]) => {
          return configs.map((config) => ({
            ...config,
            created_at: new Date(config.created_at),
            updated_at: new Date(config.updated_at),
            model: config.model ? {
              ...config.model,
              created_at: new Date(config.model.created_at),
              updated_at: new Date(config.model.updated_at),
              provider: config.model.provider ? {
                ...config.model.provider,
                created_at: new Date(config.model.provider.created_at),
                updated_at: new Date(config.model.provider.updated_at),
              } : undefined
            } : undefined
          }));
        });
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export function getUserLLMProviders(): Promise<LLMProvider[]> {
  const token = localStorage.getItem("token");
  const url = `${base_url}/llms/providers`;

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json().then((providers: LLMProvider[]) => {
          return providers.map((provider) => ({
            ...provider,
            created_at: new Date(provider.created_at),
            updated_at: new Date(provider.updated_at),
          }));
        });
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export function createLLMProvider(provider: LLMProvider): Promise<LLMProvider> {
  const token = localStorage.getItem("token");
  const url = `${base_url}/llms/providers`;

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(provider),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json();
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}
