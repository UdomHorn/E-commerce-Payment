import React, { createContext, useContext, useState, useEffect } from 'react';

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
        updated[existingIdx].quantity = maxStock > 0 ? Math.min(newQty, maxStock) : newQty;
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
          quantity: maxStock > 0 ? Math.min(quantity, maxStock) : quantity,
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
        updated[idx].quantity = maxStock > 0 ? Math.min(qty, maxStock) : qty;
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
