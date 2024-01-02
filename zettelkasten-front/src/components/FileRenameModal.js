import React, { useState, useEffect } from 'react';

export function FileRenameModal ({ isOpen, onClose, onRename, file }) {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isOpen && file) {
      setNewName(file["name"]);
    }
  }, [isOpen, file]);

  if (!isOpen) return null;
    console.log(file);
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
          <button onClick={() => onRename(file, newName)}>Rename</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};
