import React from 'react'
import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import HightLightCard from '../assets/Components/HightLightCard'

const Favorites = () => {
  const { favorites } = useFavorites();

  return (
    <div className='pt-[64px] font-roboto w-[80%] max-md:w-full mx-auto pb-16 min-h-[70vh]'>
      <div className='w-full text-3xl font-bold mb-8 px-1.5 py-2.5 border-b border-gray-100 flex justify-between items-center'>
        <span>My Favorites</span>
        <span className='text-sm text-gray-500 font-normal'>
          {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-6">You haven't added any products to your favorites yet.</p>
          <Link
            to="/"
            className="px-6 py-2.5 bg-black text-white hover:opacity-90 transition font-medium text-sm rounded-sm"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 px-4'>
          {favorites.map((prod) => (
            <HightLightCard
              key={prod.id}
              product={prod}
              page={`/product/${prod.code || prod.id}`}
              src={prod.images && prod.images[0]}
              price={`$${prod.price.toFixed(2)}`}
              title={prod.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Favorites
