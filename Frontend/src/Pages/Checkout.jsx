import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import API_BASE from '../config';

// Initialize Stripe (VITE_STRIPE_PUBLISHABLE_KEY from .env or fallback test key)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51PxPlaceholderKeyXXXXXXXXXXXXXX';
const stripePromise = loadStripe(stripePublishableKey);

const CheckoutForm = ({ totalAmount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { cart } = useCart();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return; // Stripe has not loaded yet
    }

    setLoading(true);
    onError('');

    try {
      // 1. Call Backend to create Stripe Payment Intent
      const response = await fetch(`${API_BASE}/api/payment/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })),
          shippingAddress: `${name}, ${address}`,
          customerEmail: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment.');
      }

      const { clientSecret, orderId } = data;

      // 2. Confirm the card payment on Stripe servers
      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: name,
            email: email,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent.status === 'succeeded') {
        onSuccess(orderId);
      }
    } catch (err) {
      console.error(err);
      onError(err.message || 'Payment processing failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-black">
      <h3 className="text-xl font-bold border-b pb-3 text-gray-800">Billing & Shipping Details</h3>
      
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Email Address</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Shipping Address</label>
        <input
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, City, Country"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black"
        />
      </div>

      <h3 className="text-xl font-bold border-b pt-4 pb-3 text-gray-800">Credit Card Information</h3>
      
      <div className="p-4 border rounded-lg bg-gray-50">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !stripe}
        className={`w-full py-4 mt-6 bg-black text-white font-bold rounded-lg shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing secure payment...
          </>
        ) : (
          `Pay $${totalAmount.toFixed(2)}`
        )}
      </button>
    </form>
  );
};

const Checkout = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderConfirmationId, setOrderConfirmationId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const totalAmount = getCartTotal();

  const handleSuccess = (orderId) => {
    setPaymentSuccess(true);
    setOrderConfirmationId(orderId);
    clearCart();
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black font-roboto pt-[64px] p-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-extrabold mb-6 animate-pulse">
          ✓
        </div>
        <h2 className="text-3xl font-bold mb-2">Thank you for your order!</h2>
        <p className="text-gray-600 mb-1">Your payment was processed successfully.</p>
        <p className="text-lg font-semibold mb-8">Order Confirmation ID: <span className="text-blue-600">#{orderConfirmationId}</span></p>
        <Link to="/" className="px-8 py-3 bg-black text-white font-bold rounded-lg hover:opacity-90 transition">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black font-roboto pt-[64px] p-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Your Shopping Bag is Empty</h2>
        <p className="text-gray-500 mb-8">Add items from the store to make a payment.</p>
        <Link to="/" className="px-8 py-3 bg-black text-white font-bold rounded-lg hover:opacity-90 transition">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 bg-white text-black font-roboto min-h-screen">
      <div className="w-[80%] max-md:w-[94%] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Side: Cart Items Review */}
        <div>
          <h2 className="text-2xl font-bold border-b pb-4 mb-6">Review Your Bag</h2>
          <div className="space-y-6">
            {cart.map((item, idx) => (
              <div key={idx} className="flex gap-4 border-b pb-6">
                <div className="w-20 h-24 overflow-hidden rounded bg-gray-50 border flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-gray-500 text-sm">Size: {item.selectedSize} | Color: {item.selectedColor}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-100 flex items-center justify-center font-semibold rounded hover:bg-gray-200 transition"
                    >
                      -
                    </button>
                    <span className="font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                      disabled={item.maxStock > 0 && item.quantity >= item.maxStock}
                      className={`w-8 h-8 bg-gray-100 flex items-center justify-center font-semibold rounded transition ${
                        item.maxStock > 0 && item.quantity >= item.maxStock
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-gray-200 cursor-pointer'
                      }`}
                    >
                      +
                    </button>
                    {item.maxStock > 0 && (
                      <span className="text-xs text-gray-400 font-medium">Max: {item.maxStock}</span>
                    )}
                    <button
                      onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                      className="text-red-500 hover:text-red-700 text-sm ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-right font-bold text-lg flex-shrink-0">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gray-50 p-6 rounded-lg space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-emerald-600 font-semibold">Free</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-3 border-t text-black">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Secure Checkout Form */}
        <div className="bg-gray-50/50 border rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Secure Checkout</h2>

          {errorMessage && (
            <div className="p-4 mb-6 rounded-lg bg-rose-100 border border-rose-300 text-rose-700 text-sm font-semibold">
              {errorMessage}
            </div>
          )}

          <Elements stripe={stripePromise}>
            <CheckoutForm
              totalAmount={totalAmount}
              onSuccess={handleSuccess}
              onError={setErrorMessage}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
