// src/features/SuggestionList.tsx

import React from 'react';

interface Suggestion {
  id: string;
  title: string;
  link: string;
}

interface SuggestionListProps {
  suggestions: Suggestion[];
}

const SuggestionList: React.FC<SuggestionListProps> = ({ suggestions }) => {
  if (suggestions.length === 0) {
    return <p>Nenhuma sugestão encontrada.</p>;
  }

  return (
    <div className="suggestions-list">
      <h2>Sugestões de Jurisprudência</h2>
      <ul>
        {suggestions.map((suggestion) => (
          <li key={suggestion.id}>
            <a href={suggestion.link} target="_blank" rel="noopener noreferrer">
              {suggestion.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SuggestionList;

