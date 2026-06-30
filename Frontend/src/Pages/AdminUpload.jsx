import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE from '../config';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';

// Default fallbacks removed

const AdminUpload = () => {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'products', 'banners', or 'categories'
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // --- Dashboard States ---
  useEffect(() => {
    document.title = "Admin Dashboard — Devclothes";
  }, []);

  // Auto-dismiss Toast Alert popup after 4 seconds
  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 4000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const [dashboardStats, setDashboardStats] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [timeFilter, setTimeFilter] = useState('All'); // 'Today', '7days', '30days', 'All'

  // --- Restocking States & Handlers ---
  const [restockInputs, setRestockInputs] = useState({});
  const [updatingStockKeys, setUpdatingStockKeys] = useState({});

  const getLowStockVariants = (products) => {
    if (!products || !Array.isArray(products)) return [];
    const variants = [];
    products.forEach(product => {
      let hasNestedSizeStock = false;
      if (product.sizeStock && typeof product.sizeStock === 'object') {
        const keys = Object.keys(product.sizeStock);
        if (keys.length > 0 && typeof product.sizeStock[keys[0]] === 'object' && product.sizeStock[keys[0]] !== null) {
          hasNestedSizeStock = true;
        }
      }

      if (hasNestedSizeStock) {
        Object.entries(product.sizeStock).forEach(([color, sizesObj]) => {
          if (sizesObj && typeof sizesObj === 'object') {
            Object.entries(sizesObj).forEach(([size, count]) => {
              const countNum = parseInt(count, 10) || 0;
              if (countNum <= 10) {
                variants.push({ product, color, size, count: countNum });
              }
            });
          }
        });
      } else if (product.sizeStock && typeof product.sizeStock === 'object' && Object.keys(product.sizeStock).length > 0) {
        Object.entries(product.sizeStock).forEach(([size, count]) => {
          const countNum = parseInt(count, 10) || 0;
          if (countNum <= 10) {
            variants.push({ product, color: null, size, count: countNum });
          }
        });
      } else if (product.colorStock && typeof product.colorStock === 'object' && Object.keys(product.colorStock).length > 0) {
        Object.entries(product.colorStock).forEach(([color, count]) => {
          const countNum = parseInt(count, 10) || 0;
          if (countNum <= 10) {
            variants.push({ product, color, size: null, count: countNum });
          }
        });
      }
    });
    return variants;
  };

  const handleDecrement = (key, currentValue) => {
    const val = Math.max(0, (parseInt(currentValue, 10) || 0) - 1);
    setRestockInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleIncrement = (key, currentValue) => {
    const val = (parseInt(currentValue, 10) || 0) + 1;
    setRestockInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleInputChange = (key, e) => {
    const valStr = e.target.value.replace(/[^0-9]/g, '');
    const val = valStr === '' ? '' : parseInt(valStr, 10);
    setRestockInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleUpdateStock = async (product, color, size, newValue) => {
    const key = `${product.id}-${color}-${size}`;
    const parsedCount = parseInt(newValue, 10);
    if (isNaN(parsedCount) || parsedCount < 0) return;

    setUpdatingStockKeys(prev => ({ ...prev, [key]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/products/${product.id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ color, size, count: parsedCount })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update stock.');
      }

      const data = await response.json();

      setDashboardStats(prev => {
        if (!prev) return prev;
        const updatedLowStock = prev.lowStockProducts.map(p => {
          if (p.id === product.id) {
            const updatedProduct = { ...p };
            if (color && updatedProduct.sizeStock && updatedProduct.sizeStock[color]) {
              const colorSizeCopy = { ...updatedProduct.sizeStock[color] };
              colorSizeCopy[size] = parsedCount;
              updatedProduct.sizeStock = {
                ...updatedProduct.sizeStock,
                [color]: colorSizeCopy
              };
            } else if (size && updatedProduct.sizeStock && updatedProduct.sizeStock[size] !== undefined) {
              updatedProduct.sizeStock = {
                ...updatedProduct.sizeStock,
                [size]: parsedCount
              };
            } else if (color && updatedProduct.colorStock && updatedProduct.colorStock[color] !== undefined) {
              updatedProduct.colorStock = {
                ...updatedProduct.colorStock,
                [color]: parsedCount
              };
            }
            return updatedProduct;
          }
          return p;
        });
        return {
          ...prev,
          lowStockProducts: updatedLowStock
        };
      });

      setDbProducts(prev => prev.map(p => {
        if (p.id === product.id) {
          return data.product;
        }
        return p;
      }));

      setRestockInputs(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });

      setMessage({ type: 'success', text: `Successfully updated stock for ${product.name}!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setUpdatingStockKeys(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleEditFromDashboard = (product) => {
    setActiveTab('products');
    handleProductEdit(product);
  };

  // --- Admin Product Management States ---
  const [dbProducts, setDbProducts] = useState([]);
  const [dbProductsLoading, setDbProductsLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('All');

  // --- Product Form States ---
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    price: '',
    category: 'Women',
    description: '',
    modelInfo: '',
  });
  const [colorsList, setColorsList] = useState([]); // Array of { color: string, enabled: boolean, sizeStock: object }
  const [newColorName, setNewColorName] = useState('');

  const [cardImage, setCardImage] = useState(null);
  const [cardPreview, setCardPreview] = useState('');
  const [detailImages, setDetailImages] = useState([]);
  const [detailPreviews, setDetailPreviews] = useState([]);


  // --- Slideshow Banners Form States ---
  const [slide1Image, setSlide1Image] = useState(null);
  const [slide1Preview, setSlide1Preview] = useState('');
  const [slide2Image, setSlide2Image] = useState(null);
  const [slide2Preview, setSlide2Preview] = useState('');
  const [dbBanners, setDbBanners] = useState([]);

  // --- Category Collection Banners States ---
  const [dbCategoryBanners, setDbCategoryBanners] = useState([]);
  const [pendingFiles, setPendingFiles] = useState({ Women: null, Men: null });
  const [pendingPreviews, setPendingPreviews] = useState({ Women: null, Men: null });

  // No cropping session needed



  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Fetch banners for list view
  const fetchDbBanners = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/banners`);
      if (response.ok) {
        const data = await response.json();
        setDbBanners(data);
      }
    } catch (err) {
      console.error('Failed to load database banners:', err);
    }
  };

  // Fetch category collection banners
  const fetchDbCategoryBanners = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/banners/categories`);
      if (response.ok) {
        const data = await response.json();
        setDbCategoryBanners(data);
      }
    } catch (err) {
      console.error('Failed to load category banners:', err);
    }
  };

  const fetchDashboardData = async () => {
    if (!token) return;
    setDashboardLoading(true);
    setDashboardError('');
    try {
      // Fetch stats
      const statsRes = await fetch(`${API_BASE}/api/payment/dashboard-stats`, {
        credentials: 'include'
      });
      if (!statsRes.ok) throw new Error('Failed to load dashboard metrics.');
      const statsData = await statsRes.json();
      setDashboardStats(statsData);

      // Fetch orders
      const ordersRes = await fetch(`${API_BASE}/api/payment/orders`, {
        credentials: 'include'
      });
      if (!ordersRes.ok) throw new Error('Failed to load orders.');
      const ordersData = await ordersRes.json();
      setOrdersList(ordersData);
    } catch (err) {
      console.error(err);
      setDashboardError(err.message || 'Error loading dashboard statistics.');
    } finally {
      setDashboardLoading(false);
    }
  };

  const updateFulfillmentStatus = async (orderId, newFulfillmentStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/payment/orders/${orderId}/fulfillment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ fulfillmentStatus: newFulfillmentStatus })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update fulfillment status.');
      }

      setOrdersList(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, fulfillmentStatus: newFulfillmentStatus } 
          : order
      ));

      setSelectedOrderForModal(prev => prev && prev.id === orderId 
        ? { ...prev, fulfillmentStatus: newFulfillmentStatus } 
        : prev
      );

      setMessage({ type: 'success', text: 'Order fulfillment status updated successfully!' });
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    }
  };

  // Helper to filter and compute metrics based on timeFilter
  const getFilteredMetricsAndOrders = () => {
    if (!ordersList || ordersList.length === 0) {
      return {
        filteredOrders: [],
        metrics: {
          totalRevenue: 0,
          totalOrders: 0,
          paidCount: 0,
          pendingCount: 0,
          aov: 0
        }
      };
    }

    const now = new Date();
    let cutoffDate = null;

    if (timeFilter === 'Today') {
      cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeFilter === '7days') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === '30days') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const filteredOrders = cutoffDate 
      ? ordersList.filter(order => new Date(order.createdAt) >= cutoffDate)
      : ordersList;

    let totalRevenue = 0;
    let totalOrders = filteredOrders.length;
    let paidCount = 0;
    let pendingCount = 0;

    filteredOrders.forEach(order => {
      if (order.status === 'PAID') {
        totalRevenue += order.totalAmount;
        paidCount++;
      } else if (order.status === 'PENDING') {
        pendingCount++;
      }
    });

    const aov = paidCount > 0 ? totalRevenue / paidCount : 0;

    return {
      filteredOrders,
      metrics: {
        totalRevenue,
        totalOrders,
        paidCount,
        pendingCount,
        aov
      }
    };
  };

  const { filteredOrders, metrics: activeMetrics } = getFilteredMetricsAndOrders();

  const getChartData = () => {
    const dataPoints = [];
    const now = new Date();
    
    let daysToInclude = 7;
    if (timeFilter === 'Today') daysToInclude = 1;
    else if (timeFilter === '7days') daysToInclude = 7;
    else if (timeFilter === '30days') daysToInclude = 30;
    else if (timeFilter === 'All') daysToInclude = 30; // default to 30 days for visual trends

    if (daysToInclude === 1) {
      for (let i = 7; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 3 * 60 * 60 * 1000);
        const label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const startTime = now.getTime() - (i + 1) * 3 * 60 * 60 * 1000;
        const endTime = now.getTime() - i * 3 * 60 * 60 * 1000;
        const revenue = ordersList
          .filter(order => order.status === 'PAID')
          .filter(order => {
            const t = new Date(order.createdAt).getTime();
            return t >= startTime && t < endTime;
          })
          .reduce((sum, order) => sum + order.totalAmount, 0);

        dataPoints.push({ label, value: revenue });
      }
    } else {
      for (let i = daysToInclude - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
        const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
        
        const revenue = ordersList
          .filter(order => order.status === 'PAID')
          .filter(order => {
            const t = new Date(order.createdAt).getTime();
            return t >= startOfDay && t <= endOfDay;
          })
          .reduce((sum, order) => sum + order.totalAmount, 0);

        dataPoints.push({ label, value: revenue });
      }
    }

    return dataPoints;
  };

  const chartData = getChartData();

  const fetchDbProducts = async () => {
    setDbProductsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setDbProducts(data);
      }
    } catch (err) {
      console.error('Failed to load database products:', err);
    } finally {
      setDbProductsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'products') {
      fetchDbProducts();
    } else if (activeTab === 'homepage-media') {
      fetchDbBanners();
      fetchDbCategoryBanners();
    }
  }, [activeTab, token]);

  // Handle redirect from header notification click (Orders)
  useEffect(() => {
    const redirectOrderId = localStorage.getItem('adminRedirectOrderId');
    if (redirectOrderId) {
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      } else if (ordersList.length > 0) {
        const order = ordersList.find(o => String(o.id) === String(redirectOrderId));
        if (order) {
          setSelectedOrderForModal(order);
          localStorage.removeItem('adminRedirectOrderId');
        }
      }
    }
  }, [ordersList, activeTab]);

  // Handle redirect from header notification click (Products/Low Stock)
  useEffect(() => {
    const redirectProductId = localStorage.getItem('adminRedirectProductId');
    if (redirectProductId) {
      if (activeTab !== 'products') {
        setActiveTab('products');
      } else if (dbProducts.length > 0) {
        const product = dbProducts.find(p => String(p.id) === String(redirectProductId));
        if (product) {
          handleProductEdit(product);
          localStorage.removeItem('adminRedirectProductId');
        }
      }
    }
  }, [dbProducts, activeTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-[48px] bg-white text-black font-roboto">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-semibold">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black font-roboto p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Access Denied</h2>
          <p className="text-gray-500">
            You do not have permission to access the Admin Portal. Please sign in with an administrator account.
          </p>
          <div>
            <Link to="/" className="inline-block px-6 py-3 bg-black text-white hover:opacity-90 active:scale-[0.99] transition font-bold rounded-lg text-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle Tab switches
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMessage({ type: '', text: '' });
    setAdminSearchQuery('');
    setAdminCategoryFilter('All');
  };

  // --- Product Handlers ---
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorStockChange = (index, newStockVal) => {
    const parsed = parseInt(newStockVal, 10) || 0;
    setColorsList((prev) =>
      prev.map((c, i) => i === index ? { ...c, stock: parsed } : c)
    );
  };

  const handleColorSizeStockChange = (colorIndex, size, stock) => {
    const parsed = Math.max(0, parseInt(stock, 10) || 0);
    setColorsList((prev) =>
      prev.map((c, i) => {
        if (i !== colorIndex) return c;
        return {
          ...c,
          sizeStock: {
            ...c.sizeStock,
            [size]: parsed
          }
        };
      })
    );
  };


  const handleAddColor = () => {
    const trimmedColor = newColorName.trim();
    if (!trimmedColor) return;

    // Check if color already exists
    if (colorsList.some(c => c.color.toLowerCase() === trimmedColor.toLowerCase())) {
      alert('Color already exists in the list!');
      return;
    }

    setColorsList((prev) => [
      ...prev,
      {
        color: trimmedColor,
        stock: 0,
        enabled: true,
        sizeStock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
      }
    ]);
    setNewColorName('');
  };

  const handleColorToggle = (index) => {
    setColorsList((prev) =>
      prev.map((c, i) => i === index ? { ...c, enabled: !c.enabled } : c)
    );
  };

  const handleRemoveColor = (index) => {
    setColorsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCardImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCardImage(file);
      setCardPreview(URL.createObjectURL(file));
    }
  };

  const removeCardImage = () => {
    setCardImage(null);
    setCardPreview('');
  };

  const handleDetailImages = (e) => {
    const files = Array.from(e.target.files);
    if (detailImages.length + files.length > 5) {
      alert('You can upload up to 5 detail images.');
      return;
    }
    setDetailImages((prev) => [...prev, ...files]);

    const previews = files.map((file) => URL.createObjectURL(file));
    setDetailPreviews((prev) => [...prev, ...previews]);
  };

  const removeDetailImage = (index) => {
    setDetailImages((prev) => prev.filter((_, i) => i !== index));
    setDetailPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct && !cardImage) {
      setMessage({ type: 'error', text: 'Please select a card product image (main thumbnail).' });
      return;
    }

    const activeColors = colorsList.filter(c => c.enabled);
    if (activeColors.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one color variant.' });
      return;
    }

    // Validate that each enabled color's size stocks sum exactly to its defined total stock
    for (let c of activeColors) {
      const colorSizeTotal = Object.values(c.sizeStock).reduce((sum, val) => sum + val, 0);
      if (colorSizeTotal !== c.stock) {
        setMessage({
          type: 'error',
          text: `Stock Mismatch for ${c.color}: Total defined stock is ${c.stock}, but size stocks add up to ${colorSizeTotal}. Please distribute exactly ${c.stock} units among sizes.`
        });
        return;
      }
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('code', productForm.code);
    formData.append('price', productForm.price);
    formData.append('category', productForm.category);
    formData.append('description', productForm.description);
    formData.append('modelInfo', productForm.modelInfo);

    // Filter and append sizes
    const activeSizes = sizeOptions.filter(size => colorsList.some(c => c.enabled && c.sizeStock[size] > 0));
    activeSizes.forEach((size) => formData.append('sizes', size));

    const sizeStockObj = {};
    colorsList.filter(c => c.enabled).forEach(c => {
      sizeStockObj[c.color] = c.sizeStock;
    });
    formData.append('sizeStock', JSON.stringify(sizeStockObj));

    // Filter and append colors
    const activeColorNames = colorsList.filter(c => c.enabled).map(c => c.color);
    activeColorNames.forEach((color) => formData.append('colors', color));

    const colorStockObj = {};
    colorsList.filter(c => c.enabled).forEach(c => {
      colorStockObj[c.color] = Object.values(c.sizeStock).reduce((sum, v) => sum + v, 0);
    });
    formData.append('colorStock', JSON.stringify(colorStockObj));

    // Append images
    if (cardImage) {
      formData.append('cardImage', cardImage);
    }
    detailImages.forEach((file) => {
      formData.append('detailImages', file);
    });

    if (editingProduct) {
      const existingImages = [];
      if (cardPreview && !cardPreview.startsWith('blob:')) {
        existingImages.push(cardPreview);
      }
      detailPreviews.forEach((url) => {
        if (url && !url.startsWith('blob:')) {
          existingImages.push(url);
        }
      });
      formData.append('existingImages', JSON.stringify(existingImages));
    }

    try {
      const url = editingProduct
        ? `${API_BASE}/api/products/${editingProduct.id}`
        : `${API_BASE}/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save product details.');
      }

      setMessage({
        type: 'success',
        text: editingProduct ? 'Product details updated successfully!' : 'Product created successfully!'
      });

      // Reset Form State
      setProductForm({
        name: '',
        code: '',
        price: '',
        category: 'Women',
        description: '',
        modelInfo: '',
      });
      setColorsList([]);
      setNewColorName('');
      setCardImage(null);
      setCardPreview('');
      setDetailImages([]);
      setDetailPreviews([]);
      setEditingProduct(null);
      setShowProductForm(false);
      fetchDbProducts();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleProductEdit = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      code: prod.code,
      price: prod.price,
      category: prod.category,
      description: prod.description || '',
      modelInfo: prod.modelInfo || '',
    });

    // Parse colorsList from product configurations
    const initialColorsList = prod.colors ? prod.colors.map(color => {
      const sizeStockForColor = prod.sizeStock && prod.sizeStock[color] ? prod.sizeStock[color] : { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
      const totalColorStock = prod.colorStock && prod.colorStock[color] ? parseInt(prod.colorStock[color], 10) : 0;
      return {
        color,
        stock: totalColorStock,
        enabled: true,
        sizeStock: {
          XS: parseInt(sizeStockForColor.XS, 10) || 0,
          S: parseInt(sizeStockForColor.S, 10) || 0,
          M: parseInt(sizeStockForColor.M, 10) || 0,
          L: parseInt(sizeStockForColor.L, 10) || 0,
          XL: parseInt(sizeStockForColor.XL, 10) || 0,
          XXL: parseInt(sizeStockForColor.XXL, 10) || 0,
        }
      };
    }) : [];

    setColorsList(initialColorsList);
    setCardPreview(prod.images?.[0] || '');
    setDetailPreviews(prod.images?.slice(1) || []);
    setCardImage(null);
    setDetailImages([]);
    setShowProductForm(true);
  };

  const handleProductDelete = async (prodId) => {
    if (!window.confirm('Are you sure you want to delete this product from the database? This action is permanent.')) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/products/${prodId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Product deleted successfully.' });
        fetchDbProducts(); // Reload catalog list
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };


  // --- Banner & Slideshow Handlers ---
  const handleBannerImageSelect = (e, slot) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      if (slot === 1) {
        setSlide1Image(file);
        setSlide1Preview(objectUrl);
      } else if (slot === 2) {
        setSlide2Image(file);
        setSlide2Preview(objectUrl);
      }
      e.target.value = '';
    }
  };

  const handleSlideshowSubmit = async (e) => {
    e.preventDefault();
    if (!slide1Image && !slide2Image) {
      setMessage({ type: 'error', text: 'Please select at least one slide image to save.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (slide1Image) {
        const existingSlide1 = dbBanners.find(b => b.order === 1);
        if (existingSlide1) {
          // Delete old slide 1
          await fetch(`${API_BASE}/api/banners/${existingSlide1.id}`, { method: 'DELETE' });
        }
        const formData1 = new FormData();
        formData1.append('title', 'Slide 1');
        formData1.append('order', '1');
        formData1.append('image', slide1Image);
        const res1 = await fetch(`${API_BASE}/api/banners`, { method: 'POST', body: formData1 });
        if (!res1.ok) throw new Error('Failed to upload Slide 1.');
      }

      if (slide2Image) {
        const existingSlide2 = dbBanners.find(b => b.order === 2);
        if (existingSlide2) {
          // Delete old slide 2
          await fetch(`${API_BASE}/api/banners/${existingSlide2.id}`, { method: 'DELETE' });
        }
        const formData2 = new FormData();
        formData2.append('title', 'Slide 2');
        formData2.append('order', '2');
        formData2.append('image', slide2Image);
        const res2 = await fetch(`${API_BASE}/api/banners`, { method: 'POST', body: formData2 });
        if (!res2.ok) throw new Error('Failed to upload Slide 2.');
      }

      setMessage({ type: 'success', text: 'Slideshow banners updated successfully!' });

      // Reset local slide selections
      setSlide1Image(null);
      setSlide1Preview('');
      setSlide2Image(null);
      setSlide2Preview('');

      fetchDbBanners();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  // --- Collection Banners Handlers ---
  const handleFileSelect = (e, category) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPendingFiles((prev) => ({ ...prev, [category]: file }));
      setPendingPreviews((prev) => ({ ...prev, [category]: objectUrl }));
      e.target.value = '';
    }
  };

  const cancelPending = (category) => {
    setPendingFiles((prev) => ({ ...prev, [category]: null }));
    setPendingPreviews((prev) => ({ ...prev, [category]: null }));
  };

  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    if (!pendingFiles.Women && !pendingFiles.Men) {
      setMessage({ type: 'error', text: 'Please select at least one collection image to save.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (pendingFiles.Women) {
        const formData = new FormData();
        formData.append('category', 'Women');
        formData.append('image', pendingFiles.Women);
        const response = await fetch(`${API_BASE}/api/banners/categories`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Failed to update Women Collection banner.');
      }

      if (pendingFiles.Men) {
        const formData = new FormData();
        formData.append('category', 'Men');
        formData.append('image', pendingFiles.Men);
        const response = await fetch(`${API_BASE}/api/banners/categories`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Failed to update Men Collection banner.');
      }

      setMessage({
        type: 'success',
        text: 'Category collection banners updated successfully!'
      });

      // Clear pending
      setPendingFiles({ Women: null, Men: null });
      setPendingPreviews({ Women: null, Men: null });

      fetchDbCategoryBanners();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const deleteCategoryBanner = async (category) => {
    if (!window.confirm(`Are you sure you want to delete the banner for the ${category} Collection? If deleted, it will show no image.`)) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE}/api/banners/categories/${category}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully deleted the ${category} Collection banner.` });
        fetchDbCategoryBanners(); // Reload list
      } else {
        const result = await response.json();
        throw new Error(result.error || `Failed to delete ${category} banner.`);
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || `Failed to delete ${category} banner.` });
    } finally {
      setLoading(false);
    }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/banners/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Banner deleted successfully.' });
        fetchDbBanners(); // Reload list
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete banner.');
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete banner.' });
    }
  };

  const filteredProducts = dbProducts.filter((prod) => {
    const query = adminSearchQuery.toLowerCase().trim();
    const categoryMatches = adminCategoryFilter === 'All' || prod.category === adminCategoryFilter;
    const queryMatches = !query ||
      prod.name.toLowerCase().includes(query) ||
      (prod.code && prod.code.toLowerCase().includes(query));
    return categoryMatches && queryMatches;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-black font-roboto pt-[72px]">
      {/* Premium Toast Alert popup */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-24 right-6 z-[100] w-80 bg-white border border-black p-4 rounded-none shadow-md flex gap-3 text-black font-roboto"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border border-black">
              {message.type === 'success' ? (
                <span className="text-black font-bold text-sm">✓</span>
              ) : (
                <span className="text-black font-bold text-sm">✕</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-center pr-4">
              <div className="text-xs font-bold uppercase tracking-wider mb-0.5">
                {message.type === 'success' ? 'Success' : 'Error'}
              </div>
              <div className="text-[11px] font-semibold text-neutral-600 leading-snug">
                {message.text}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="absolute top-2 right-2 text-gray-400 hover:text-black transition focus:outline-none cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sticky Global Navigation Sidebar — White, matching storefront style */}
      <aside className="w-full md:w-56 bg-white flex flex-col justify-between flex-shrink-0 border-r border-gray-150 sticky top-[72px] md:h-[calc(100vh-72px)] z-30">
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Portal</p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-4 flex flex-row md:flex-col gap-0.5 overflow-x-auto md:overflow-x-visible">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
            )},
            { id: 'products', label: 'Products', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )},
            { id: 'homepage-media', label: 'Slideshow & Collections', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zM19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            )},
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap md:w-full text-left ${activeTab === tab.id
                ? 'bg-black text-white'
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Profile Footer */}
        <div className="p-4 border-t border-gray-100 hidden md:flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
              {user.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-black truncate" title={user.email}>
                {user.email}
              </p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Administrator</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 hover:text-black rounded-lg text-xs font-semibold transition border border-gray-200 hover:border-gray-400 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Storefront
            </Link>
            <button
              onClick={logout}
              className="flex items-center justify-center p-1.5 bg-white hover:bg-gray-50 text-gray-400 hover:text-black rounded-lg text-xs font-semibold transition border border-gray-200 hover:border-gray-400 cursor-pointer"
              title="Sign Out"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 w-full p-6 md:p-8 bg-white text-black overflow-y-auto font-roboto">

        {/* TAB 0: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-gray-250 gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-black">Dashboard Overview</h2>
                <p className="text-xs text-gray-400 mt-1 font-roboto">Real-time statistics & store health report</p>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                {/* Time Filters */}
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-roboto">
                  {[
                    { label: 'Today', value: 'Today' },
                    { label: '7 Days', value: '7days' },
                    { label: '30 Days', value: '30days' },
                    { label: 'All Time', value: 'All' }
                  ].map(filter => (
                    <button
                      type="button"
                      key={filter.value}
                      onClick={() => setTimeFilter(filter.value)}
                      className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${timeFilter === filter.value
                          ? 'bg-white text-black shadow-sm border border-gray-200'
                          : 'text-gray-400 hover:text-black'
                        }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-400 rounded-lg text-xs font-semibold transition cursor-pointer focus:outline-none"
                >
                  ↻ Refresh Data
                </button>
              </div>
            </div>

            {dashboardLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 text-sm">Loading store metrics...</p>
              </div>
            ) : dashboardError ? (
              <div className="p-4 bg-gray-100 border border-gray-200 text-black text-sm rounded-xl">
                {dashboardError}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="bg-white border border-gray-200 p-5 rounded-xl hover:shadow-sm transition">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Sales</p>
                    <p className="text-2xl font-bold text-black mt-1.5 tracking-tight">
                      ${activeMetrics.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 p-5 rounded-xl hover:shadow-sm transition">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Orders Count</p>
                    <p className="text-2xl font-bold text-black mt-1.5 tracking-tight">
                      {activeMetrics.totalOrders}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 p-5 rounded-xl hover:shadow-sm transition">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paid Orders</p>
                    <p className="text-2xl font-bold text-black mt-1.5 tracking-tight">
                      {activeMetrics.paidCount}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 p-5 rounded-xl hover:shadow-sm transition">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Orders</p>
                    <p className="text-2xl font-bold text-black mt-1.5 tracking-tight">
                      {activeMetrics.pendingCount}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 p-5 rounded-xl hover:shadow-sm transition col-span-2 lg:col-span-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Order Value</p>
                    <p className="text-2xl font-bold text-black mt-1.5 tracking-tight">
                      ${activeMetrics.aov.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Trend Chart Container */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <SalesTrendChart data={chartData} />
                </div>

                {/* Grid Split: Recent Orders and Low Stock Warnings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Recent Orders */}
                  <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-base text-black tracking-tight">Recent Orders</h3>
                    </div>
                    {filteredOrders.length === 0 ? (
                      <p className="text-gray-400 text-sm italic">No orders found.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                            <tr>
                              <th className="p-4">Customer</th>
                              <th className="p-4">Total</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Fulfillment</th>
                              <th className="p-4">Date</th>
                              <th className="p-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-gray-600">
                            {filteredOrders.slice(0, 10).map((order) => (
                              <tr key={order.id} className="hover:bg-gray-50 transition">
                                <td className="p-4 truncate max-w-[140px]" title={order.customerEmail}>
                                  {order.customerEmail}
                                </td>
                                <td className="p-4 font-bold text-black">
                                  ${order.totalAmount.toFixed(2)}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'PAID'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                      : order.status === 'PENDING'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status !== 'PAID'
                                      ? 'bg-gray-100 text-gray-400 border border-gray-250'
                                      : order.fulfillmentStatus === 'Delivered'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : order.fulfillmentStatus === 'Shipped'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                    {order.status !== 'PAID' ? 'N/A' : (order.fulfillmentStatus || 'Unfulfilled')}
                                  </span>
                                </td>
                                <td className="p-4 text-xs text-gray-400">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => setSelectedOrderForModal(order)}
                                    className="px-3 py-1 bg-black text-white rounded text-[11px] font-bold tracking-wider hover:opacity-90 transition cursor-pointer"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Low Stock Warnings */}
                  <div className="bg-white border border-gray-150 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-base text-black tracking-tight">Low Stock Warnings</h3>
                    </div>
                    {(() => {
                      const lowStockVariants = getLowStockVariants(dashboardStats?.lowStockProducts);
                      if (lowStockVariants.length === 0) {
                        return (
                          <div className="text-center py-6">
                            <span className="text-3xl">🎉</span>
                            <p className="text-emerald-600 text-sm font-bold mt-2">All product inventory is healthy.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                          {lowStockVariants.map((variant, index) => {
                            const key = `${variant.product.id}-${variant.color}-${variant.size}`;
                            const currentValue = restockInputs[key] !== undefined ? restockInputs[key] : variant.count;
                            const isUpdating = !!updatingStockKeys[key];
                            const isChanged = currentValue !== variant.count;

                            return (
                              <div
                                key={`${variant.product.id}-${variant.color}-${variant.size}-${index}`}
                                className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-150 rounded-xl gap-3 hover:shadow-sm hover:border-gray-300 transition duration-200"
                              >
                                {/* Left Section: Thumbnail */}
                                <div className="w-10 h-14 aspect-[3/4] rounded bg-white border border-gray-200 flex-shrink-0 overflow-hidden">
                                  {variant.product.images?.[0] ? (
                                    <img
                                      src={variant.product.images[0]}
                                      alt={variant.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400 font-semibold bg-gray-200">
                                      No Img
                                    </div>
                                  )}
                                </div>

                                {/* Middle Section: Details */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-xs text-gray-900 truncate" title={variant.product.name}>
                                    {variant.product.name}
                                  </p>
                                  <p className="text-[9px] text-gray-400 font-mono">SKU: {variant.product.code}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 bg-white border border-gray-200 text-gray-700 text-[9px] font-bold rounded">
                                      {variant.color && variant.color !== 'Default' ? `${variant.color} / ${variant.size}` : variant.size}
                                    </span>
                                    <span className={`text-[9px] font-bold ${variant.count === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                                      ({variant.count} left)
                                    </span>
                                  </div>
                                </div>

                                {/* Right Section: Stepper restocker */}
                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                  <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white">
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleDecrement(key, currentValue)}
                                      className="px-1.5 py-0.5 hover:bg-gray-100 text-gray-500 font-bold text-xs transition disabled:opacity-50 cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="text"
                                      disabled={isUpdating}
                                      value={currentValue}
                                      onChange={(e) => handleInputChange(key, e)}
                                      className="w-8 text-center border-x border-gray-200 py-0.5 bg-white text-[10px] font-bold focus:outline-none text-black"
                                    />
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleIncrement(key, currentValue)}
                                      className="px-1.5 py-0.5 hover:bg-gray-100 text-gray-500 font-bold text-xs transition disabled:opacity-50 cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      disabled={!isChanged || isUpdating || currentValue === ''}
                                      onClick={() => handleUpdateStock(variant.product, variant.color, variant.size, currentValue)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide transition cursor-pointer ${isChanged && currentValue !== ''
                                          ? 'bg-black text-white hover:opacity-90 active:scale-[0.98]'
                                          : 'bg-white text-gray-400 border border-gray-200 cursor-not-allowed'
                                        }`}
                                    >
                                      {isUpdating ? 'Saving...' : 'Update'}
                                    </button>
                                    <button
                                      onClick={() => handleEditFromDashboard(variant.product)}
                                      className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded transition cursor-pointer"
                                      title="Edit Product Details"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-3 h-3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OTHER TABS IN WHITE CARD CONTAINER */}
        {activeTab !== 'dashboard' && (
          <div className="bg-white border border-gray-150 rounded-xl p-8">

          {/* TAB 1: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6 font-roboto">
              {!showProductForm ? (
                // Catalog List View
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Product Catalog
                    </h3>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm({
                          name: '',
                          code: '',
                          price: '',
                          category: 'Women',
                          description: '',
                          modelInfo: '',
                        });
                        setColorsList([]);
                        setCardPreview('');
                        setDetailPreviews([]);
                        setCardImage(null);
                        setDetailImages([]);
                        setShowProductForm(true);
                        setMessage({ type: '', text: '' });
                      }}
                      className="px-4 py-2.5 bg-black hover:opacity-90 active:scale-[0.99] text-white font-bold text-xs tracking-wide rounded-lg cursor-pointer transition-all shadow-sm"
                    >
                      + Add New Product
                    </button>
                  </div>

                  {/* Search and Filter Container */}
                  {!dbProductsLoading && dbProducts.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 text-sm">
                          <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </span>
                        <input
                          type="text"
                          placeholder="Search products by name or ID/code..."
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 focus:border-black rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black transition"
                        />
                        {adminSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setAdminSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-sm text-gray-450 hover:text-black transition focus:outline-none cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        )}
                      </div>

                      {/* Category Filter */}
                      <div className="w-full sm:w-48">
                        <select
                          value={adminCategoryFilter}
                          onChange={(e) => setAdminCategoryFilter(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:border-black transition cursor-pointer"
                        >
                          <option value="All">All Categories</option>
                          <option value="Women">Women</option>
                          <option value="Men">Men</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {dbProductsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-500 text-sm">Loading database products...</p>
                    </div>
                  ) : dbProducts.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="text-gray-500 text-sm italic">No products exist in the catalog database yet.</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="text-gray-500 text-sm italic">No products match your search "{adminSearchQuery}".</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                          <tr>
                            <th className="p-4 w-[80px]">Preview</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">ID / Code</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          {filteredProducts.map((prod) => (
                            <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4">
                                <div className="w-12 aspect-[3/4] rounded-sm overflow-hidden bg-gray-100 border border-gray-200">
                                  {prod.images?.[0] ? (
                                    <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-semibold bg-gray-200">No Img</div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 font-bold text-black max-w-[200px] truncate" title={prod.name}>
                                {prod.name}
                              </td>
                              <td className="p-4 font-mono text-xs font-semibold text-gray-500">
                                {prod.code}
                              </td>
                              <td className="p-4 text-xs font-bold uppercase">
                                <span className={`px-2 py-0.5 rounded ${prod.category === 'Women' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                                  }`}>
                                  {prod.category}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-black">
                                ${prod.price.toFixed(2)}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleProductEdit(prod)}
                                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded text-[11px] font-bold tracking-wider transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleProductDelete(prod.id)}
                                    className="px-3.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded text-[11px] font-bold tracking-wider transition cursor-pointer border border-rose-100"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                // Form view for Add / Edit
                <form onSubmit={handleProductSubmit} className="space-y-6">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-3">
                    {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                      <input
                        type="text"
                        name="name"
                        value={productForm.name}
                        onChange={handleProductChange}
                        required
                        placeholder="e.g. Gathering Midi Dress"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Product ID/Code (Unique)</label>
                      <input
                        type="text"
                        name="code"
                        value={productForm.code}
                        onChange={handleProductChange}
                        required
                        placeholder="e.g. 22225011172"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Price (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="price"
                        value={productForm.price}
                        onChange={handleProductChange}
                        required
                        placeholder="e.g. 17.59"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                      <select
                        name="category"
                        value={productForm.category}
                        onChange={handleProductChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black focus:outline-none focus:border-black transition text-sm"
                      >
                        <option value="Women">Women</option>
                        <option value="Men">Men</option>
                      </select>
                    </div>
                  </div>

                  {/* Product Color & Size Stock Configuration */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-semibold text-gray-700">Product Colors & Size Stocks</label>
                      <span className="px-2.5 py-1 bg-black text-white rounded text-xs font-bold uppercase tracking-wider">
                        Total Product Stock: {colorsList.filter(c => c.enabled).reduce((sum, c) => sum + Object.values(c.sizeStock).reduce((sSum, v) => sSum + v, 0), 0)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        placeholder="Type color name (e.g. Red, Blue)..."
                        className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="px-6 py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg text-sm transition cursor-pointer"
                      >
                        Add Color
                      </button>
                    </div>

                    {colorsList.length === 0 ? (
                      <p className="text-gray-400 text-sm italic py-2">No colors added yet. Type a color above and click "Add Color".</p>
                    ) : (
                      <div className="space-y-6 pt-2">
                        {colorsList.map((c, index) => {
                          const colorTotalStock = Object.values(c.sizeStock).reduce((sum, val) => sum + val, 0);
                          return (
                            <div key={index} className="border border-gray-255 rounded-xl p-5 bg-white space-y-4 shadow-sm">
                              {/* Color Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <input
                                    type="checkbox"
                                    id={`color-check-${index}`}
                                    checked={c.enabled}
                                    onChange={() => handleColorToggle(index)}
                                    className="w-5 h-5 accent-black rounded cursor-pointer border-gray-300"
                                  />
                                  <label htmlFor={`color-check-${index}`} className="font-bold text-base text-gray-900 cursor-pointer uppercase">
                                    {c.color}
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Stock:</label>
                                    <input
                                      type="number"
                                      min="0"
                                      disabled={!c.enabled}
                                      value={c.stock === 0 ? '' : c.stock}
                                      placeholder="0"
                                      onChange={(e) => handleColorStockChange(index, e.target.value)}
                                      className="w-16 px-2 py-1 bg-gray-50 border border-gray-255 rounded text-black text-center focus:outline-none focus:border-black disabled:opacity-35 disabled:cursor-not-allowed text-xs font-bold"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColor(index)}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer self-start sm:self-center"
                                >
                                  ✕ Remove Color
                                </button>
                              </div>

                              {/* Color Body - Size configuration for this color */}
                              {c.enabled && (
                                <div className="space-y-3">
                                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Configure Sizes for {c.color} (allocate exactly {c.stock} units):</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {sizeOptions.map((size) => {
                                      return (
                                        <div key={size} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                          <span className="font-bold text-xs min-w-[28px] text-gray-900">
                                            {size}
                                          </span>
                                          <input
                                            type="number"
                                            min="0"
                                            value={c.sizeStock[size] === 0 ? '' : c.sizeStock[size]}
                                            onChange={(e) => handleColorSizeStockChange(index, size, e.target.value)}
                                            placeholder="0"
                                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-black text-center focus:outline-none focus:border-black text-xs font-semibold"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Size Allocation Status Indicator */}
                                  <div className="pt-2 flex justify-between items-center text-xs font-semibold">
                                    <span className="text-gray-500">Allocated: {colorTotalStock} / {c.stock}</span>
                                    {colorTotalStock === c.stock ? (
                                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">✓ Balanced</span>
                                    ) : colorTotalStock < c.stock ? (
                                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">⚠️ Needs {c.stock - colorTotalStock} more</span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">⚠️ Exceeds by {colorTotalStock - c.stock}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Model Info</label>
                    <input
                      type="text"
                      name="modelInfo"
                      value={productForm.modelInfo}
                      onChange={handleProductChange}
                      placeholder="e.g. Model is 163 cm tall / 45 kg weight and is wearing size XS."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleProductChange}
                      rows="4"
                      placeholder="Describe the product details, materials..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition resize-none text-sm"
                    />
                  </div>

                  {/* Image Upload Guideline Note */}
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-amber-500 text-base mt-0.5">💡</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800">Image Guideline — Card Image</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">Upload a <strong>portrait-oriented image</strong> at a <strong>3:4 aspect ratio</strong> (e.g. 900×1200px) for best results. Landscape or square images will be cropped and may not display correctly in the product grid.</p>
                    </div>
                  </div>

                  {/* Card & Detail Images Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Card Image (Main Thumbnail)</label>
                      {!cardPreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 hover:border-black rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100/50 transition-all duration-300">
                          <div className="flex flex-col items-center justify-center pt-4 pb-4">
                            <p className="text-xs text-gray-600"><span className="font-semibold">Upload Card Image</span></p>
                            <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, JPEG, WEBP (Single file)</p>
                          </div>
                          <input type="file" accept="image/*" onChange={handleCardImage} className="hidden" />
                        </label>
                      ) : (
                        <div className="relative group aspect-[3/4] h-32 mx-auto rounded-lg overflow-hidden border border-gray-200">
                          <img src={cardPreview} alt="card preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={removeCardImage}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Detail Images (Slideshow, Max 5)</label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 hover:border-black rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100/50 transition-all duration-300">
                        <div className="flex flex-col items-center justify-center pt-4 pb-4">
                          <p className="text-xs text-gray-600"><span className="font-semibold">Upload Detail Images</span></p>
                          <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, JPEG, WEBP (Max 5 files)</p>
                        </div>
                        <input type="file" multiple accept="image/*" onChange={handleDetailImages} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {detailPreviews.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-2">Detail Image Previews ({detailPreviews.length}/5)</label>
                      <div className="grid grid-cols-5 gap-3">
                        {detailPreviews.map((preview, index) => (
                          <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            <img src={preview} alt={`detail-${index}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeDetailImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600 text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 py-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg transition active:scale-[0.99] transition-transform shadow-sm flex items-center justify-center gap-2 cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                      {loading ? (editingProduct ? 'Saving changes...' : 'Creating product...') : (editingProduct ? 'Save Changes' : 'Create Product')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setShowProductForm(false);
                        setMessage({ type: '', text: '' });

                        setProductForm({ name: '', code: '', price: '', category: 'Women', description: '', modelInfo: '' });
                        setColorsList([]);
                        setCardPreview('');
                        setDetailPreviews([]);
                        setCardImage(null);
                        setDetailImages([]);
                      }}
                      className="px-6 py-4 border border-gray-250 hover:border-black text-black font-bold rounded-lg transition cursor-pointer text-sm"
                    >
                      Cancel
                    </button>
                  </div>

                </form>
              )}
            </div>
          )}
          {activeTab === 'homepage-media' && (
            <div className="space-y-12">
              <div className="pb-4 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-baseline">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Homepage Banners</h3>
                  <p className="text-xs text-gray-400 mt-1">Upload and manage media for the storefront homepage slideshow and collection sections.</p>
                </div>
              </div>

              <form onSubmit={handleSlideshowSubmit} className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2 pt-2">
                  <h4 className="text-base font-bold text-gray-900">1. Hero Slideshow Banners</h4>
                  <span className="text-xs text-gray-400 font-medium">Select and save Slide 1 and/or Slide 2 images.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Slide 1 Slot */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-sm font-extrabold text-black">Slide 1 Image</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono">1920 × 820px</span>
                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Required</span>
                      </div>
                    </div>

                    <label className="cursor-pointer block relative aspect-[21/9] bg-gray-50 border-2 border-dashed border-gray-200 hover:border-black rounded-lg overflow-hidden transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBannerImageSelect(e, 1)}
                        className="hidden"
                      />
                      
                      {slide1Preview ? (
                        <img src={slide1Preview} alt="Slide 1 Preview" className="w-full h-full object-cover" />
                      ) : dbBanners.find(b => b.order === 1) ? (
                        <img
                          src={dbBanners.find(b => b.order === 1).imageUrl}
                          alt="Current Slide 1"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                          <span className="text-2xl mb-1">📷</span>
                          <span className="text-xs font-bold text-black">Select Slide 1 Image</span>
                          <span className="text-[9px] text-gray-450 mt-0.5">Click to choose file</span>
                        </div>
                      )}
                    </label>

                    <div className="text-xs space-y-1 text-gray-500 pt-1">
                      {!slide1Preview && !dbBanners.find(b => b.order === 1) && (
                        <p className="italic text-gray-400">No active Slide 1 banner override set.</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {slide1Preview && (
                        <button
                          type="button"
                          onClick={() => {
                            setSlide1Image(null);
                            setSlide1Preview('');
                          }}
                          className="flex-1 py-2 border border-gray-200 hover:border-black text-black font-semibold text-xs rounded transition uppercase tracking-wider cursor-pointer bg-white"
                        >
                          Cancel Selection
                        </button>
                      )}
                      {!slide1Preview && dbBanners.find(b => b.order === 1) && (
                        <button
                          type="button"
                          onClick={() => deleteBanner(dbBanners.find(b => b.order === 1).id)}
                          className="flex-1 py-2 border border-gray-200 hover:border-red-500 hover:text-red-500 text-black font-semibold text-xs rounded transition uppercase tracking-wider cursor-pointer bg-white"
                        >
                          Delete Banner
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slide 2 Slot */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-sm font-extrabold text-black">Slide 2 Image</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono">1920 × 820px</span>
                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Required</span>
                      </div>
                    </div>

                    <label className="cursor-pointer block relative aspect-[21/9] bg-gray-50 border-2 border-dashed border-gray-200 hover:border-black rounded-lg overflow-hidden transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBannerImageSelect(e, 2)}
                        className="hidden"
                      />
                      
                      {slide2Preview ? (
                        <img src={slide2Preview} alt="Slide 2 Preview" className="w-full h-full object-cover" />
                      ) : dbBanners.find(b => b.order === 2) ? (
                        <img
                          src={dbBanners.find(b => b.order === 2).imageUrl}
                          alt="Current Slide 2"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                          <span className="text-2xl mb-1">📷</span>
                          <span className="text-xs font-bold text-black">Select Slide 2 Image</span>
                          <span className="text-[9px] text-gray-455 mt-0.5">Click to choose file</span>
                        </div>
                      )}
                    </label>

                    <div className="text-xs space-y-1 text-gray-550 pt-1">
                      {!slide2Preview && !dbBanners.find(b => b.order === 2) && (
                        <p className="italic text-gray-400">No active Slide 2 banner override set.</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {slide2Preview && (
                        <button
                          type="button"
                          onClick={() => {
                            setSlide2Image(null);
                            setSlide2Preview('');
                          }}
                          className="flex-1 py-2 border border-gray-200 hover:border-black text-black font-semibold text-xs rounded transition uppercase tracking-wider cursor-pointer bg-white"
                        >
                          Cancel Selection
                        </button>
                      )}
                      {!slide2Preview && dbBanners.find(b => b.order === 2) && (
                        <button
                          type="button"
                          onClick={() => deleteBanner(dbBanners.find(b => b.order === 2).id)}
                          className="flex-1 py-2 border border-gray-200 hover:border-red-500 hover:text-red-500 text-black font-semibold text-xs rounded transition uppercase tracking-wider cursor-pointer bg-white"
                        >
                          Delete Banner
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || (!slide1Image && !slide2Image)}
                    className={`w-full py-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg transition active:scale-[0.99] transition-transform shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                      loading || (!slide1Image && !slide2Image) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Saving slideshow banners...' : 'Save Slideshow Banners'}
                  </button>
                </div>
              </form>
            {/* Section Divider */}
            <hr className="my-12 border-gray-200" />

            <form onSubmit={handleCollectionSubmit} className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2">
                <h4 className="text-base font-bold text-gray-900">2. Homepage Collection Banners</h4>
                <span className="text-xs text-gray-400 font-medium">Select and save Women and/or Men Collection images.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Women Collection Slot */}
                <div className="border border-gray-200 rounded-xl bg-white p-4 flex flex-col sm:flex-row gap-4 items-start">
                  {/* Compact Image Selector */}
                  <label className="cursor-pointer flex-shrink-0 w-full sm:w-48 aspect-[4/5] bg-gray-50 border border-dashed border-gray-200 hover:border-black rounded-lg overflow-hidden transition-colors flex items-center justify-center relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'Women')}
                      className="hidden"
                      disabled={loading}
                    />
                    {pendingPreviews.Women ? (
                      <img src={pendingPreviews.Women} alt="Women Collection Preview" className="w-full h-full object-cover" />
                    ) : dbCategoryBanners.find(b => b.category === 'Women') ? (
                      <img
                        src={dbCategoryBanners.find(b => b.category === 'Women').imageUrl}
                        alt="Current Women Collection"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-[11px] font-bold text-black mt-0.5">Select Women Collection</span>
                        <span className="text-[9px] text-gray-450 mt-0.5">Click to choose file</span>
                      </div>
                    )}
                  </label>

                  {/* Metadata & Actions */}
                  <div className="flex-1 flex flex-col justify-between w-full h-full min-h-[240px] text-center sm:text-left py-1">
                    <div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 border-b border-gray-100 pb-2">
                        <span className="text-sm font-extrabold text-black">Women Collection</span>
                        <span className="text-[10px] text-gray-400 font-mono">1000 × 1250px</span>
                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Required</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        {pendingPreviews.Women ? 'New Image Selected (pending save)' : dbCategoryBanners.find(b => b.category === 'Women') ? 'Active Category Banner' : 'No active banner set'}
                      </p>
                    </div>

                    <div className="flex justify-center sm:justify-start gap-2 mt-auto pt-4">
                      {pendingPreviews.Women && (
                        <button
                          type="button"
                          onClick={() => cancelPending('Women')}
                          className="px-4 py-2 border border-gray-250 hover:border-black text-black font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer bg-white"
                        >
                          Cancel
                        </button>
                      )}
                      {!pendingPreviews.Women && dbCategoryBanners.find(b => b.category === 'Women') && (
                        <button
                          type="button"
                          onClick={() => deleteCategoryBanner('Women')}
                          disabled={loading}
                          className="px-4 py-2 border border-gray-250 hover:border-red-500 hover:text-red-500 text-black font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer bg-white"
                        >
                          Delete Banner
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Men Collection Slot */}
                <div className="border border-gray-200 rounded-xl bg-white p-4 flex flex-col sm:flex-row gap-4 items-start">
                  {/* Compact Image Selector */}
                  <label className="cursor-pointer flex-shrink-0 w-full sm:w-48 aspect-[4/5] bg-gray-50 border border-dashed border-gray-200 hover:border-black rounded-lg overflow-hidden transition-colors flex items-center justify-center relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'Men')}
                      className="hidden"
                      disabled={loading}
                    />
                    {pendingPreviews.Men ? (
                      <img src={pendingPreviews.Men} alt="Men Collection Preview" className="w-full h-full object-cover" />
                    ) : dbCategoryBanners.find(b => b.category === 'Men') ? (
                      <img
                        src={dbCategoryBanners.find(b => b.category === 'Men').imageUrl}
                        alt="Current Men Collection"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-[11px] font-bold text-black mt-0.5">Select Men Collection</span>
                        <span className="text-[9px] text-gray-450 mt-0.5">Click to choose file</span>
                      </div>
                    )}
                  </label>

                  {/* Metadata & Actions */}
                  <div className="flex-1 flex flex-col justify-between w-full h-full min-h-[240px] text-center sm:text-left py-1">
                    <div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 border-b border-gray-100 pb-2">
                        <span className="text-sm font-extrabold text-black">Men Collection</span>
                        <span className="text-[10px] text-gray-400 font-mono">1000 × 1250px</span>
                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Required</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        {pendingPreviews.Men ? 'New Image Selected (pending save)' : dbCategoryBanners.find(b => b.category === 'Men') ? 'Active Category Banner' : 'No active banner set'}
                      </p>
                    </div>

                    <div className="flex justify-center sm:justify-start gap-2 mt-auto pt-4">
                      {pendingPreviews.Men && (
                        <button
                          type="button"
                          onClick={() => cancelPending('Men')}
                          className="px-4 py-2 border border-gray-250 hover:border-black text-black font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer bg-white"
                        >
                          Cancel
                        </button>
                      )}
                      {!pendingPreviews.Men && dbCategoryBanners.find(b => b.category === 'Men') && (
                        <button
                          type="button"
                          onClick={() => deleteCategoryBanner('Men')}
                          disabled={loading}
                          className="px-4 py-2 border border-gray-250 hover:border-red-500 hover:text-red-500 text-black font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer bg-white"
                        >
                          Delete Banner
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || (!pendingFiles.Women && !pendingFiles.Men)}
                  className={`w-full py-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg transition active:scale-[0.99] transition-transform shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                    loading || (!pendingFiles.Women && !pendingFiles.Men) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Saving collection banners...' : 'Save Collection Banners'}
                </button>
              </div>
            </form>
            </div>
          )}
          </div>
        )}
      </main>

      {/* Order Details popup Modal */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-roboto">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedOrderForModal(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl bg-white p-8 rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh] mx-4 z-10 text-sm">
            <button
              onClick={() => setSelectedOrderForModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition p-2 cursor-pointer focus:outline-none"
              aria-label="Close details"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">
              Order Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Order ID</p>
                <p className="font-semibold text-gray-800 mt-0.5">#{selectedOrderForModal.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Status</p>
                <span className={`inline-block px-2.5 py-0.5 mt-0.5 rounded text-[10px] font-bold uppercase ${selectedOrderForModal.status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : selectedOrderForModal.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                  {selectedOrderForModal.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Date & Time</p>
                <p className="font-semibold text-gray-800 mt-0.5">
                  {new Date(selectedOrderForModal.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Customer Email</p>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedOrderForModal.customerEmail}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Fulfillment Status</p>
                {selectedOrderForModal.status === 'PAID' ? (
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedOrderForModal.fulfillmentStatus === 'Delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : selectedOrderForModal.fulfillmentStatus === 'Shipped'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {selectedOrderForModal.fulfillmentStatus || 'Unfulfilled'}
                    </span>
                    <select
                      value={selectedOrderForModal.fulfillmentStatus || 'Unfulfilled'}
                      onChange={(e) => updateFulfillmentStatus(selectedOrderForModal.id, e.target.value)}
                      className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-semibold focus:outline-none focus:border-black cursor-pointer"
                    >
                      <option value="Unfulfilled">Unfulfilled</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                ) : (
                  <p className="font-semibold text-gray-400 mt-0.5">N/A (Payment Pending/Failed)</p>
                )}
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Shipping Address</p>
                <p className="font-semibold text-gray-800 mt-0.5 whitespace-pre-line leading-relaxed">
                  {selectedOrderForModal.shippingAddress || 'No shipping address provided.'}
                </p>
              </div>
            </div>

            <h4 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2 mb-3">
              Items Ordered
            </h4>
            <div className="space-y-3">
              {selectedOrderForModal.items?.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl items-center">
                  <div className="h-16 w-12 bg-white rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.product?.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">No Img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{item.product?.name || 'Deleted Product'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      ID: {item.product?.code || 'N/A'} | Color: <span className="font-semibold uppercase">{item.selectedColor}</span> | Size: <span className="font-semibold">{item.selectedSize}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${item.price.toFixed(2)} x {item.quantity}</p>
                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                      Subtotal: ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-150 flex justify-between items-center text-base">
              <span className="font-bold text-gray-800">Total Amount Paid:</span>
              <span className="font-extrabold text-black">${selectedOrderForModal.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Custom SVG Trend Chart Component ---
const SalesTrendChart = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 45;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 100);

  // Calculate coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.value / maxVal) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  // Simple line path
  const linePath = points.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl p-5 w-full shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h5 className="font-bold text-sm text-gray-900">Sales Trend</h5>
          <p className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">Revenue over time</p>
        </div>
        {hoveredIndex !== null && (
          <div className="bg-black text-white px-2.5 py-1 rounded text-[11px] font-bold shadow-sm">
            {points[hoveredIndex].label}: <span className="text-emerald-400">${points[hoveredIndex].value.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="w-full relative overflow-x-auto">
        <svg className="w-full min-w-[500px]" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + ratio * chartHeight;
            const val = maxVal * (1 - ratio);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-400 font-bold"
                  style={{ fontSize: '9px' }}
                >
                  ${Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Simple Black Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#000000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points & Interactive overlays */}
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            const shouldShowLabel = points.length < 10 || i % Math.ceil(points.length / 6) === 0 || i === points.length - 1;

            return (
              <g key={i}>
                {/* Date Axis Labels */}
                {shouldShowLabel && (
                  <text
                    x={p.x}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-gray-400 font-bold"
                    style={{ fontSize: '9px' }}
                  >
                    {p.label}
                  </text>
                )}

                {/* Vertical Guideline on Hover */}
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingTop}
                    x2={p.x}
                    y2={paddingTop + chartHeight}
                    stroke="#000000"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.3"
                  />
                )}

                {/* Dot on Hover */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill="#000000"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                )}

                {/* Invisible hover capture rect slice */}
                <rect
                  x={p.x - chartWidth / (points.length - 1) / 2}
                  y={paddingTop}
                  width={chartWidth / (points.length - 1)}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default AdminUpload;

