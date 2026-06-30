import React from 'react'
import { Link } from 'react-router-dom'

const CollectionProductCard = ({ page, src, price, title, product }) => {
  return (
    <div className="group relative flex flex-col bg-white">
      {/* Image Container */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50 border border-gray-100/50">
        <Link to={page} className="block w-full h-full">
          <img
            src={src}
            alt={title}
            className="w-full h-full object-cover object-top transition-transform duration-[1200ms] ease-out group-hover:scale-[1.01]"
          />
        </Link>
      </div>

      {/* Ultra-minimalist Details Footer */}
      <div className="mt-3 text-left space-y-0.5 px-1.5">
        <h4 className="text-[12px] font-light text-neutral-800 tracking-wide font-roboto">
          {product?.name || title}
        </h4>
        <span className="text-[11px] font-light text-neutral-450 font-roboto block">
          {price}
        </span>
      </div>
    </div>
  )
}

export default CollectionProductCard
