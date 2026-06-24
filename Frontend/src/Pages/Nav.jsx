import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faMagnifyingGlass, faBell, faGear, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from "framer-motion"
import logo from '../assets/Images/logo.png'
import { Link, useNavigate } from 'react-router-dom'
import API_BASE from '../config'

const Nav = () => {
  // const [showLogin, setShowLogin] = useState(false);
  // const [gender, setGender] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input and fetch initial products when search overlay opens
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      fetchFeaturedProducts();
    }
  }, [showSearch]);

  // Disable body scroll when search is active
  useEffect(() => {
    if (showSearch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSearch]);

  // Handle Escape key to close search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch featured products for empty state
  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      if (response.ok) {
        const data = await response.json();
        // Show first 4 products
        setFeaturedProducts(data.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to fetch featured products:', err);
    }
  };

  // Debounced search query fetching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/products?search=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Error searching products:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className='fixed w-full top-0 left-0 z-10'>
      <div className='w-full overflow-hidden bg-white flex justify-center items-center'>
        <div className='flex justify-between w-[80%] items-center p-2.5 max-md:w-full '>
          <div className='flex gap-2 items-center text-2xl '>
            <div className='cursor-pointer'>
              <FontAwesomeIcon icon={faBars} />
            </div>
            <div className='w-[120px] hidden max-md:block '>
              <Link to="/">
                <img src={logo} alt="" />
              </Link>
            </div>
          </div>

          <div className='w-[250px] max-md:hidden max-xl:w-[150px]'>
            <Link to="/">
              <img src={logo} alt="" />
            </Link>
          </div>

          <div className='flex text-xl gap-5 items-center'>
            <button
              onClick={() => setShowSearch(true)}
              className='cursor-pointer p-1 hover:text-gray-600 transition-colors focus:outline-none'
              aria-label="Search"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
            <div className='cursor-pointer p-1 hover:text-gray-600 transition-colors'>
              <FontAwesomeIcon icon={faBell} />
            </div>
            <div className='cursor-pointer p-1 hover:text-gray-600 transition-colors'>
              <FontAwesomeIcon icon={faGear} />
            </div>
            <div className='font-roboto cursor-pointer p-1 hover:text-gray-600 transition-colors'>
              Login
            </div>
          </div>
        </div>
      </div>

      {/* Modern Fullscreen Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md overflow-y-auto"
          >
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col min-h-screen">
              {/* Overlay Header */}
              <div className="flex justify-between items-center mb-12">
                <div className="w-[120px]">
                  <Link to="/" onClick={() => setShowSearch(false)}>
                    <img src={logo} alt="Logo" />
                  </Link>
                </div>
                <button
                  onClick={() => setShowSearch(false)}
                  className="text-gray-500 hover:text-black transition-colors p-2 text-2xl cursor-pointer focus:outline-none"
                  aria-label="Close search"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Search Bar Input */}
              <div className="relative w-full max-w-3xl mx-auto mb-10">
                <span className="absolute left-0 bottom-3 text-xl text-gray-400">
                  {loading ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-500" />
                  ) : (
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  )}
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-2xl font-light text-gray-800 placeholder-gray-400 pb-3 pl-8 border-b border-gray-300 focus:border-black focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-0 bottom-4 text-sm text-gray-400 hover:text-black transition-colors focus:outline-none cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Results / Suggestions Area */}
              <div className="flex-1 w-full max-w-5xl mx-auto pb-16">
                {searchQuery.trim() ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
                      Search Results ({searchResults.length})
                    </h3>
                    {searchResults.length === 0 ? (
                      !loading && (
                        <div className="text-center py-16">
                          <p className="text-lg text-gray-500 mb-2">No products found for "{searchQuery}"</p>
                          <p className="text-sm text-gray-400">Try searching for another product name.</p>
                        </div>
                      )
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.code || product.id}`}
                            onClick={() => setShowSearch(false)}
                            className="group"
                          >
                            <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50 rounded-sm mb-3 relative">
                              {product.images && product.images[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                />
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-gray-800 group-hover:text-black transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">${product.price.toFixed(2)}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="md:col-span-1 border-r border-gray-100 pr-6 max-md:border-r-0 max-md:pr-0">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Popular Collections
                      </h3>
                      <ul className="space-y-3">
                        <li>
                          <Link
                            to="/Women"
                            onClick={() => setShowSearch(false)}
                            className="text-base text-gray-600 hover:text-black transition-colors font-medium"
                          >
                            Women Collection
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/Men"
                            onClick={() => setShowSearch(false)}
                            className="text-base text-gray-600 hover:text-black transition-colors font-medium"
                          >
                            Men Collection
                          </Link>
                        </li>
                      </ul>
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
                        Recent Arrivals
                      </h3>
                      {featuredProducts.length === 0 ? (
                        <p className="text-sm text-gray-400">No products available.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {featuredProducts.map((product) => (
                            <Link
                              key={product.id}
                              to={`/product/${product.code || product.id}`}
                              onClick={() => setShowSearch(false)}
                              className="group flex gap-4 items-center p-2 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-gray-50 rounded-sm">
                                {product.images && product.images[0] && (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="h-full w-full object-cover object-center"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-800 group-hover:text-black transition-colors truncate">
                                  {product.name}
                                </h4>
                                <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                                <p className="text-sm font-semibold text-gray-900 mt-0.5">${product.price.toFixed(2)}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Nav