import React, { useState, useEffect } from 'react'
import HightLightCard from '../assets/Components/HightLightCard'
import API_BASE from '../config'

const Men = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/products`);
        if (response.ok) {
          const data = await response.json();
          // Filter products for Men category
          const menProducts = data.filter(p => p.category === 'Men');
          setProducts(menProducts);
        }
      } catch (err) {
        console.error('Error fetching men products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className='pt-[64px] font-roboto w-[80%] max-md:w-full mx-auto pb-16'>
      <div className='w-full text-3xl font-bold mb-8 px-1.5 py-2.5 border-b border-gray-100'>
        Men Collection
      </div>
      
      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">Loading products...</div>
      ) : products.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No products found in this category.</p>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 px-4'>
          {products.map((prod) => (
            <HightLightCard
              key={prod.id}
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

export default Men