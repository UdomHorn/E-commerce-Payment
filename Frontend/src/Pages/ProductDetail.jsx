import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AddtoBag from '../assets/Components/AddtoBag';
import Size from '../assets/Components/Size';
import ColorAvailable from '../assets/Components/ColorAvailable';
import SizeGuideModal from '../assets/Components/SizeGuideModal';
import { useCart } from '../context/CartContext';
import API_BASE from '../config';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const { cart, addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user, openAuthModal } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Selection & UI states
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [addedAlert, setAddedAlert] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeShake, setSizeShake] = useState(false); // triggers shake when no size selected

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/api/products/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch product details.');
        }
        
        setProduct(data);
        
        // Set default selections - pick first item that is in-stock
        const inStockColors = data.colors ? data.colors.filter(c => {
          const stock = (data.colorStock && data.colorStock[c] !== undefined)
            ? parseInt(data.colorStock[c], 10)
            : 0;
          return stock > 0;
        }) : [];

        const firstColor = inStockColors.length > 0 ? inStockColors[0] : '';
        setSelectedColor(firstColor);

        const inStockSizes = data.sizes ? data.sizes.filter(s => {
          let stock = 0;
          if (data.sizeStock && firstColor && data.sizeStock[firstColor]) {
            const val = data.sizeStock[firstColor][s];
            stock = val !== undefined ? parseInt(val, 10) : 0;
          } else if (data.sizeStock) {
            const val = data.sizeStock[s];
            stock = val !== undefined ? parseInt(val, 10) : 0;
          }
          return stock > 0;
        }) : [];

        if (inStockSizes.length > 0) {
          setSelectedSize(inStockSizes[0]);
        } else {
          setSelectedSize('');
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Set page title dynamically to the product name
  useEffect(() => {
    if (product && product.name) {
      document.title = `${product.name} — Devclothes`;
    }
  }, [product]);

  // Automatic slideshow for product images
  useEffect(() => {
    if (!product || !product.images || product.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [product]);

  // Adjust size selection automatically when color changes
  useEffect(() => {
    if (!product) return;

    const availableForColor = product.sizes ? product.sizes.filter(s => {
      let stock = 0;
      if (product.sizeStock && selectedColor && product.sizeStock[selectedColor]) {
        const val = product.sizeStock[selectedColor][s];
        stock = val !== undefined ? parseInt(val, 10) : 0;
      } else if (product.sizeStock) {
        const val = product.sizeStock[s];
        stock = val !== undefined ? parseInt(val, 10) : 0;
      }
      return stock > 0;
    }) : [];

    if (availableForColor.length > 0) {
      if (!selectedSize || !availableForColor.includes(selectedSize)) {
        setSelectedSize(availableForColor[0]);
      }
    } else {
      setSelectedSize('');
    }
  }, [selectedColor, product]);

  // Reset sizeShake flag after animation completes
  useEffect(() => {
    if (!sizeShake) return;
    const timer = setTimeout(() => setSizeShake(false), 400);
    return () => clearTimeout(timer);
  }, [sizeShake]);

  // Auto-dismiss add to bag popup after 4 seconds
  useEffect(() => {
    if (!addedAlert) return;
    const timer = setTimeout(() => {
      setAddedAlert(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [addedAlert]);

  const handleAddToBag = () => {
    if (!product) return;
    // H&M-style: validate size is selected before adding
    if (!selectedSize) {
      setSizeShake(true);
      return;
    }
    addToCart(product, 1, selectedSize, selectedColor);
    setAddedAlert(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-[48px] bg-white text-black font-roboto">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-semibold">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-[48px] bg-white text-black font-roboto p-6">
        <p className="text-xl font-bold text-red-500 mb-4">Error: {error || 'Product not found.'}</p>
        <Link to="/" className="px-6 py-3 bg-black text-white font-bold rounded-lg hover:opacity-90 transition">
          Back to Home
        </Link>
      </div>
    );
  }

  const { name, price, description, modelInfo, images, colors, sizes, code, category } = product;

  // Filter active in-stock colors and sizes
  const availableColors = colors ? colors.filter(c => {
    const stock = (product.colorStock && product.colorStock[c] !== undefined)
      ? parseInt(product.colorStock[c], 10)
      : 0;
    return stock > 0;
  }) : [];

  const availableSizes = sizes ? sizes.filter(s => {
    let stock = 0;
    if (product.sizeStock && selectedColor && product.sizeStock[selectedColor]) {
      const val = product.sizeStock[selectedColor][s];
      stock = val !== undefined ? parseInt(val, 10) : 0;
    } else if (product.sizeStock) {
      const val = product.sizeStock[s];
      stock = val !== undefined ? parseInt(val, 10) : 0;
    }
    return stock > 0;
  }) : [];

  const isOutOfStock = availableColors.length === 0 || availableSizes.length === 0;

  // Get available stock for the currently selected color and size
  let currentStock = 0;
  if (product && selectedColor && selectedSize) {
    if (product.sizeStock && product.sizeStock[selectedColor]) {
      currentStock = parseInt(product.sizeStock[selectedColor][selectedSize], 10) || 0;
    } else if (product.sizeStock) {
      currentStock = parseInt(product.sizeStock[selectedSize], 10) || 0;
    }
  }

  // Build a map of size -> stock count for the selected color (used for low-stock badges)
  const sizeStockMap = {};
  if (product && sizes) {
    sizes.forEach(s => {
      if (product.sizeStock && selectedColor && product.sizeStock[selectedColor]) {
        sizeStockMap[s] = parseInt(product.sizeStock[selectedColor][s], 10) || 0;
      } else if (product.sizeStock) {
        sizeStockMap[s] = parseInt(product.sizeStock[s], 10) || 0;
      }
    });
  }
  const existingCartItem = cart?.find(
    (item) =>
      item.id === product?.id &&
      item.selectedSize === selectedSize &&
      item.selectedColor === selectedColor
  );
  const cartQty = existingCartItem ? existingCartItem.quantity : 0;
  const maxAllowedQty = (product?.sizeStock && currentStock > 0) ? Math.min(currentStock, 20) : 20;
  const isLimitReached = selectedSize && selectedColor && cartQty >= maxAllowedQty;

  return (
    <div className="p-2.5 pt-[64px] font-roboto w-[80%] max-md:w-full mx-auto text-lg relative">
      {/* Premium Toast Alert popup */}
      <AnimatePresence>
        {addedAlert && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-24 right-6 z-50 w-80 bg-white border border-black p-4 rounded-none shadow-md flex gap-3 text-black"
          >
            {/* Thumbnail Image */}
            <div className="w-16 h-20 bg-gray-100 flex-shrink-0 border border-gray-200 rounded-none overflow-hidden">
              <img src={images && images[0]} alt={name} className="w-full h-full object-cover" />
            </div>

            {/* Info and Action */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="pr-4">
                <div className="text-xs font-bold uppercase tracking-wider mb-1">
                  Added to Bag
                </div>
                <h4 className="text-sm font-bold truncate">{name}</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Size: <span className="font-medium text-black">{selectedSize}</span> | Color: <span className="font-medium text-black">{selectedColor}</span> | Qty: <span className="font-medium text-black">1</span>
                </p>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setAddedAlert(false)}
                className="absolute top-3 right-3 text-black hover:opacity-70 transition-opacity cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <SizeGuideModal
            isOpen={isSizeGuideOpen}
            onClose={() => setIsSizeGuideOpen(false)}
            defaultCategory={category}
          />
        )}
      </AnimatePresence>

      <div className="sm:flex gap-12 mt-6">
        {/* Left Side: Images Carousel */}
        <div className="w-1/2 max-sm:w-full">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 rounded-lg shadow-sm">
            {images && images.length > 0 ? (
              <img
                src={images[currentIndex]}
                alt={`${name} - ${currentIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                No Image Available
              </div>
            )}
            
            {/* Carousel dots indicators */}
            {images && images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      i === currentIndex ? 'bg-black w-5' : 'bg-black/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Interactive Thumbnails */}
          {images && images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto py-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-16 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 transition ${
                    idx === currentIndex ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Info */}
        <div className="w-1/2 max-sm:w-full space-y-6">
          
          {/* Header Panel (Name, Bookmarks, Share, Price) */}
          <div className="border-b pb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
              <div className="flex gap-4 text-xl">
                <button 
                  onClick={() => toggleFavorite(product)} 
                  className={`cursor-pointer transition-colors duration-200 focus:outline-none ${isFavorite(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-black'}`}
                  aria-label="Favorite"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill={isFavorite(product.id) ? "currentColor" : "none"} 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    stroke="currentColor" 
                    className="w-6 h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="text-xl font-bold text-gray-700 mt-2">${price.toFixed(2)}</div>
          </div>

          {/* Out of Stock Banner */}
          {isOutOfStock && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2 rounded-none">
              <span className="text-base"></span>
              <span>Out of stock: This item is currently unavailable.</span>
            </div>
          )}

          {/* Color Selector */}
          {/* Color Selector */}
          <ColorAvailable
            colors={availableColors}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
          />

          {/* Size Selector — H&M style: shows all sizes including out-of-stock */}
          <Size
            allSizes={sizes}
            sizes={availableSizes}
            selectedSize={selectedSize}
            onSelectSize={(s) => { setSelectedSize(s); setSizeShake(false); }}
            modelInfo={modelInfo}
            sizeStockMap={sizeStockMap}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            sizeError={sizeShake}
          />

          {/* Add to Bag — immediately after size, H&M style */}
          <AddtoBag
            onClick={handleAddToBag}
            disabled={isOutOfStock || isLimitReached}
            label={
              isOutOfStock
                ? 'Out of Stock'
                : isLimitReached
                  ? (maxAllowedQty === 20 ? 'Limit of 20 reached' : 'Stock limit reached')
                  : 'Add to bag'
            }
          />

          {/* Product ID & Description — moved below Add to Bag */}
          <div className="border-t pt-5 space-y-2">
            {code && (
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Item No. <span className="text-gray-700 font-semibold">{code}</span>
              </div>
            )}
            {description && (
              <div className="text-sm text-gray-600 leading-relaxed">
                {description}
              </div>
            )}
          </div>

          {/* If user is logged out, show a clean Sign In prompt */}
          {!user && (
            <div className="p-4 bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Have an account?</p>
                <p className="text-xs text-gray-500 mt-0.5 font-normal">Sign in for a better checkout experience.</p>
              </div>
              <button
                onClick={openAuthModal}
                className="px-5 py-2.5 bg-black text-white hover:opacity-90 font-semibold text-xs tracking-widest uppercase cursor-pointer transition-opacity focus:outline-none"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
