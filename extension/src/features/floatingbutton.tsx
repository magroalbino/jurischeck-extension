// src/features/FloatingButton.tsx

import React from 'react';

interface FloatingButtonProps {
  onClick: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 p-3 bg-blue-500 rounded-full shadow-lg text-white"
    >
      🡆
    </button>
  );
};

export default FloatingButton;

