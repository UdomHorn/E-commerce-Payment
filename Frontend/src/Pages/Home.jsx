import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Collection from '../assets/Components/Collection'
import HightLightCard from '../assets/Components/HightLightCard'
import API_BASE from '../config'

// Import default local fallback images
import defaultWomen from '../assets/Images/8J6A0448.jpg'
import defaultMen from '../assets/Images/8J6A0460.jpg'
import defaultSlide1 from '../assets/Images/TEN11 - Puppy Love Collection App Banner.jpg'
import defaultSlide2 from '../assets/Images/TEN11 - Grand Prix App banner.jpg'

const defaultBanners = [
  { imageUrl: defaultSlide1, title: 'Puppy Love Collection' },
  { imageUrl: defaultSlide2, title: 'Grand Prix' }
]

const Home = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState(defaultBanners);
  const [womenBanner, setWomenBanner] = useState(defaultWomen);
  const [menBanner, setMenBanner] = useState(defaultMen);

  // Set page title
  useEffect(() => {
    document.title = "Devclothes — Premium Streetwear & Apparel";
  }, []);

  // Fetch Category Banners
  useEffect(() => {
    const fetchCategoryBanners = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/banners/categories`);
        if (response.ok) {
          const data = await response.json();
          const women = data.find(b => b.category === 'Women');
          setWomenBanner(women ? women.imageUrl : defaultWomen);
          const men = data.find(b => b.category === 'Men');
          setMenBanner(men ? men.imageUrl : defaultMen);
        }
      } catch (err) {
        console.error('Failed to fetch category banners:', err);
      }
    };
    fetchCategoryBanners();
  }, []);

  // Fetch banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/banners`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setBanners(data);
          } else {
            setBanners(defaultBanners);
          }
        }
      } catch (err) {
        console.error('Failed to fetch banners:', err);
      }
    };
    fetchBanners();
  }, []);

  // Banner Slideshow rotation
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [banners]);

  // Fetch Products
  useEffect(() => {
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
    fetchProducts();
  }, []);

  return (
    <div className='pt-[48px] font-roboto'>
      {/* Banner Carousel */}
      <div className="w-full overflow-hidden bg-gray-100 h-[calc(100vh-48px)]">
        {banners.length > 0 && (
          <img src={banners[currentIndex]?.imageUrl}
            alt={banners[currentIndex]?.title || 'banner'}
            className="w-full h-full object-cover transition-all duration-[3000ms]"
          />
        )}
      </div>

      {/* Collection Categories */}
      <div className='w-[75%] max-md:w-[94%] h-full flex justify-center items-center m-auto mt-4 gap-7'>
        <Link to="/Women" className="hover:opacity-95 transition flex-1">
          <Collection src={womenBanner} title="Women Collection" />
        </Link>
        <Link to="/Men" className="hover:opacity-95 transition flex-1">
          <Collection src={menBanner} title="Men Collection" />
        </Link>
      </div>

      {/* Products Grid */}
      <div className="my-20 px-4 max-w-6xl mx-auto">
        <div className='w-full text-3xl font-bold mb-8 px-1.5 py-2.5 border-b border-gray-100'>
          New Arrivals
        </div>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No products found. Add products in the admin panel.</p>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            {products.map((prod) => (
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
    </div>
  )
}

export default Home