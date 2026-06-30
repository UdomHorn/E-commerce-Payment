import React from 'react'

const Collection = ({ src, title }) => {
  return (
    <div className="w-full">
      <div className="w-full aspect-[4/5] bg-gray-100 flex items-center justify-center overflow-hidden">
        {src ? (
          <img src={src} alt={title} className="w-full h-full object-cover transition-opacity duration-300" />
        ) : src === "" ? (
          <span className="text-gray-300 font-semibold tracking-wider text-xs uppercase">No Image Set</span>
        ) : (
          <span className="text-gray-400 font-medium">Loading Banner...</span>
        )}
      </div>
      <div className='flex justify-center items-center text-center mt-4 w-full'>
        <div className='w-full font-roboto font-bold text-sm sm:text-base py-3 border border-neutral-800 bg-white text-black hover:bg-black hover:text-white transition-all duration-300 tracking-wide'>{title}</div>
      </div>
    </div>
  )
}

export default Collection