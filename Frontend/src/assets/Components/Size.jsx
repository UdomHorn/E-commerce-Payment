import React from 'react';

const Size = ({ sizes, selectedSize, onSelectSize, modelInfo, sizeStockMap }) => {
  if (!sizes || sizes.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-lg font-bold text-gray-900">Size</div>
      
      <div className="flex flex-wrap gap-2.5">
        {sizes.map((size, idx) => {
          const isSelected = selectedSize === size;
          const stockCount = sizeStockMap ? (sizeStockMap[size] ?? null) : null;
          const isLowStock = stockCount !== null && stockCount > 0 && stockCount <= 3;

          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => onSelectSize && onSelectSize(size)}
                className={`w-14 h-12 border font-bold text-sm rounded-lg flex items-center justify-center transition-all duration-200 select-none ${
                  isSelected
                    ? 'bg-black border-black text-white shadow-md'
                    : 'bg-white border-gray-300 text-black hover:border-black hover:bg-gray-50'
                }`}
              >
                {size}
              </button>
              {isLowStock && (
                <span className="text-[10px] text-red-500 font-bold leading-none whitespace-nowrap">
                  Only {stockCount} left
                </span>
              )}
            </div>
          );
        })}
      </div>

      {modelInfo && (
        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
          <div className="w-4 h-4 bg-black flex-shrink-0"></div>
          <span>{modelInfo}</span>
        </div>
      )}
    </div>
  );
};

export default Size;