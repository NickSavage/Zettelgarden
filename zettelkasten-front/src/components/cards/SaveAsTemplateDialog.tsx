import React, { useState } from "react";
import { saveAsTemplate } from "../../api/templates";
import { Button } from "../Button";

interface SaveAsTemplateDialogProps {
    body: string;
    title?: string;
    onClose: () => void;
    onSuccess: (message: string) => void;
}

export function SaveAsTemplateDialog({ body, title: cardTitle = "", onClose, onSuccess }: SaveAsTemplateDialogProps) {
    const [title, setTitle] = useState(cardTitle);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (!title.trim()) {
            setError("Please enter a title for the template");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await saveAsTemplate(title, body);
            onSuccess("Template saved successfully");
            onClose();
        } catch (err) {
            setError("Failed to save template");
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Save as Template</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="template-title" className="block text-sm font-medium text-gray-700 mb-1">
                            Template Title
                        </label>
                        <input
                            id="template-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter a title for this template"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                        <Button 
                            onClick={onClose} 
                            variant="outline"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-palette-dark text-white font-semibold rounded hover:bg-palette-darkest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Save Template"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
