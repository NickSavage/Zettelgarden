import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Entity, PartialCard } from "../../models/Card";
import { UpdateEntityRequest, updateEntity } from "../../api/entities";
import { BacklinkInput } from "../cards/BacklinkInput";
import { CardTag } from "../cards/CardTag";

interface EditEntityDialogProps {
  entity: Entity | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEntityDialog({ entity, isOpen, onClose, onSuccess }: EditEntityDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [linkedCard, setLinkedCard] = useState<PartialCard | null>(null);
  const [showCardLink, setShowCardLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setDescription(entity.description);
      setType(entity.type);
      setLinkedCard(entity.card || null);
    }
  }, [entity]);

  const handleBacklink = (card: PartialCard) => {
    setLinkedCard(card);
    setShowCardLink(false);
  };

  const handleRemoveCard = () => {
    setLinkedCard(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const data: UpdateEntityRequest = {
        name: name.trim(),
        description: description.trim(),
        type: type.trim(),
        card_pk: linkedCard?.id || null,
      };

      await updateEntity(entity.id, data);
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
      
      <Dialog.Panel className="bg-white p-6 rounded-lg max-w-md mx-auto relative">
        <Dialog.Title className="text-lg font-semibold mb-4">
          Edit Entity
        </Dialog.Title>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <input
                type="text"
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Linked Card
              </label>
              {linkedCard ? (
                <div className="flex items-center gap-2">
                  <CardTag card={linkedCard} showTitle={true} />
                  <button
                    type="button"
                    onClick={handleRemoveCard}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div>
                  {showCardLink ? (
                    <BacklinkInput addBacklink={handleBacklink} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCardLink(true)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      + Link Card
                    </button>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
} 