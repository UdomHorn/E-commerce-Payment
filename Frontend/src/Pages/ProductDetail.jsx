import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Qty from '../assets/Components/Qty';
import AddtoBag from '../assets/Components/AddtoBag';
import Size from '../assets/Components/Size';
import ColorAvailable from '../assets/Components/ColorAvailable';
import { useCart } from '../context/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import API_BASE from '../config';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Selection & UI states
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [addedAlert, setAddedAlert] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

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
          const stock = data.colorStock && data.colorStock[c];
          return stock === undefined || parseInt(stock, 10) > 0;
        }) : [];

        const firstColor = inStockColors.length > 0 ? inStockColors[0] : '';
        setSelectedColor(firstColor);

        const inStockSizes = data.sizes ? data.sizes.filter(s => {
          if (data.sizeStock && firstColor && data.sizeStock[firstColor]) {
            const stock = data.sizeStock[firstColor][s];
            return stock !== undefined && parseInt(stock, 10) > 0;
          }
          const stock = data.sizeStock && data.sizeStock[s];
          return stock === undefined || parseInt(stock, 10) > 0;
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
      if (product.sizeStock && selectedColor && product.sizeStock[selectedColor]) {
        const stock = product.sizeStock[selectedColor][s];
        return stock !== undefined && parseInt(stock, 10) > 0;
      }
      const stock = product.sizeStock && product.sizeStock[s];
      return stock === undefined || parseInt(stock, 10) > 0;
    }) : [];

    if (availableForColor.length > 0) {
      if (!selectedSize || !availableForColor.includes(selectedSize)) {
        setSelectedSize(availableForColor[0]);
      }
    } else {
      setSelectedSize('');
    }
  }, [selectedColor, product]);

  // Cap qty when color/size selection changes to not exceed the available stock
  useEffect(() => {
    if (!product) return;
    let stock = 0;
    if (selectedColor && selectedSize) {
      if (product.sizeStock && product.sizeStock[selectedColor]) {
        stock = parseInt(product.sizeStock[selectedColor][selectedSize], 10) || 0;
      } else if (product.sizeStock) {
        stock = parseInt(product.sizeStock[selectedSize], 10) || 0;
      }
    }
    if (stock > 0 && qty > stock) {
      setQty(stock);
    } else if (stock === 0 && qty !== 1) {
      setQty(1);
    }
  }, [selectedColor, selectedSize, product]);

  const handleAddToBag = () => {
    if (!product) return;
    
    addToCart(product, qty, selectedSize, selectedColor);
    setAddedAlert(true);
    
    setTimeout(() => {
      setAddedAlert(false);
    }, 3000);
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

  const { name, price, description, modelInfo, images, colors, sizes, code } = product;

  // Filter active in-stock colors and sizes
  const availableColors = colors ? colors.filter(c => {
    const stock = product.colorStock && product.colorStock[c];
    return stock === undefined || parseInt(stock, 10) > 0;
  }) : [];

  const availableSizes = sizes ? sizes.filter(s => {
    if (product.sizeStock && selectedColor && product.sizeStock[selectedColor]) {
      const stock = product.sizeStock[selectedColor][s];
      return stock !== undefined && parseInt(stock, 10) > 0;
    }
    const stock = product.sizeStock && product.sizeStock[s];
    return stock === undefined || parseInt(stock, 10) > 0;
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

  return (
    <div className="p-2.5 pt-[64px] font-roboto w-[80%] max-md:w-full mx-auto text-lg relative">
      {/* Toast Alert */}
      {addedAlert && (
        <div className="fixed top-20 right-6 z-50 bg-black border border-white/20 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>Added {qty}x {name} ({selectedSize} / {selectedColor}) to your bag!</span>
        </div>
      )}

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
                  onClick={() => setIsBookmarked(!isBookmarked)} 
                  className={`cursor-pointer transition-colors duration-200 ${isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-black'}`}
                >
                  <FontAwesomeIcon icon={faBookmark} />
                </button>
                <button className="cursor-pointer text-gray-400 hover:text-black transition-colors duration-200">
                  <FontAwesomeIcon icon={faUpRightFromSquare} />
                </button>
              </div>
            </div>
            <div className="text-xl font-bold text-gray-700 mt-2">${price.toFixed(2)}</div>
          </div>

          {/* Color Selector */}
          <ColorAvailable 
            colors={availableColors} 
            selectedColor={selectedColor} 
            onSelectColor={setSelectedColor} 
          />

          {/* Size Selector */}
          <Size 
            sizes={availableSizes} 
            selectedSize={selectedSize} 
            onSelectSize={setSelectedSize} 
            modelInfo={modelInfo} 
          />

          {/* Qty Selector */}
          <Qty qty={qty} setQty={setQty} max={currentStock} />

          {/* Product SKU & Description Info */}
          <div className="border-t pt-6 space-y-2.5">
            {code && (
              <div className="text-sm text-gray-500 font-medium">
                SKU: <span className="text-gray-900 font-bold">{code}</span>
              </div>
            )}
            {description && (
              <div className="text-base text-gray-600 leading-relaxed">
                {description}
              </div>
            )}
          </div>

          
          {/* Add to Bag Button */}
          <AddtoBag 
            onClick={handleAddToBag} 
            disabled={isOutOfStock} 
            label={isOutOfStock ? 'Out of Stock' : 'Add to bag'} 
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
