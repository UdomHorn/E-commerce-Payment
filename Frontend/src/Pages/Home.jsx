import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Collection from '../assets/Components/Collection'
import HightLightCard from '../assets/Components/HightLightCard'
import API_BASE from '../config'

const Home = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState(null); // start as null to prevent flash
  const [womenBanner, setWomenBanner] = useState(null);
  const [menBanner, setMenBanner] = useState(null);

  // Re-enable transition after snap-back
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  const handleDotClick = (targetIndex) => {
    if (!banners || targetIndex === currentIndex) return;

    if (targetIndex === 0 && currentIndex === banners.length - 1) {
      // Slide forward to cloned slide
      setIsTransitioning(true);
      setCurrentIndex(banners.length);
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
      }, 1000);
    } else {
      setIsTransitioning(true);
      setCurrentIndex(targetIndex);
    }
  };

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
          setWomenBanner(women ? women.imageUrl : "");
          const men = data.find(b => b.category === 'Men');
          setMenBanner(men ? men.imageUrl : "");
        } else {
          setWomenBanner("");
          setMenBanner("");
        }
      } catch (err) {
        console.error('Failed to fetch category banners:', err);
        setWomenBanner("");
        setMenBanner("");
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
            const filtered = data
              .filter(b => b.order === 1 || b.order === 2)
              .sort((a, b) => a.order - b.order);
            setBanners(filtered);
          } else {
            setBanners([]);
          }
        } else {
          setBanners([]);
        }
      } catch (err) {
        console.error('Failed to fetch banners:', err);
        setBanners([]);
      }
    };
    fetchBanners();
  }, []);

  // Banner Slideshow rotation
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex === banners.length) {
        // Slide forward to cloned slide
        setIsTransitioning(true);
        setCurrentIndex(banners.length);
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex(0);
        }, 1000);
      } else {
        setIsTransitioning(true);
        setCurrentIndex(nextIndex);
      }
    }, 3500); // Change every 3.5 seconds

    return () => clearInterval(interval);
  }, [banners, currentIndex]);

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
      <div className="w-full overflow-hidden bg-gray-100 h-[calc(100vh-48px)] relative">
        {banners === null ? (
          // Shimmer/Skeleton loader while fetching
          <div className="w-full h-full bg-neutral-100 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Loading Banners...</span>
          </div>
        ) : banners.length > 0 ? (
          <>
            <div 
              className={`flex w-full h-full ${isTransitioning ? 'transition-transform duration-1000 ease-in-out' : ''}`}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {/* Render original banners + a cloned first banner at the end to slide forward seamlessly */}
              {[...banners, banners[0]].map((banner, i) => (
                <div key={banner.id ? `${banner.id}-${i}` : i} className="w-full h-full flex-shrink-0">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || 'banner'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* Carousel dots indicators */}
            {banners.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                {banners.map((_, i) => {
                  const isActive = (currentIndex % banners.length) === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleDotClick(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        isActive ? 'bg-black w-6' : 'bg-black/30 hover:bg-black/50'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Collection Categories */}
      <div className='w-[75%] max-md:w-[94%] h-full flex justify-center items-center m-auto mt-4 gap-7'>
        <div className="flex-1">
          {womenBanner === null ? (
            <div className="w-full aspect-[4/5] bg-neutral-100 animate-pulse rounded-none flex items-center justify-center text-xs font-semibold text-gray-400">Loading...</div>
          ) : (
            <Link to="/Women" className="hover:opacity-95 transition block">
              <Collection src={womenBanner} title="Women Collection" />
            </Link>
          )}
        </div>
        <div className="flex-1">
          {menBanner === null ? (
            <div className="w-full aspect-[4/5] bg-neutral-100 animate-pulse rounded-none flex items-center justify-center text-xs font-semibold text-gray-400">Loading...</div>
          ) : (
            <Link to="/Men" className="hover:opacity-95 transition block">
              <Collection src={menBanner} title="Men Collection" />
            </Link>
          )}
        </div>
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