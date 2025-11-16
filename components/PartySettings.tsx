import React from 'react';
import { PartyData } from '../types';
import { TrashIcon } from './Icons';

interface PartySettingsProps {
  party: PartyData;
  onVoteChange: (id: number, votes: number) => void;
  onNameChange: (id: number, name: string) => void;
  onRemove: (id: number) => void;
  readOnly?: boolean;
  maxVotes: number;
}

const PartySettings: React.FC<PartySettingsProps> = ({ party, onVoteChange, onNameChange, onRemove, readOnly = false, maxVotes }) => {
  // Use a non-linear scale for the slider to improve usability with large numbers.
  // The slider's value will be the square root of the actual vote count.
  const sliderMax = Math.sqrt(maxVotes);
  const sliderValue = Math.sqrt(party.votes);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSliderValue = parseFloat(e.target.value);
    const newVotes = Math.round(newSliderValue * newSliderValue);
    onVoteChange(party.id, newVotes);
  };

  return (
    <div className={`p-3 bg-gray-700/50 rounded-lg border border-gray-600 ${readOnly ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-center mb-2">
         <input
            type="text"
            value={party.name}
            onChange={(e) => onNameChange(party.id, e.target.value)}
            readOnly={readOnly}
            className="bg-transparent text-sm text-white w-full mr-2 truncate"
            style={{ border: 'none', outline: 'none' }}
            title={party.name}
          />
        {!readOnly && (
            <button onClick={() => onRemove(party.id)} className="text-gray-500 hover:text-red-400">
              <TrashIcon className="w-4 h-4" />
            </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max={sliderMax}
          value={sliderValue}
          step={sliderMax / 1000} // Provide finer control with more steps
          onChange={handleSliderChange}
          disabled={readOnly}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
        <input
          type="number"
          value={party.votes}
          onChange={(e) => onVoteChange(party.id, parseInt(e.target.value, 10) || 0)}
          readOnly={readOnly}
          max={maxVotes}
          className="w-28 bg-gray-900 text-white p-1 rounded-md text-center text-sm"
        />
      </div>
    </div>
  );
};

export default PartySettings;