import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_BASE from '../config';
import { useAuth } from '../context/AuthContext';

const MyOrders = () => {
  const { user, openAuthModal, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Redirect to login if user is not authenticated
      setError('Please sign in to view your order history.');
      setLoading(false);
      return;
    }

    const fetchMyOrders = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/payment/my-orders`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to retrieve order history.');
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'An error occurred while loading your orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [user, authLoading]);

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return (
          <span className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
            PAID
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-3 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
            PENDING
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-3 py-1 text-xs font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-200">
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-800 rounded-full border border-gray-200">
            {status || 'UNKNOWN'}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black font-roboto pt-28 flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-black mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-500 font-medium">Loading your purchases...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black font-roboto pt-28 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
          !
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Restrained</h2>
        <p className="text-gray-500 mb-8 max-w-sm">{error}</p>
        {!user && (
          <button
            onClick={() => {
              openAuthModal();
            }}
            className="px-8 py-3 bg-black text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign In / Register
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 bg-white text-black font-roboto min-h-screen">
      <div className="w-[70%] max-lg:w-[85%] max-md:w-[94%] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Order History</h1>
            <p className="text-gray-500 text-sm mt-1">Track and review all your purchases</p>
          </div>
          <Link to="/" className="text-sm font-semibold text-gray-900 hover:underline mt-4 md:mt-0 inline-flex items-center gap-1.5">
            ← Continue Shopping
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth="1.5" 
              stroke="currentColor" 
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Orders Found</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">You haven't placed any checkout orders yet.</p>
            <Link to="/" className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:opacity-90 transition">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={order.id} 
                  className="border border-gray-150 rounded-xl overflow-hidden shadow-xs bg-white hover:border-gray-300 transition-colors"
                >
                  {/* Order Header Summary */}
                  <div 
                    onClick={() => toggleOrderExpand(order.id)}
                    className="p-6 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                  >
                    <div className="grid grid-cols-2 md:flex md:gap-12 gap-x-4 gap-y-2">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Order ID</p>
                        <p className="text-sm font-extrabold text-gray-900 mt-0.5">#{order.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Placed On</p>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{formattedDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Amount</p>
                        <p className="text-sm font-extrabold text-gray-900 mt-0.5">${order.totalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</p>
                        <div className="mt-1">{getStatusBadge(order.status)}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-gray-500 hover:text-black transition-colors flex items-center justify-end gap-1">
                        {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Items & Info */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-6 space-y-6 animate-fadeIn">
                      <div>
                        <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wide mb-4">Items Purchased</h4>
                        <div className="space-y-4">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                              <div className="w-16 h-20 overflow-hidden rounded bg-gray-50 border flex-shrink-0">
                                <img 
                                  src={item.product?.images?.[0] || 'https://via.placeholder.com/100x120'} 
                                  alt={item.product?.name || 'Product'} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="flex-grow">
                                <Link 
                                  to={`/product/${item.productId}`}
                                  className="font-bold text-base hover:underline text-gray-900 line-clamp-1"
                                >
                                  {item.product?.name || 'Unnamed Product'}
                                </Link>
                                <p className="text-gray-500 text-xs mt-0.5">
                                  Size: <span className="font-semibold text-gray-700">{item.selectedSize}</span> | Color: <span className="font-semibold text-gray-700">{item.selectedColor}</span>
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  Qty: <span className="font-semibold text-gray-700">{item.quantity}</span> @ ${item.price.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right font-bold text-gray-900">
                                ${(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <h4 className="font-bold text-gray-800 mb-2">Shipping Information</h4>
                          <div className="bg-gray-50 p-4 rounded-lg text-gray-600 space-y-1">
                            <p className="font-medium text-gray-900">{order.shippingAddress?.split(',')[0]}</p>
                            <p>{order.shippingAddress?.split(',').slice(1).join(',').trim() || order.shippingAddress}</p>
                            <p className="text-xs text-gray-400 pt-1">Email: {order.customerEmail}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-800 mb-2">Payment Details</h4>
                          <div className="bg-gray-50 p-4 rounded-lg text-gray-600 space-y-2">
                            <div className="flex justify-between">
                              <span>Payment Gateway</span>
                              <span className="font-semibold text-gray-950">Stripe Secure</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Transaction ID</span>
                              <span className="font-mono text-xs text-gray-400">{order.stripePaymentIntentId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
