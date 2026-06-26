import React from 'react';

const Size = ({ allSizes, sizes, selectedSize, onSelectSize, modelInfo, sizeStockMap, onOpenSizeGuide, sizeError }) => {
  // Use allSizes if provided (shows out-of-stock), fallback to sizes for compatibility
  const displaySizes = allSizes || sizes || [];
  if (displaySizes.length === 0) return null;

  // A size is in-stock if it appears in the `sizes` (in-stock only) list
  const inStockSet = new Set(sizes || []);

  return (
    <div className={`flex flex-col gap-3 ${sizeError ? 'animate-shake' : ''}`}>

      {/* Header row: "Size" label + Size Guide link */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Size</span>
        {onOpenSizeGuide && (
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="text-xs text-gray-500 underline underline-offset-2 hover:text-black transition-colors duration-150 cursor-pointer bg-transparent border-none p-0 font-normal"
          >
            Size guide
          </button>
        )}
      </div>

      {/* Size error message */}
      {sizeError && (
        <p className="text-xs text-red-600 font-medium -mt-1">
          Please select a size
        </p>
      )}

      {/* Size buttons grid */}
      <div className="flex flex-wrap gap-2">
        {displaySizes.map((size, idx) => {
          const isSelected = selectedSize === size;
          const isInStock = inStockSet.has(size);
          const stockCount = sizeStockMap ? (sizeStockMap[size] ?? null) : null;
          const isLowStock = isInStock && stockCount !== null && stockCount > 0 && stockCount <= 3;

          return (
            <div key={idx} className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                onClick={() => isInStock && onSelectSize && onSelectSize(size)}
                disabled={!isInStock}
                title={!isInStock ? `${size} — Out of stock` : size}
                className={`relative w-14 h-12 border text-sm font-medium transition-all duration-150 select-none overflow-hidden
                  ${isSelected
                    ? 'border-black bg-black text-white'
                    : isInStock
                      ? 'border-gray-300 bg-white text-black hover:border-black cursor-pointer'
                      : 'border-gray-200 bg-white text-gray-300 cursor-not-allowed'
                  }`}
              >
                {size}

                {/* Diagonal strikethrough line for out-of-stock sizes */}
                {!isInStock && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="100%" x2="100%" y2="0" stroke="#d1d5db" strokeWidth="1" />
                  </svg>
                )}
              </button>

              {/* Low stock badge */}
              {isLowStock && (
                <span className="text-[10px] text-red-500 font-semibold leading-none whitespace-nowrap">
                  Only {stockCount} left
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Model info line */}
      {modelInfo && (
        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
          <div className="w-3 h-3 bg-black flex-shrink-0" />
          <span>{modelInfo}</span>
        </div>
      )}
    </div>
  );
};

export default Size;