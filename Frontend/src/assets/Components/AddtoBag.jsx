import React from 'react';

const AddtoBag = ({ onClick, disabled, label = 'Add to bag' }) => {
  return (
    <button
      type="button"
      onClick={disabled ? null : onClick}
      disabled={disabled}
      className={`w-full py-4 text-center font-semibold text-sm tracking-widest uppercase select-none border-none rounded-none outline-none transition-all duration-200 ${
        disabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-black hover:bg-gray-900 text-white cursor-pointer active:scale-[0.995]'
      }`}
    >
      {label}
    </button>
  );
};

export default AddtoBag;