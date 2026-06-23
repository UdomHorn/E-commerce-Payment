import React from 'react';

const ColorAvailable = ({ colors, selectedColor, onSelectColor }) => {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-lg font-bold text-gray-900">
        {colors.length} Color{colors.length > 1 ? 's' : ''} available
      </div>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color, idx) => {
          const isSelected = selectedColor === color;
          return (
            <button
              type="button"
              key={idx}
              onClick={() => onSelectColor && onSelectColor(color)}
              className={`px-4 py-2 border text-sm font-semibold rounded-lg transition-all duration-200 select-none ${
                isSelected
                  ? 'bg-black border-black text-white shadow-md'
                  : 'bg-white border-gray-300 text-black hover:border-black hover:bg-gray-50'
              }`}
            >
              {color}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorAvailable;