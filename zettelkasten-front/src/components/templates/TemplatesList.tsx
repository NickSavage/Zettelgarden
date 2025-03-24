import React, { useState, useEffect } from "react";
import { getTemplates, deleteTemplate } from "../../api/templates";
import { CardTemplate } from "../../models/Card";
import { TemplateVariablesHelp } from "./TemplateVariablesHelp";

interface TemplatesListProps {
  onTemplateDeleted?: () => void;
}

export function TemplatesList({ onTemplateDeleted }: TemplatesListProps) {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const fetchedTemplates = await getTemplates();
      setTemplates(fetchedTemplates);
      setError("");
    } catch (err) {
      setError("Failed to load templates");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTemplate(id: number) {
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate(id);
        setTemplates(templates.filter(template => template.id !== id));
        if (onTemplateDeleted) {
          onTemplateDeleted();
        }
      } catch (err) {
        setError("Failed to delete template");
        console.error(err);
      }
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading templates...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (templates.length === 0) {
    return <div className="text-gray-600">No templates found. Create templates by clicking "Save as Template" when editing a card.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-medium">Your Templates</h3>
        <TemplateVariablesHelp />
      </div>
      <div className="space-y-2">
        {templates.map((template) => (
          <div key={template.id} className="flex justify-between items-center p-3 border rounded-md bg-white">
            <div>
              <h4 className="font-medium">{template.title}</h4>
              <p className="text-sm text-gray-600">
                Created: {new Date(template.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleDeleteTemplate(template.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
