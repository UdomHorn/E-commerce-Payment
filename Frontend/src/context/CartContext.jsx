import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE from '../config';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('ten11_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('ten11_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity, selectedSize, selectedColor) => {
    // Calculate the max stock for this color+size combination
    let maxStock = 0;
    if (product.sizeStock && selectedColor && product.sizeStock[selectedColor]) {
      maxStock = parseInt(product.sizeStock[selectedColor][selectedSize], 10) || 0;
    } else if (product.sizeStock && selectedSize) {
      maxStock = parseInt(product.sizeStock[selectedSize], 10) || 0;
    }

    if (maxStock <= 0) {
      return;
    }

    setCart((prev) => {
      // Find if item already exists with same size/color
      const existingIdx = prev.findIndex(
        (item) =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        const limit = maxStock > 0 ? Math.min(maxStock, 20) : 20;
        updated[existingIdx].quantity = Math.min(newQty, limit);
        return updated;
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images && product.images[0],
          selectedSize,
          selectedColor,
          quantity: Math.min(quantity, maxStock > 0 ? Math.min(maxStock, 20) : 20),
          maxStock,
        },
      ];
    });
  };

  const removeFromCart = (id, selectedSize, selectedColor) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.id === id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
          )
      )
    );
  };

  const updateQuantity = (id, selectedSize, selectedColor, qty) => {
    if (qty <= 0) {
      removeFromCart(id, selectedSize, selectedColor);
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.id === id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );
      if (idx > -1) {
        const updated = [...prev];
        const item = updated[idx];
        const maxStock = item.maxStock || 0;
        const limit = maxStock > 0 ? Math.min(maxStock, 20) : 20;
        updated[idx].quantity = Math.min(qty, limit);
        return updated;
      }
      return prev;
    });
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const syncCartStock = async () => {
    if (cart.length === 0) return;
    try {
      const ids = [...new Set(cart.map(item => item.id))];
      const response = await fetch(`${API_BASE}/api/products/sync-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      });

      if (response.ok) {
        const products = await response.json();
        setCart((prev) => {
          let changed = false;
          const updated = prev.map(item => {
            const freshProduct = products.find(p => p.id === item.id);
            if (freshProduct) {
              let freshMaxStock = 0;
              if (freshProduct.sizeStock && item.selectedColor && freshProduct.sizeStock[item.selectedColor]) {
                freshMaxStock = parseInt(freshProduct.sizeStock[item.selectedColor][item.selectedSize], 10) || 0;
              } else if (freshProduct.sizeStock && item.selectedSize) {
                freshMaxStock = parseInt(freshProduct.sizeStock[item.selectedSize], 10) || 0;
              }

              const newMaxStock = freshMaxStock;
              const limit = newMaxStock > 0 ? Math.min(newMaxStock, 20) : 0; // limit is 0 if stock is 0
              const finalQty = Math.max(0, Math.min(item.quantity, limit));

              if (item.maxStock !== newMaxStock || item.quantity !== finalQty) {
                changed = true;
                return { ...item, maxStock: newMaxStock, quantity: finalQty };
              }
            }
            return item;
          });
          return changed ? updated : prev;
        });
      }
    } catch (err) {
      console.error('Failed to sync cart stock:', err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        syncCartStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
