import React, { useState, useEffect } from "react";
import { CardTemplate } from "../../models/Card";
import { getTemplates } from "../../api/templates";
import { Button } from "../Button";

interface TemplateSelectorProps {
    onSelectTemplate: (template: CardTemplate) => void;
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<CardTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    async function fetchTemplates() {
        try {
            const fetchedTemplates = await getTemplates();
            setTemplates(fetchedTemplates);
            setLoading(false);
        } catch (err) {
            setError("Failed to load templates");
            setLoading(false);
        }
    }

    if (loading) return <div>Loading templates...</div>;
    if (error) return <div className="text-red-600">{error}</div>;
    if (templates.length === 0) return null;

    return (
        <div className="relative">
            <Button 
                onClick={() => setShowDropdown(!showDropdown)}
                variant="secondary"
            >
                Use Template
            </Button>
            
            {showDropdown && (
                <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                    onSelectTemplate(template);
                                    setShowDropdown(false);
                                }}
                            >
                                {template.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
