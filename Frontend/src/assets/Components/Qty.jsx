import React from 'react';

const Qty = ({ qty, setQty, max }) => {
  const decrease = () => {
    if (qty > 1) {
      setQty(qty - 1);
    }
  };

  const increase = () => {
    if (max !== undefined && qty >= max) return;
    setQty(qty + 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-lg font-bold text-gray-900">Qty</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrease}
          className="w-12 h-10 bg-gray-100 hover:bg-gray-200 text-lg font-bold rounded-lg flex items-center justify-center cursor-pointer select-none transition border-none"
        >
          -
        </button>
        <div className="w-14 h-10 bg-gray-100 text-center font-bold text-lg rounded-lg flex items-center justify-center select-none">
          {qty}
        </div>
        <button
          type="button"
          onClick={increase}
          disabled={max !== undefined && qty >= max}
          className={`w-12 h-10 bg-gray-100 text-lg font-bold rounded-lg flex items-center justify-center select-none transition border-none ${
            max !== undefined && qty >= max ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-200 cursor-pointer'
          }`}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Qty;