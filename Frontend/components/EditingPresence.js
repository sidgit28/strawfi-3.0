import React from 'react';
import { usePresence } from '../hooks/usePresence';

export function EditingPresence({ researchId }) {
  const { editors, isConnected } = usePresence(researchId);

  if (!isConnected || editors.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <div className="flex items-center">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
        <span>
          {editors.length === 1
            ? `${editors[0]} is editing...`
            : `${editors.length} people are editing...`}
        </span>
      </div>
    </div>
  );
} 