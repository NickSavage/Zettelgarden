import React, { useState, useEffect } from 'react';
import { Entity } from '../../models/Card';
import { fetchEntities } from '../../api/cards';
import { HeaderSection } from '../Header';
import { useNavigate } from 'react-router-dom';

export function EntityList() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([]);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'cards'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchEntities()
      .then((fetchedEntities) => {
        setEntities(fetchedEntities);
        setFilteredEntities(fetchedEntities);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load entities');
        setLoading(false);
        console.error('Error fetching entities:', err);
      });
  }, []);

  useEffect(() => {
    const filtered = entities.filter(entity => {
      const searchTerm = filterText.toLowerCase();
      return (
        entity.name.toLowerCase().includes(searchTerm) ||
        entity.type.toLowerCase().includes(searchTerm) ||
        entity.description.toLowerCase().includes(searchTerm)
      );
    });
    setFilteredEntities(filtered);
  }, [filterText, entities]);

  const handleEntityClick = (entity: Entity) => {
    navigate(`/app/search?term=@[${entity.name}]`);
  };

  const getSortedEntities = (entities: Entity[]) => {
    return [...entities].sort((a, b) => {
      if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortDirection === 'asc'
          ? a.card_count - b.card_count
          : b.card_count - a.card_count;
      }
    });
  };

  if (loading) {
    return <div className="p-4">Loading entities...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4">
      <HeaderSection text="Entities" />
      
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Filter entities..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={`${sortBy}-${sortDirection}`}
          onChange={(e) => {
            const [newSortBy, newDirection] = e.target.value.split('-') as ['name' | 'cards', 'asc' | 'desc'];
            setSortBy(newSortBy);
            setSortDirection(newDirection);
          }}
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="cards-desc">Most Cards</option>
          <option value="cards-asc">Least Cards</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getSortedEntities(filteredEntities).map((entity) => (
          <div 
            key={entity.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleEntityClick(entity)}
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

      {filteredEntities.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          {entities.length === 0 ? 'No entities found' : 'No matching entities'}
        </div>
      )}
    </div>
  );
}