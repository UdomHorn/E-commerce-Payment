import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faBagShopping, faXmark, faSpinner, faBell, faTriangleExclamation, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from "framer-motion"
import logo from '../assets/logo/Devclothes.jpg'
import { Link, useNavigate } from 'react-router-dom'
import API_BASE from '../config'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const Nav = () => {
  // const [showLogin, setShowLogin] = useState(false);
  // const [gender, setGender] = useState("");
  const { getCartCount } = useCart();
  const { user, openAuthModal, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [hoveredCollection, setHoveredCollection] = useState('spring');
  const [hoveredSubcategory, setHoveredSubcategory] = useState('all');
  const [womenBanner, setWomenBanner] = useState("");
  const [menBanner, setMenBanner] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null);

  const inputRef = useRef(null);
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Admin Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Polling notifications for admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/notifications`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error('Error fetching admin notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s

    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.type === 'LOW_STOCK' && notif.metadata && notif.metadata.productId) {
      localStorage.setItem('adminRedirectProductId', notif.metadata.productId);
    } else if (notif.metadata && notif.metadata.orderId) {
      localStorage.setItem('adminRedirectOrderId', notif.metadata.orderId);
    }
    setShowNotifications(false);
    navigate('/admin/upload');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LOW_STOCK':
        return <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 text-base mt-0.5" />;
      case 'PAYMENT_FAILED':
        return <FontAwesomeIcon icon={faCircleExclamation} className="text-red-500 text-base mt-0.5" />;
      default: // NEW_ORDER
        return <FontAwesomeIcon icon={faBagShopping} className="text-blue-500 text-base mt-0.5" />;
    }
  };

  const formatRelativeTime = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch all products and category banners on mount
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/products`);
        if (response.ok) {
          const data = await response.json();
          setAllProducts(data);
          setFeaturedProducts(data.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to fetch products on mount:', err);
      }
    };

    const fetchCategoryBanners = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/banners/categories`);
        if (response.ok) {
          const data = await response.json();
          const women = data.find(b => b.category === 'Women');
          setWomenBanner(women ? women.imageUrl : "");
          const men = data.find(b => b.category === 'Men');
          setMenBanner(men ? men.imageUrl : "");
        }
      } catch (err) {
        console.error('Failed to fetch category banners in nav:', err);
      }
    };

    fetchAllProducts();
    fetchCategoryBanners();
  }, []);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when search overlay opens
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
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

  // Handle Escape key to close search, activeDropdown, userDropdown, or mobileMenu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSearch(false);
        setActiveDropdown(null);
        setShowUserDropdown(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else if (!showSearch) {
      document.body.style.overflow = '';
    }
    return () => {
      if (!showSearch) document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, showSearch]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileAccordion(null);
  };

  const toggleMobileAccordion = (key) => {
    setMobileAccordion(prev => prev === key ? null : key);
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
    <div className='fixed w-full top-0 left-0 z-40 print:hidden'>
      <div 
        className='w-full bg-white flex flex-col items-center relative'
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <div className='flex items-center p-2.5 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:justify-between max-lg:justify-between relative'>

          {/* Hamburger button — mobile only */}
          <button
            className='lg:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] cursor-pointer focus:outline-none flex-shrink-0'
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className='block w-6 h-[2px] bg-gray-800 rounded-full transition-all' />
            <span className='block w-6 h-[2px] bg-gray-800 rounded-full transition-all' />
            <span className='block w-6 h-[2px] bg-gray-800 rounded-full transition-all' />
          </button>

          {/* Left section: Navigation links (Desktop only) */}
          <div className='hidden lg:flex lg:gap-6 xl:gap-8 items-center text-base font-semibold text-gray-800 tracking-wide'>
            <div
              className="relative py-2 cursor-pointer hover:text-black transition-colors"
              onMouseEnter={() => setActiveDropdown('collections')}
            >
              <Link to="/collections">Collections</Link>
            </div>
            <div
              className="relative py-2 cursor-pointer hover:text-black transition-colors"
              onMouseEnter={() => {
                setActiveDropdown('women');
                setHoveredSubcategory('all');
              }}
            >
              <Link to="/Women">Women</Link>
            </div>
            <div
              className="relative py-2 cursor-pointer hover:text-black transition-colors"
              onMouseEnter={() => {
                setActiveDropdown('men');
                setHoveredSubcategory('all');
              }}
            >
              <Link to="/Men">Men</Link>
            </div>
          </div>

          {/* Center section: Logo — absolute center on desktop, flex center on mobile */}
          <div className='lg:absolute lg:left-1/2 lg:-translate-x-1/2 flex gap-2 items-center text-2xl'>
            <div className='w-[130px] xl:w-[150px] max-lg:w-[110px]'>
              <Link to="/">
                <img src={logo} alt="Logo" />
              </Link>
            </div>
          </div>

          {/* Right section: Action Icons */}
          <div className='flex text-xl gap-3 lg:gap-5 items-center'>
            <style>{`
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>

            <button
              onClick={() => setShowSearch(true)}
              className='cursor-pointer p-1 hover:text-gray-600 transition-colors focus:outline-none'
              aria-label="Search"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>

            {user?.role === 'admin' && (
              <div className="relative flex items-center justify-center" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="cursor-pointer p-1 hover:text-gray-600 transition-colors relative flex items-center justify-center focus:outline-none"
                  aria-label="Notifications"
                >
                  <FontAwesomeIcon icon={faBell} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white leading-none font-roboto animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Panel */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-8 w-[360px] bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 font-roboto"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <span className="font-semibold text-sm text-gray-900">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-black hover:underline font-bold cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-[450px] overflow-y-auto no-scrollbar divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <FontAwesomeIcon icon={faBell} className="text-gray-200 text-3xl mb-2" />
                            <p className="text-sm font-semibold text-gray-800">All caught up!</p>
                            <p className="text-xs text-gray-400 mt-0.5">No new notifications received.</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3.5 flex gap-3 hover:bg-gray-50/80 cursor-pointer transition-colors text-left ${
                                !notif.isRead ? 'bg-blue-50/20' : ''
                              }`}
                            >
                              <div className="flex-shrink-0 flex items-start">
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <p className={`text-[13px] font-bold truncate ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                    {notif.title}
                                  </p>
                                  <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                                    {formatRelativeTime(notif.createdAt)}
                                  </span>
                                </div>
                                <p className={`text-[12px] mt-1.5 line-clamp-2 leading-relaxed ${!notif.isRead ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                  {notif.message}
                                </p>
                              </div>
                              {!notif.isRead && (
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User Account Icon and Dropdown */}
            <div className="hidden lg:flex relative items-center justify-center" ref={userDropdownRef}>
              <button
                onClick={() => {
                  if (user) {
                    setShowUserDropdown(!showUserDropdown);
                  } else {
                    openAuthModal();
                  }
                }}
                className="cursor-pointer p-1 hover:text-gray-600 transition-colors relative flex items-center justify-center focus:outline-none"
                aria-label="User Account"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  stroke="currentColor" 
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </button>

              <AnimatePresence>
                {showUserDropdown && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-8 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 font-roboto"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <span className="text-xs text-gray-500">Signed in as</span>
                      <span className="font-semibold text-sm text-gray-900 block truncate font-medium">{user.email}</span>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/my-orders"
                        onClick={() => setShowUserDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                      >
                        My Purchases
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin/upload"
                          onClick={() => setShowUserDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors font-medium"
                        >
                          Admin Portal
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-gray-100 p-2">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserDropdown(false);
                        }}
                        className="w-full py-2 bg-black text-white hover:opacity-90 font-bold text-xs tracking-wide rounded-lg cursor-pointer transition-opacity focus:outline-none"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/favorites"
              className='hidden lg:flex cursor-pointer p-1 hover:text-gray-600 transition-colors relative items-center justify-center'
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

        {/* Megamenu Dropdown Panel */}
        <AnimatePresence>
          {activeDropdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="hidden lg:block absolute left-0 top-full w-full bg-white border-b border-gray-200 shadow-xl overflow-hidden z-20"
            >
              {activeDropdown === 'collections' ? (
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-12 gap-8 text-left">
                  {/* Left Side: Campaign text link list */}
                  <div className="col-span-7 flex flex-col justify-start">
                    <ul className="space-y-4">
                      <li>
                        <Link
                          to="/collections"
                          onClick={() => setActiveDropdown(null)}
                          onMouseEnter={() => setHoveredCollection('spring')}
                          className="text-[15px] text-neutral-500 hover:text-neutral-900 font-light tracking-wide transition-colors block font-inter"
                        >
                          Spring Collection
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/collections"
                          onClick={() => setActiveDropdown(null)}
                          onMouseEnter={() => setHoveredCollection('summer')}
                          className="text-[15px] text-neutral-500 hover:text-neutral-900 font-light tracking-wide transition-colors block font-inter"
                        >
                          Summer Collection
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/collections"
                          onClick={() => setActiveDropdown(null)}
                          onMouseEnter={() => setHoveredCollection('fall')}
                          className="text-[15px] text-neutral-500 hover:text-neutral-900 font-light tracking-wide transition-colors block font-inter"
                        >
                          Fall Collection
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/collections"
                          onClick={() => setActiveDropdown(null)}
                          onMouseEnter={() => setHoveredCollection('winter')}
                          className="text-[15px] text-neutral-500 hover:text-neutral-900 font-light tracking-wide transition-colors block font-inter"
                        >
                          Winter Collection
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Right Side: Dynamic Lookbook Image — smaller, flush right */}
                  <div className="col-span-5 flex items-center justify-end">
                    <div className="aspect-[3/4] w-[200px] overflow-hidden bg-gray-50 rounded-none relative">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={hoveredCollection}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          src={
                            hoveredCollection === 'spring'
                              ? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop'
                              : hoveredCollection === 'summer'
                              ? 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop'
                              : hoveredCollection === 'fall'
                              ? 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=600&auto=format&fit=crop'
                              : 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop'
                          }
                          alt={`${hoveredCollection} Collection Campaign`}
                          className="h-full w-full object-cover object-top"
                        />
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-12 gap-8 text-left">
                  {/* Left Side: Category text link list */}
                  <div className="col-span-7 flex flex-col justify-start">
                    <ul className="space-y-4">
                      <li>
                        <Link
                          to={`/${activeDropdown === 'women' ? 'Women' : 'Men'}`}
                          onClick={() => setActiveDropdown(null)}
                          onMouseEnter={() => setHoveredSubcategory('tops')}
                          className="text-[15px] text-neutral-500 hover:text-neutral-900 font-light tracking-wide transition-colors block font-inter"
                        >
                          Tops & T-Shirts
                        </Link>
                      </li>
                      <li>
                        <Link
                          to={`/${activeDropdown === 'women' ? 'Women' : 'Men'}`}
                          onClick={() => setActiveDropdown(null)}
                          onMouseEnter={() => setHoveredSubcategory('hoodies')}
                          className="text-[15px] text-neutral-500 hover:text-neutral-900 font-light tracking-wide transition-colors block font-inter"
                        >
                          Hoodies & Sweatshirts
                        </Link>
                      </li>
                      <li>
                        <Link
                          to={`/${activeDropdown === 'women' ? 'Women' : 'Men'}`}
                          onClick={() => setActiveDropdown(null)}
                          onMouseEnter={() => setHoveredSubcategory('pants')}
                          className="text-[15px] text-neutral-500 hover:text-neutral-900 font-light tracking-wide transition-colors block font-inter"
                        >
                          Pants & Jeans
                        </Link>
                      </li>
                      <li>
                        <Link
                          to={`/${activeDropdown === 'women' ? 'Women' : 'Men'}`}
                          onClick={() => setActiveDropdown(null)}
                          onMouseEnter={() => setHoveredSubcategory('jackets')}
                          className="text-[15px] text-neutral-500 hover:text-neutral-900 font-light tracking-wide transition-colors block font-inter"
                        >
                          Jackets & Outerwear
                        </Link>
                      </li>
                    </ul>
                  </div>


                  {/* Right Side: Dynamic Image — smaller, flush right */}
                  <div className="col-span-5 flex items-center justify-end">
                    <div className="aspect-[3/4] w-[200px] overflow-hidden bg-gray-50 rounded-none relative">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={`${activeDropdown}-${hoveredSubcategory}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          src={
                            activeDropdown === 'women'
                              ? hoveredSubcategory === 'all'
                                ? womenBanner || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop'
                                : hoveredSubcategory === 'tops'
                                ? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop'
                                : hoveredSubcategory === 'hoodies'
                                ? 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop'
                                : hoveredSubcategory === 'pants'
                                ? 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop'
                                : 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop'
                              : hoveredSubcategory === 'all'
                              ? menBanner || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600&auto=format&fit=crop'
                              : hoveredSubcategory === 'tops'
                              ? 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=600&auto=format&fit=crop'
                              : hoveredSubcategory === 'hoodies'
                              ? 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop'
                              : hoveredSubcategory === 'pants'
                              ? 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=600&auto=format&fit=crop'
                              : 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=600&auto=format&fit=crop'
                          }
                          alt={`${activeDropdown} Collection Campaign`}
                          className="h-full w-full object-cover object-top"
                        />
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={closeMobileMenu}
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 left-0 h-full w-[80%] max-w-xs bg-white z-50 flex flex-col shadow-2xl overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <Link to="/" onClick={closeMobileMenu}>
                  <img src={logo} alt="Logo" className="w-[100px]" />
                </Link>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 text-gray-500 hover:text-black transition-colors cursor-pointer focus:outline-none"
                  aria-label="Close menu"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xl" />
                </button>
              </div>

              {/* Drawer Nav Links with Accordions */}
              <nav className="flex-1 px-4 py-4 space-y-1">

                {/* Collections accordion */}
                <div>
                  <button
                    onClick={() => toggleMobileAccordion('collections')}
                    className="w-full flex justify-between items-center px-2 py-3 text-base font-semibold text-gray-800 hover:text-black transition-colors cursor-pointer focus:outline-none"
                  >
                    <span>Collections</span>
                    <motion.span
                      animate={{ rotate: mobileAccordion === 'collections' ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-400 text-sm"
                    >
                      ▾
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {mobileAccordion === 'collections' && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-4 space-y-1"
                      >
                        {['Spring', 'Summer', 'Fall', 'Winter'].map((season) => (
                          <li key={season}>
                            <Link
                              to="/collections"
                              onClick={closeMobileMenu}
                              className="block py-2 text-sm text-gray-500 hover:text-black transition-colors font-medium"
                            >
                              {season} Collection
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Women accordion */}
                <div>
                  <button
                    onClick={() => toggleMobileAccordion('women')}
                    className="w-full flex justify-between items-center px-2 py-3 text-base font-semibold text-gray-800 hover:text-black transition-colors cursor-pointer focus:outline-none"
                  >
                    <span>Women</span>
                    <motion.span
                      animate={{ rotate: mobileAccordion === 'women' ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-400 text-sm"
                    >
                      ▾
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {mobileAccordion === 'women' && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-4 space-y-1"
                      >
                        {['Tops & T-Shirts', 'Hoodies & Sweatshirts', 'Pants & Jeans', 'Jackets & Outerwear'].map((item) => (
                          <li key={item}>
                            <Link
                              to="/Women"
                              onClick={closeMobileMenu}
                              className="block py-2 text-sm text-gray-500 hover:text-black transition-colors font-medium"
                            >
                              {item}
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Men accordion */}
                <div>
                  <button
                    onClick={() => toggleMobileAccordion('men')}
                    className="w-full flex justify-between items-center px-2 py-3 text-base font-semibold text-gray-800 hover:text-black transition-colors cursor-pointer focus:outline-none"
                  >
                    <span>Men</span>
                    <motion.span
                      animate={{ rotate: mobileAccordion === 'men' ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-400 text-sm"
                    >
                      ▾
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {mobileAccordion === 'men' && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-4 space-y-1"
                      >
                        {['Tops & T-Shirts', 'Hoodies & Sweatshirts', 'Pants & Jeans', 'Jackets & Outerwear'].map((item) => (
                          <li key={item}>
                            <Link
                              to="/Men"
                              onClick={closeMobileMenu}
                              className="block py-2 text-sm text-gray-500 hover:text-black transition-colors font-medium"
                            >
                              {item}
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Utility links */}
                <Link
                  to="/favorites"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-2 py-3 text-base font-semibold text-gray-800 hover:text-black transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  Favorites
                </Link>

                <Link
                  to="/my-orders"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-2 py-3 text-base font-semibold text-gray-800 hover:text-black transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                  My Purchases
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin/upload"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-2 py-3 text-base font-semibold text-gray-800 hover:text-black transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    Admin Portal
                  </Link>
                )}
              </nav>

              {/* Drawer Footer: Account / Sign Out */}
              <div className="border-t border-gray-100 px-5 py-4">
                {user ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { logout(); closeMobileMenu(); }}
                      className="w-full py-2.5 bg-black text-white text-sm font-bold tracking-wide rounded-lg hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { openAuthModal(); closeMobileMenu(); }}
                    className="w-full py-2.5 bg-black text-white text-sm font-bold tracking-wide rounded-lg hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
                  >
                    Sign In
                  </button>
                )}
              </div>
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
                  placeholder="Search products by name or ID/code..."
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
                          <p className="text-sm text-gray-400">Try searching for another product name or ID/code.</p>
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
