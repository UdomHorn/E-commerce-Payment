import React from 'react'
import { Link } from 'react-router-dom'
import { useFavorites } from '../../context/FavoritesContext'

const HightLightCard = ({ page, src, price, title, product }) => {
  const { toggleFavorite, isFavorite } = useFavorites();

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
          {product && (
            <button
              onClick={() => toggleFavorite(product)}
              className={`cursor-pointer transition-colors duration-200 focus:outline-none ${
                isFavorite(product.id) ? 'text-red-500' : 'text-gray-300 hover:text-gray-500'
              }`}
              aria-label="Favorite"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill={isFavorite(product.id) ? "currentColor" : "none"} 
                viewBox="0 0 24 24" 
                strokeWidth="1.5" 
                stroke="currentColor" 
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </button>
          )}
        </div>
        <p className='text-xs text-gray-600 mt-0.5 truncate'>{title}</p>
      </div>
    </div>
  )
}

export default HightLightCard