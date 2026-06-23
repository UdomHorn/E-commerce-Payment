import React from 'react';

const AddtoBag = ({ onClick, disabled, label = 'Add to bag' }) => {
  return (
    <button 
      type="button"
      onClick={disabled ? null : onClick} 
      disabled={disabled}
      className={`w-full py-4 mt-6 mb-20 text-center font-bold select-none border-none rounded-lg text-lg outline-none transition-all duration-300 ${
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
          : 'bg-black hover:bg-black/95 text-white cursor-pointer active:scale-[0.99] transition-transform'
      }`}
    >
      {label}
    </button>
  );
};

export default AddtoBag;