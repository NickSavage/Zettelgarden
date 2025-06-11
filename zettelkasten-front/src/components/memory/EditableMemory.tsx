import React, { useState } from "react";
import { MemoryDisplay } from "./MemoryDisplay";
import { updateUserMemory } from "../../api/users";

interface EditableMemoryProps {
  memory: string;
  onMemoryUpdate: (newMemory: string) => void;
}

export const EditableMemory: React.FC<EditableMemoryProps> = ({ 
  memory, 
  onMemoryUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMemory, setEditedMemory] = useState(memory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditedMemory(memory);
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditedMemory(memory);
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await updateUserMemory(editedMemory);
      onMemoryUpdate(editedMemory);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update memory');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your AI Memory</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Edit Memory</h3>
            <textarea
              value={editedMemory}
              onChange={(e) => setEditedMemory(e.target.value)}
              className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="Enter your memory content in markdown format..."
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Preview</h3>
            <div className="h-96 p-3 border border-gray-200 rounded-md overflow-y-auto bg-gray-50">
              {editedMemory ? (
                <MemoryDisplay memory={editedMemory} />
              ) : (
                <p className="text-gray-500 italic">No content to preview</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your AI Memory</h2>
        <button
          onClick={handleEdit}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Edit Memory
        </button>
      </div>
      
      {memory ? (
        <div className="prose max-w-none">
          <MemoryDisplay memory={memory} />
        </div>
      ) : (
        <p className="text-gray-600 italic">
          No memory content yet. Click "Edit Memory" to add some content.
        </p>
      )}
    </div>
  );
};
