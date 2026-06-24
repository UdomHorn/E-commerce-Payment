import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faMagnifyingGlass, faHeart, faBagShopping, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from "framer-motion"
import logo from '../assets/Images/logo.png'
import { Link, useNavigate } from 'react-router-dom'
import API_BASE from '../config'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { useAuth } from '../context/AuthContext'

const Nav = () => {
  // const [showLogin, setShowLogin] = useState(false);
  // const [gender, setGender] = useState("");
  const { getCartCount } = useCart();
  const { getFavoritesCount } = useFavorites();
  const { user, openAuthModal, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  // Disable body scroll when search or menu is active
  useEffect(() => {
    if (showSearch || showMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSearch, showMenu]);

  // Handle Escape key to close search or menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowMenu(false);
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
            <button
              onClick={() => setShowMenu(true)}
              className='cursor-pointer p-1 hover:text-gray-600 transition-colors focus:outline-none'
              aria-label="Open menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
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
            <Link
              to="/favorites"
              className='cursor-pointer p-1 hover:text-gray-600 transition-colors relative flex items-center justify-center'
              aria-label="Favorites"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="1.5" 
                stroke="currentColor" 
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </Link>
            <Link
              to="/checkout"
              className='cursor-pointer p-1 hover:text-gray-600 transition-colors relative flex items-center justify-center'
              aria-label="Cart"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="1.5" 
                stroke="currentColor" 
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {getCartCount() > 0 && (
                <span className="absolute -bottom-3.5 text-black text-[12px] font-bold font-roboto leading-none">
                  {getCartCount()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Slide-out Burger Menu Sidebar */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            />

            {/* Sidebar Container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-[300px] bg-white shadow-2xl flex flex-col h-full"
            >
              {/* Sidebar Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                <div className="w-[100px]">
                  <Link to="/" onClick={() => setShowMenu(false)}>
                    <img src={logo} alt="Logo" />
                  </Link>
                </div>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-gray-500 hover:text-black transition-colors p-2 text-xl cursor-pointer focus:outline-none"
                  aria-label="Close menu"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-6 py-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <Link
                      to="/"
                      onClick={() => setShowMenu(false)}
                      className="text-lg font-medium text-gray-800 hover:text-black hover:pl-2 transition-all block py-2 border-b border-gray-50"
                    >
                      Home
                    </Link>
                  </div>
                  <div>
                    <Link
                      to="/Women"
                      onClick={() => setShowMenu(false)}
                      className="text-lg font-medium text-gray-800 hover:text-black hover:pl-2 transition-all block py-2 border-b border-gray-50"
                    >
                      Women Collection
                    </Link>
                  </div>
                  <div>
                    <Link
                      to="/Men"
                      onClick={() => setShowMenu(false)}
                      className="text-lg font-medium text-gray-800 hover:text-black hover:pl-2 transition-all block py-2 border-b border-gray-50"
                    >
                      Men Collection
                    </Link>
                  </div>
                  {user?.role === 'admin' && (
                    <div>
                      <Link
                        to="/admin/upload"
                        onClick={() => setShowMenu(false)}
                        className="text-lg font-medium text-gray-800 hover:text-black hover:pl-2 transition-all block py-2 border-b border-gray-50"
                      >
                        Admin Portal
                      </Link>
                    </div>
                  )}
                  
                  {/* Authentication section in drawer */}
                  <div className="pt-4 border-t border-gray-100">
                    {user ? (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-500">
                          Signed in as <span className="font-semibold text-gray-800 block truncate">{user.email}</span>
                        </div>
                        <button
                          onClick={() => {
                            logout();
                            setShowMenu(false);
                          }}
                          className="w-full py-2.5 bg-black text-white hover:opacity-90 font-bold text-xs tracking-wide rounded-lg cursor-pointer transition-opacity focus:outline-none"
                        >
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          openAuthModal();
                        }}
                        className="w-full py-2.5 bg-black text-white hover:opacity-90 font-bold text-xs tracking-wide rounded-lg cursor-pointer transition-opacity focus:outline-none"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>

                {/* Sidebar Footer Info */}
                <div className="text-xs text-gray-400 space-y-2 mt-8 pt-6 border-t border-gray-100">
                  <p>&copy; {new Date().getFullYear()} TEN11. All rights reserved.</p>
                  <div className="flex gap-4">
                    <span className="hover:text-black cursor-pointer">Privacy Policy</span>
                    <span className="hover:text-black cursor-pointer">Terms of Service</span>
                  </div>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                  placeholder="Search products by name or SKU/code..."
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
                          <p className="text-sm text-gray-400">Try searching for another product name or SKU/code.</p>
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
