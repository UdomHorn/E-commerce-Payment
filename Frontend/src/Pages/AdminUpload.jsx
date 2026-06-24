import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_BASE from '../config';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';

const AdminUpload = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'products', 'banners', or 'categories'
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // --- Dashboard States ---
  const [dashboardStats, setDashboardStats] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);

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


  // --- Banner Form States ---
  const [bannerForm, setBannerForm] = useState({
    title: '',
    linkUrl: '',
    order: '0',
  });
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [dbBanners, setDbBanners] = useState([]);

  // --- Category Collection Banners States ---
  const [dbCategoryBanners, setDbCategoryBanners] = useState([]);
  const [uploadingCategory, setUploadingCategory] = useState(null);
  const [pendingFiles, setPendingFiles] = useState({ Women: null, Men: null });
  const [pendingPreviews, setPendingPreviews] = useState({ Women: null, Men: null });


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
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!statsRes.ok) throw new Error('Failed to load dashboard metrics.');
      const statsData = await statsRes.json();
      setDashboardStats(statsData);

      // Fetch orders
      const ordersRes = await fetch(`${API_BASE}/api/payment/orders`, {
        headers: { Authorization: `Bearer ${token}` }
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
    } else if (activeTab === 'banners') {
      fetchDbBanners();
    } else if (activeTab === 'categories') {
      fetchDbCategoryBanners();
    }
  }, [activeTab, token]);

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

    try {
      const url = editingProduct 
        ? `${API_BASE}/api/products/${editingProduct.id}` 
        : `${API_BASE}/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
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
        headers: {
          Authorization: `Bearer ${token}`
        }
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


  // --- Banner Handlers ---
  const handleBannerChange = (e) => {
    const { name, value } = e.target;
    setBannerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBannerImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImage(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (!bannerImage) {
      setMessage({ type: 'error', text: 'Please select a banner image.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('title', bannerForm.title);
    formData.append('linkUrl', bannerForm.linkUrl);
    formData.append('order', bannerForm.order);
    formData.append('image', bannerImage);

    try {
      const response = await fetch(`${API_BASE}/api/banners`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload banner.');
      }

      setMessage({ type: 'success', text: 'Banner created successfully!' });

      // Reset
      setBannerForm({ title: '', linkUrl: '', order: '0' });
      setBannerImage(null);
      setBannerPreview('');
      fetchDbBanners(); // Reload list
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e, category) => {
    const file = e.target.files[0];
    if (file) {
      setPendingFiles((prev) => ({ ...prev, [category]: file }));
      setPendingPreviews((prev) => ({ ...prev, [category]: URL.createObjectURL(file) }));
    }
  };

  const cancelPending = (category) => {
    setPendingFiles((prev) => ({ ...prev, [category]: null }));
    setPendingPreviews((prev) => ({ ...prev, [category]: null }));
  };

  const saveCategoryBanner = async (category) => {
    const file = pendingFiles[category];
    if (!file) return;

    setUploadingCategory(category);
    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('category', category);
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/api/banners/categories`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to update ${category} banner.`);
      }

      setMessage({ 
        type: 'success', 
        text: `Successfully updated ${category} Collection banner image!` 
      });

      cancelPending(category);
      fetchDbCategoryBanners(); // Refresh listings
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
      setUploadingCategory(null);
    }
  };

  const deleteCategoryBanner = async (category) => {
    if (!window.confirm(`Are you sure you want to restore the default local image for ${category} Collection?`)) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE}/api/banners/categories/${category}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully reverted ${category} Collection to default image.` });
        fetchDbCategoryBanners(); // Reload list
      } else {
        const result = await response.json();
        throw new Error(result.error || `Failed to reset ${category} banner.`);
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || `Failed to reset ${category} banner.` });
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
    <div className="min-h-screen pt-24 pb-16 bg-white text-black font-roboto">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 pb-4 overflow-x-auto">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`text-lg font-bold pb-2 border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleTabChange('products')}
            className={`text-lg font-bold pb-2 border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            Manage Products
          </button>
          <button
            onClick={() => handleTabChange('banners')}
            className={`text-lg font-bold pb-2 border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'banners'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            Slideshow Banners
          </button>
          <button
            onClick={() => handleTabChange('categories')}
            className={`text-lg font-bold pb-2 border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            Collection Banners
          </button>
        </div>
 
        {/* Form Container */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          {message.text && (
            <div
              className={`p-4 mb-6 rounded-lg text-sm font-semibold transition-all duration-300 ${
                message.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* TAB 0: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 font-roboto">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900">
                  Dashboard Overview
                </h3>
                <button
                  onClick={fetchDashboardData}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 hover:border-black rounded-lg text-xs font-bold transition cursor-pointer focus:outline-none"
                >
                  ↻ Refresh Data
                </button>
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
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg">
                  {dashboardError}
                </div>
              ) : (
                <>
                  {/* Metrics Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        ${dashboardStats?.metrics?.totalRevenue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Orders Count</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {dashboardStats?.metrics?.totalOrders || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Paid Orders</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">
                        {dashboardStats?.metrics?.paidCount || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-105 p-5 rounded-xl">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Orders</p>
                      <p className="text-2xl font-bold text-amber-700 mt-1">
                        {dashboardStats?.metrics?.pendingCount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Orders Table */}
                    <div className="lg:col-span-2 space-y-4">
                      <h4 className="font-bold text-lg text-gray-900">Recent Orders</h4>
                      {ordersList.length === 0 ? (
                        <p className="text-gray-400 text-sm italic">No orders found.</p>
                      ) : (
                        <div className="overflow-x-auto border border-gray-100 rounded-xl">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                              <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                              {ordersList.slice(0, 10).map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/50">
                                  <td className="p-4 truncate max-w-[140px]" title={order.customerEmail}>
                                    {order.customerEmail}
                                  </td>
                                  <td className="p-4 font-bold text-black">
                                    ${order.totalAmount.toFixed(2)}
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      order.status === 'PAID'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : order.status === 'PENDING'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                      {order.status}
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

                    {/* Stock Warnings */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-900">Low Stock Warnings</h4>
                      {dashboardStats?.lowStockProducts?.length === 0 ? (
                        <p className="text-emerald-600 text-sm font-semibold">✓ All product inventory is healthy.</p>
                      ) : (
                        <div className="space-y-3">
                          {dashboardStats?.lowStockProducts?.map((p) => (
                            <div key={p.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-gray-900 truncate" title={p.name}>
                                  {p.name}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">SKU: {p.code}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                p.totalStock === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : p.totalStock <= 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-200 text-gray-800'
                              }`}>
                                {p.totalStock} left
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
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
                          placeholder="Search products by name or SKU/code..."
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
                            <th className="p-4">SKU / Code</th>
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
                                <span className={`px-2 py-0.5 rounded ${
                                  prod.category === 'Women' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Product SKU/Code (Unique)</label>
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
                      className={`flex-1 py-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg transition active:scale-[0.99] transition-transform shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
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
 
          {/* TAB 2: BANNER MANAGEMENT */}
          {activeTab === 'banners' && (
            <div className="space-y-12">
              {/* Form to Upload Banner */}
              <form onSubmit={handleBannerSubmit} className="space-y-6">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">
                  Upload New Banner Image
                </h3>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Title (Optional)</label>
                    <input
                      type="text"
                      name="title"
                      value={bannerForm.title}
                      onChange={handleBannerChange}
                      placeholder="e.g. Grand Prix Launch"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Slideshow Order (Sorting Number)</label>
                    <input
                      type="number"
                      name="order"
                      value={bannerForm.order}
                      onChange={handleBannerChange}
                      placeholder="e.g. 0, 1, 2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition text-sm"
                    />
                  </div>
                </div>
 
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Link Path/URL (Optional)</label>
                  <input
                    type="text"
                    name="linkUrl"
                    value={bannerForm.linkUrl}
                    onChange={handleBannerChange}
                    placeholder="e.g. /Women or /product/22225011172"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition text-sm"
                  />
                </div>
 
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Image</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 hover:border-black rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100/50 transition-all duration-300">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <p className="mb-1 text-sm text-gray-600"><span className="font-semibold">Select Banner Image File</span></p>
                        <p className="text-xs text-gray-400">Wide landscape aspect ratio (PNG, JPG, JPEG, WEBP)</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleBannerImage} className="hidden" />
                    </label>
                  </div>
 
                  {bannerPreview && (
                    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2">
                      <img src={bannerPreview} alt="banner-preview" className="w-full max-h-48 object-cover rounded-md" />
                    </div>
                  )}
                </div>
 
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg transition active:scale-[0.99] transition-transform shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Uploading banner to Cloudinary...' : 'Upload Banner'}
                  </button>
                </div>
              </form>
 
              {/* List of Current Banners */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Active Banners</h3>
                
                {dbBanners.length === 0 ? (
                  <p className="text-gray-400 italic">No dynamic banners in the database. Using local defaults on home page.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dbBanners.map((banner) => (
                      <div key={banner.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
                        <div className="aspect-[21/9] bg-black">
                          <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 space-y-2 flex-grow flex flex-col justify-between bg-white text-black">
                          <div>
                            <p className="font-bold text-lg text-gray-900">{banner.title || 'Untitled Banner'}</p>
                            <p className="text-sm text-gray-500">Order: {banner.order} | Link: {banner.linkUrl || 'None'}</p>
                          </div>
                          <button
                            onClick={() => deleteBanner(banner.id)}
                            className="w-full mt-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition cursor-pointer"
                          >
                            Delete Banner
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORY COLLECTION BANNERS */}
          {activeTab === 'categories' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Manage Homepage Category Banners</h3>
                <p className="text-sm text-gray-500">
                  Click directly on either card below to select a local image file and replace the collection banner.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Women Collection Card */}
                <div className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col justify-between hover:border-black transition-colors duration-300">
                  <label className="cursor-pointer block relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'Women')}
                      className="hidden"
                      disabled={loading}
                    />
                    <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center overflow-hidden relative">
                      {pendingPreviews.Women ? (
                        <img 
                          src={pendingPreviews.Women} 
                          alt="Women Collection Pending Banner" 
                          className="w-full h-full object-cover border-2 border-dashed border-black"
                        />
                      ) : dbCategoryBanners.find(b => b.category === 'Women') ? (
                        <img 
                          src={dbCategoryBanners.find(b => b.category === 'Women').imageUrl} 
                          alt="Women Collection Custom Banner" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6 text-gray-400">
                          <span className="block text-4xl mb-2">📷</span>
                          <span className="text-sm font-semibold">Using Default Image</span>
                          <span className="block text-xs mt-1">(Home Page Fallback: 8J6A0448.jpg)</span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white">
                        <span className="text-3xl mb-2">📸</span>
                        <span className="text-sm font-semibold">
                          {pendingPreviews.Women ? 'Click to Change Image' : 'Click to Replace Image'}
                        </span>
                      </div>

                      {/* Loading Overlay */}
                      {uploadingCategory === 'Women' && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center text-black z-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-2 animate-bounce"></div>
                          <span className="text-xs font-bold uppercase tracking-wider">Uploading...</span>
                        </div>
                      )}
                    </div>
                  </label>
                  
                  <div className="p-4 bg-white border-t border-gray-100">
                    <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold rounded-full mb-1">
                      Women Collection
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {pendingPreviews.Women ? (
                        <span className="text-amber-600 font-semibold">⚠️ Pending Replacement</span>
                      ) : dbCategoryBanners.find(b => b.category === 'Women') ? (
                        'Custom banner active in database'
                      ) : (
                        'Currently using storefront asset placeholder'
                      )}
                    </p>

                    {/* Action Buttons for Pending State */}
                    {pendingFiles.Women && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => saveCategoryBanner('Women')}
                          disabled={loading}
                          className="flex-1 py-2 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer"
                        >
                          Confirm Save
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelPending('Women')}
                          disabled={loading}
                          className="px-3 py-2 border border-gray-200 hover:border-black text-black font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Restore to Default Button */}
                    {!pendingFiles.Women && dbCategoryBanners.find(b => b.category === 'Women') && (
                      <button
                        type="button"
                        onClick={() => deleteCategoryBanner('Women')}
                        disabled={loading}
                        className="w-full mt-4 py-2 border border-red-200 hover:border-red-600 text-red-600 hover:text-red-700 font-semibold text-xs rounded transition uppercase tracking-wider cursor-pointer"
                      >
                        Restore Default Image
                      </button>
                    )}
                  </div>
                </div>

                {/* Men Collection Card */}
                <div className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col justify-between hover:border-black transition-colors duration-300">
                  <label className="cursor-pointer block relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'Men')}
                      className="hidden"
                      disabled={loading}
                    />
                    <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center overflow-hidden relative">
                      {pendingPreviews.Men ? (
                        <img 
                          src={pendingPreviews.Men} 
                          alt="Men Collection Pending Banner" 
                          className="w-full h-full object-cover border-2 border-dashed border-black"
                        />
                      ) : dbCategoryBanners.find(b => b.category === 'Men') ? (
                        <img 
                          src={dbCategoryBanners.find(b => b.category === 'Men').imageUrl} 
                          alt="Men Collection Custom Banner" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6 text-gray-400">
                          <span className="block text-4xl mb-2">📷</span>
                          <span className="text-sm font-semibold">Using Default Image</span>
                          <span className="block text-xs mt-1">(Home Page Fallback: 8J6A0460.jpg)</span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white">
                        <span className="text-3xl mb-2">📸</span>
                        <span className="text-sm font-semibold">
                          {pendingPreviews.Men ? 'Click to Change Image' : 'Click to Replace Image'}
                        </span>
                      </div>

                      {/* Loading Overlay */}
                      {uploadingCategory === 'Men' && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center text-black z-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-2 animate-bounce"></div>
                          <span className="text-xs font-bold uppercase tracking-wider">Uploading...</span>
                        </div>
                      )}
                    </div>
                  </label>
                  
                  <div className="p-4 bg-white border-t border-gray-100">
                    <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold rounded-full mb-1">
                      Men Collection
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {pendingPreviews.Men ? (
                        <span className="text-amber-600 font-semibold">⚠️ Pending Replacement</span>
                      ) : dbCategoryBanners.find(b => b.category === 'Men') ? (
                        'Custom banner active in database'
                      ) : (
                        'Currently using storefront asset placeholder'
                      )}
                    </p>

                    {/* Action Buttons for Pending State */}
                    {pendingFiles.Men && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => saveCategoryBanner('Men')}
                          disabled={loading}
                          className="flex-1 py-2 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer"
                        >
                          Confirm Save
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelPending('Men')}
                          disabled={loading}
                          className="px-3 py-2 border border-gray-200 hover:border-black text-black font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Restore to Default Button */}
                    {!pendingFiles.Men && dbCategoryBanners.find(b => b.category === 'Men') && (
                      <button
                        type="button"
                        onClick={() => deleteCategoryBanner('Men')}
                        disabled={loading}
                        className="w-full mt-4 py-2 border border-red-200 hover:border-red-600 text-red-600 hover:text-red-700 font-semibold text-xs rounded transition uppercase tracking-wider cursor-pointer"
                      >
                        Restore Default Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                <span className={`inline-block px-2.5 py-0.5 mt-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedOrderForModal.status === 'PAID'
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
                      SKU: {item.product?.code || 'N/A'} | Color: <span className="font-semibold uppercase">{item.selectedColor}</span> | Size: <span className="font-semibold">{item.selectedSize}</span>
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

export default AdminUpload;

