import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import API_BASE from '../config';
import logo from '../assets/logo/Devclothes.jpg';

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
        onSuccess(orderId, email);
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
        className={`w-full py-4 mt-6 bg-black text-white font-bold rounded-lg shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''
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
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [receiptDetails, setReceiptDetails] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState('');

  const totalAmount = getCartTotal();

  const handleSuccess = (orderId, email) => {
    setPaymentSuccess(true);
    setOrderConfirmationId(orderId);
    setCheckoutEmail(email);
    clearCart();
  };

  useEffect(() => {
    if (!paymentSuccess || !orderConfirmationId) return;

    const fetchReceipt = async () => {
      setReceiptLoading(true);
      setReceiptError('');
      try {
        const response = await fetch(`${API_BASE}/api/payment/order/${orderConfirmationId}?email=${encodeURIComponent(checkoutEmail)}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to load order receipt.');
        }

        const data = await response.json();
        setReceiptDetails(data);
      } catch (err) {
        console.error('Error fetching order receipt:', err);
        setReceiptError(err.message || 'Failed to retrieve order receipt details.');
      } finally {
        setReceiptLoading(false);
      }
    };

    fetchReceipt();
  }, [paymentSuccess, orderConfirmationId, checkoutEmail]);

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-white text-black font-roboto pt-[64px] pb-16 flex flex-col items-center justify-center p-6 print:pt-4 print:pb-0 print:justify-start print:min-h-0">
        <div className="w-full max-w-2xl bg-white border border-gray-150 rounded-2xl shadow-lg p-8 print:border-0 print:shadow-none print:p-0">

          {/* Success Checkmark & Header (hidden in print) */}
          <div className="text-center mb-8 print:hidden">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-extrabold mx-auto mb-4 animate-pulse">
              ✓
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Order Confirmed!</h2>
            <p className="text-gray-500 mt-1">Thank you for your purchase. A receipt details copy is displayed below.</p>
          </div>

          {/* Printable Invoice Header (visible only in print) */}
          <div className="hidden print:flex items-center justify-between border-b pb-6 mb-6">
            <div>
              <img src={logo} alt="Devclothes Logo" className="w-32 object-contain" />
              <p className="text-xs text-gray-400 mt-1">Order Invoice / Receipt</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">#Order {orderConfirmationId}</p>
              <p className="text-xs text-gray-400">Date: {receiptDetails ? new Date(receiptDetails.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Loading Receipt State */}
          {receiptLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500 text-sm font-semibold">Generating your receipt details...</p>
            </div>
          ) : receiptError ? (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg text-center mb-6">
              <p className="font-bold mb-1">Failed to load detailed receipt</p>
              <p className="text-xs">{receiptError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition"
              >
                Retry
              </button>
            </div>
          ) : receiptDetails ? (
            <div className="space-y-6">
              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider">Receipt ID</p>
                  <p className="font-extrabold text-gray-900 mt-0.5">#{receiptDetails.id}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider">Purchase Date</p>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {new Date(receiptDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider">Status</p>
                  <span className={`inline-block px-2.5 py-0.5 mt-0.5 rounded-[4px] text-[10px] font-bold uppercase border ${receiptDetails.status === 'PAID'
                      ? 'bg-gray-150 text-black border-gray-300'
                      : receiptDetails.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-800 border-amber-100'
                        : 'bg-rose-50 text-rose-800 border-rose-100'
                    }`}>
                    {receiptDetails.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider">Method</p>
                  <p className="font-semibold text-gray-800 mt-0.5">Stripe Card</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wide mb-3 border-b pb-1.5">Items Summary</h3>
                <div className="space-y-3">
                  {receiptDetails.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-12 h-16 overflow-hidden rounded bg-gray-50 border flex-shrink-0 print:hidden">
                        <img
                          src={item.product?.images?.[0] || 'https://via.placeholder.com/100x120'}
                          alt={item.product?.name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{item.product?.name || 'Unnamed Product'}</h4>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          Size: <span className="font-semibold text-gray-700">{item.selectedSize}</span> | Color: <span className="font-semibold text-gray-700">{item.selectedColor}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-xs text-gray-700">${item.price.toFixed(2)} x {item.quantity}</p>
                        <p className="font-bold text-sm text-gray-900 mt-0.5">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping and Total Cost Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide mb-2">Shipping Information</h4>
                  <div className="bg-gray-50 p-4 rounded-xl space-y-1 border border-gray-100">
                    <p className="font-bold text-gray-900">{receiptDetails.shippingAddress?.split(',')[0]}</p>
                    <p className="text-gray-600">{receiptDetails.shippingAddress?.split(',').slice(1).join(',').trim() || receiptDetails.shippingAddress}</p>
                    <p className="text-gray-400 pt-1">Email: {receiptDetails.customerEmail}</p>
                  </div>
                </div>

                <div className="text-xs space-y-2">
                  <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide mb-2">Amount Breakdown</h4>
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100 text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-900">${receiptDetails.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Cost</span>
                      <span className="text-gray-900 font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold pt-2 border-t text-gray-950">
                      <span>Grand Total</span>
                      <span>${receiptDetails.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Action Buttons (hidden in print) */}
          <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row gap-4 justify-between print:hidden">
            <button
              onClick={() => window.print()}
              disabled={receiptLoading || !receiptDetails}
              className="px-6 py-3 border border-gray-300 hover:border-black font-bold rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-14.326 0C3.77 7.441 3 8.376 3 9.456v6.294a2.25 2.25 0 0 0 2.25 2.25h1.091m12-11.854v2.854m0 0v2.735m0-2.735h-6.75m6.75 0a9.053 9.053 0 0 0-3.468-7.143M12 4.143a9.053 9.053 0 0 0-3.468 7.143m0 0v2.735m0-2.735h6.75" />
              </svg>
              Print Receipt
            </button>

            <Link
              to="/"
              className="px-8 py-3 bg-black text-white hover:opacity-90 font-bold rounded-lg text-sm text-center transition flex items-center justify-center"
            >
              Continue Shopping
            </Link>
          </div>

        </div>
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
                      className={`w-8 h-8 bg-gray-100 flex items-center justify-center font-semibold rounded transition ${item.maxStock > 0 && item.quantity >= item.maxStock
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
