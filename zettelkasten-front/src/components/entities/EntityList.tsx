import React, { useState, useEffect } from 'react';
import { Entity } from '../../models/Card';
import { fetchEntities } from '../../api/cards';
import { HeaderSection } from '../Header';

export function EntityList() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchEntities()
      .then((fetchedEntities) => {
        setEntities(fetchedEntities);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load entities');
        setLoading(false);
        console.error('Error fetching entities:', err);
      });
  }, []);

  if (loading) {
    return <div className="p-4">Loading entities...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4">
      <HeaderSection text="Entities" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities.map((entity) => (
          <div 
            key={entity.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{entity.name}</h3>
              <span className="text-sm px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                {entity.type}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-2">{entity.description}</p>
            
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Cards: {entity.card_count}</span>
              <span>
                Updated: {entity.updated_at.toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {entities.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No entities found
        </div>
      )}
    </div>
  );
}