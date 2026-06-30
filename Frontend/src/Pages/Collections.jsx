import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CollectionProductCard from '../assets/Components/CollectionProductCard';
import API_BASE from '../config';

const Collections = () => {
  const [summerBanner, setSummerBanner] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    document.title = "Collections — Devclothes";
  }, []);

  useEffect(() => {
    const fetchHeroBanners = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/banners`);
        if (response.ok) {
          const data = await response.json();
          const slide1 = data.find(b => b.order === 1);
          setSummerBanner(slide1 ? slide1.imageUrl : "");
        }
      } catch (err) {
        console.error('Failed to fetch slideshow banners:', err);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/products`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };

    fetchHeroBanners();
    fetchProducts();
  }, []);

  return (
    <div className="pt-24 pb-20 font-roboto min-h-screen bg-white">
      {/* Summer Collection Campaign */}
      <div className="w-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row-reverse gap-10 md:gap-16 items-center">
        <div className="flex-1 w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-gray-50 relative group">
          {summerBanner === null ? (
            <div className="w-full h-full bg-neutral-100 animate-pulse flex items-center justify-center text-xs font-semibold text-gray-400">Loading...</div>
          ) : summerBanner ? (
            <img
              src={summerBanner}
              alt="Summer Campaign"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-[2000ms] ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-light">No Image Set</div>
          )}
        </div>
        <div className="w-full md:w-[380px] space-y-4 text-left">
          <h3 className="text-2xl md:text-3xl font-light text-neutral-900 tracking-wide font-inter">
            Summer Collection
          </h3>
          <p className="text-sm text-neutral-500 leading-relaxed font-light font-inter">
            A curated collection of lightweight essentials and timeless silhouettes, designed with modern simplicity and effortless comfort in mind.
          </p>
        </div>
      </div>

      {/* Collection Essentials Divider */}
      <div className="w-full max-w-6xl mx-auto px-6 mt-20 mb-8 border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-gray-900 tracking-wide uppercase">
          Collection Essentials
        </h3>
      </div>

      {/* Products Grid */}
      <div className="w-full max-w-6xl mx-auto px-6">
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No products found. Add products in the admin panel.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((prod) => (
              <CollectionProductCard
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
    </div>
  );
};

export default Collections;
