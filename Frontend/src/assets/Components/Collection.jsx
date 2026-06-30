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
      <div className='flex justify-center items-center text-center mt-3'>
        <div className='w-[94%] font-roboto font-bold text-base p-3 border border-gray-500 hover:bg-black hover:text-white transition-all duration-200'>{title}</div>
      </div>
    </div>
  )
}

export default Collection