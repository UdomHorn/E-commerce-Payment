import React from 'react'

const Collection = ({ src, title }) => {
  return (
    <div className="w-full">
      {src ? (
        <img src={src} alt={title} className="w-full object-cover transition-opacity duration-300" />
      ) : (
        <div className="w-[450px] aspect-[4/5] max-md:w-full bg-gray-100 flex items-center justify-center text-gray-400 font-medium">
          Loading Banner...
        </div>
      )}
      <div className='flex justify-center items-center text-center mt-3'>
        <div className='w-[94%] font-roboto font-bold text-base p-3 border border-gray-500 hover:bg-black hover:text-white transition-all duration-200'>{title}</div>
      </div>
    </div>
  )
}

export default Collection