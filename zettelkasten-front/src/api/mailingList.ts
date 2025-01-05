import { checkStatus } from "./common";

const base_url = import.meta.env.VITE_URL;

export interface SendMailingListMessageParams {
  subject: string;
  body: string;
  to_recipients: string[];
  bcc_recipients: string[];
}

export interface SendMailingListMessageResponse {
  success: boolean;
  message: string;
  recipientCount?: number;
}

export interface MailingListMessage {
  id: number;
  subject: string;
  body: string;
  sent_at: string;
  total_recipients: number;
}

export interface MailingListSubscriber {
  id: number;
  email: string;
  welcome_email_sent: boolean;
  subscribed: boolean;
  has_account: boolean;
  created_at: string;
  updated_at: string;
}

export async function getMailingListSubscribers(): Promise<MailingListSubscriber[]> {
  const url = `${base_url}/mailing-list`;
  const token = localStorage.getItem("token");

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<MailingListSubscriber[]>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export async function sendMailingListMessage(params: SendMailingListMessageParams): Promise<SendMailingListMessageResponse> {
  const url = `${base_url}/mailing-list/messages/send`;
  const token = localStorage.getItem("token");

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<SendMailingListMessageResponse>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export async function getMailingListMessages(): Promise<MailingListMessage[]> {
  const url = `${base_url}/mailing-list/messages`;
  const token = localStorage.getItem("token");

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<MailingListMessage[]>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
} 