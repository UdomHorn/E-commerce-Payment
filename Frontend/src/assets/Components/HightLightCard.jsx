import React from 'react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookmark } from '@fortawesome/free-solid-svg-icons'

const HightLightCard = ({ page, src, price, title }) => {
  const [isClick, setIsClick] = useState(false)
  return (
    <div className="group">
      <Link to={page}>
        {/* Fixed 3:4 aspect ratio container — all cards are uniform */}
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm">
          <img
            src={src}
            alt={title}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className='mt-2.5 px-1'>
        <div className='flex justify-between items-center'>
          <div className='font-bold text-sm text-black'>
            {price}
          </div>
          <div
            onClick={() => setIsClick(!isClick)}
            className={`cursor-pointer transition-colors duration-200 text-sm ${isClick ? 'text-yellow-400' : 'text-gray-300 hover:text-gray-500'}`}
          >
            <FontAwesomeIcon icon={faBookmark} />
          </div>
        </div>
        <p className='text-xs text-gray-600 mt-0.5 truncate'>{title}</p>
      </div>
    </div>
  )
}


export default HightLightCard