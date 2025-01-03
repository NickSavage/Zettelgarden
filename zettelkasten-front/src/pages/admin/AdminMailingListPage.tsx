import React, { useState, useEffect } from "react";
import { getMailingListSubscribers, MailingListSubscriber } from "../../api/users";

export function AdminMailingListPage() {
  const [subscribers, setSubscribers] = useState<MailingListSubscriber[]>([]);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const data = await getMailingListSubscribers();
        setSubscribers(data);
      } catch (error) {
        console.error("Error fetching subscribers:", error);
      }
    };
    fetchSubscribers();
  }, []);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">Mailing List Subscribers</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-2 px-4 text-left">ID</th>
              <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Welcome Email</th>
              <th className="py-2 px-4 text-left">Created At</th>
              <th className="py-2 px-4 text-left">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber) => (
              <tr key={subscriber.id} className="border-b hover:bg-gray-100">
                <td className="py-2 px-4">{subscriber.id}</td>
                <td className="py-2 px-4">{subscriber.email}</td>
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      subscriber.subscribed
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {subscriber.subscribed ? "Subscribed" : "Unsubscribed"}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      subscriber.welcome_email_sent
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {subscriber.welcome_email_sent ? "Sent" : "Pending"}
                  </span>
                </td>
                <td className="py-2 px-4">
                  {new Date(subscriber.created_at).toLocaleString()}
                </td>
                <td className="py-2 px-4">
                  {new Date(subscriber.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 