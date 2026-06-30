import Home from './Pages/Home'
import Nav from './Pages/Nav'
import Women from './Pages/Women'
import Men from './Pages/Men'
import Footer from './Pages/Footer'
import AdminUpload from './Pages/AdminUpload'
import ProductDetail from './Pages/ProductDetail'
import Checkout from '././Pages/Checkout'
import Favorites from './Pages/Favorites'
import MyOrders from './Pages/MyOrders'
import Collections from './Pages/Collections'
import { Routes, Route } from 'react-router-dom'
import AuthModal from './assets/Components/AuthModal'
import ScrollToTop from './assets/Components/ScrollToTop'

function App() {
  return (
    <div className=''>
      <ScrollToTop />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/upload" element={<AdminUpload />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/Women" element={<Women />} />
        <Route path="/Men" element={<Men />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/collections" element={<Collections />} />
      </Routes>
      <Footer />
      <AuthModal />
    </div>
  )
}

export default App
