import React, { useState, useEffect } from "react";
import { getMailingListMessages, MailingListMessage } from "../../api/mailingList";

export function AdminMailingListHistoryPage() {
  const [sentMessages, setSentMessages] = useState<MailingListMessage[]>([]);
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const messages = await getMailingListMessages();
        setSentMessages(messages || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setSentMessages([]);
      }
    };
    fetchData();
  }, []);

  const toggleMessageExpand = (messageId: number) => {
    setExpandedMessageId(expandedMessageId === messageId ? null : messageId);
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Mailing List Message History</h1>
      
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-left">Sent At</th>
                <th className="px-4 py-2 text-left">Recipients</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sentMessages.map((message) => (
                <React.Fragment key={message.id}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{message.subject}</td>
                    <td className="px-4 py-2">{new Date(message.sent_at).toLocaleString()}</td>
                    <td className="px-4 py-2">{message.total_recipients}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => toggleMessageExpand(message.id)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {expandedMessageId === message.id ? "Hide Content" : "Show Content"}
                      </button>
                    </td>
                  </tr>
                  {expandedMessageId === message.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-4">
                        <div className="whitespace-pre-wrap">{message.body}</div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {sentMessages.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                    No messages sent yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 