// components/Chat/ConversationDialog.tsx
import React from "react";
import { Dialog } from "@headlessui/react";
import { ConversationSummary } from "../../models/Chat";

interface ConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationSummary[];
  onSelectConversation: (id: string) => void;
}

export function ConversationDialog({
  isOpen,
  onClose,
  conversations,
  onSelectConversation,
}: ConversationDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Conversations
          </Dialog.Title>

          <div className="max-h-[60vh] overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-4 hover:bg-gray-50 cursor-pointer border-b"
                onClick={() => {
                  onSelectConversation(conversation.id);
                  onClose();
                }}
              >
                <h3 className="font-medium text-gray-900">
                  {conversation.title || "Untitled Conversation"}
                </h3>
                <div className="mt-1 flex items-center text-sm text-gray-500 gap-2">
                  <span>
                    {new Date(conversation.created_at).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{conversation.message_count} messages</span>
                  <span>•</span>
                  <span>{conversation.model}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
