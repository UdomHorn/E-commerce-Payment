import React from 'react'

const Collection = ({ src, title }) => {
  return (
    <div>
      <img src={src} alt="" />
      <div className='flex justify-center items-center text-center mt-3'>
        <div className=' w-[94%] font-roboto font-bold text-base p-3  border border-gray-500 '>{title}</div>
      </div>
    </div>
  )

}
export default Collection