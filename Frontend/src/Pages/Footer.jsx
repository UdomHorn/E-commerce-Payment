import React from 'react';
import img12 from '../assets/Images/We-accept-payments.png';
import logo from '../assets/logo/Devclothes.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faTiktok, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const { user } = useAuth();
  return (
    <div className='w-full bg-white text-black font-roboto pt-12 pb-8 border-t border-gray-200 print:hidden'>
      <div className='w-[80%] max-md:w-[94%] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-8'>
        {/* Column 1: Logo & Social Icons */}
        <div className='space-y-4'>
          <div className='w-[130px]'>
            <Link to="/">
              <img src={logo} alt="Devclothes Logo" className="w-full object-contain" />
            </Link>
          </div>
          {/* Social media icons row */}
          <div className="flex gap-4 items-center pt-1">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-black hover:opacity-75 transition-opacity" aria-label="Facebook">
              <FontAwesomeIcon icon={faFacebook} className="text-lg" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-black hover:opacity-75 transition-opacity" aria-label="Instagram">
              <FontAwesomeIcon icon={faInstagram} className="text-lg" />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-black hover:opacity-75 transition-opacity" aria-label="TikTok">
              <FontAwesomeIcon icon={faTiktok} className="text-lg" />
            </a>
            <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="text-black hover:opacity-75 transition-opacity" aria-label="Telegram">
              <FontAwesomeIcon icon={faTelegram} className="text-lg" />
            </a>
          </div>
        </div>

        {/* Column 2: Collections */}
        <div>
          <h4 className='text-xs font-bold uppercase tracking-wider text-black pb-4'>Collections</h4>
          <ul className='space-y-2 text-xs text-gray-600 font-medium'>
            <li>
              <Link to="/Men" className="hover:text-black transition-colors">Shop Men</Link>
            </li>
            <li>
              <Link to="/Women" className="hover:text-black transition-colors">Shop Women</Link>
            </li>
            <li>
              <Link to="/" className="hover:text-black transition-colors">New Arrivals</Link>
            </li>
            <li>
              <Link to="/" className="hover:text-black transition-colors">Best Sellers</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Customer Care */}
        <div>
          <h4 className='text-xs font-bold uppercase tracking-wider text-black pb-4'>Customer Care</h4>
          <ul className='space-y-2 text-xs text-gray-600'>
            <li>
              <a href="#" className="hover:text-black transition-colors">Track Order</a>
            </li>
            <li>
              <a href="#" className="hover:text-black transition-colors">Shipping & Delivery</a>
            </li>
            <li>
              <a href="#" className="hover:text-black transition-colors">Returns & Exchanges</a>
            </li>
            <li>
              <a href="#" className="hover:text-black transition-colors">Size Guide</a>
            </li>
          </ul>
        </div>

        {/* Column 4: Company Info */}
        <div>
          <h4 className='text-xs font-bold uppercase tracking-wider text-black pb-4'>Company Info</h4>
          <ul className='space-y-2 text-xs text-gray-600'>
            <li>
              <a href="#" className="hover:text-black transition-colors">Our Story</a>
            </li>
            <li>
              <a href="#" className="hover:text-black transition-colors">Careers</a>
            </li>
            <li>
              <a href="#" className="hover:text-black transition-colors">Terms & Conditions</a>
            </li>
            <li>
              <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
            </li>
            {user?.role === 'admin' && (
              <li className='border-t border-gray-100 pt-2 mt-2'>
                <Link to="/admin/upload" className="hover:text-black font-semibold text-teal-600 transition-colors">
                  Admin Panel (Upload)
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer Bottom copyright with Payment Logos */}
      <div className='w-[80%] max-md:w-[94%] mx-auto pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 gap-4'>
        <p>&copy; {new Date().getFullYear()} Devclothes. All rights reserved.</p>
        <div className='flex flex-col sm:flex-row items-center gap-6 sm:gap-12'>
          <div className='flex items-center gap-6 opacity-95'>
            {/* Top row of payment image (Cards: ABA PAY, VISA, Mastercard) */}
            <div className="w-[98px] h-[28px] overflow-hidden relative">
              <img 
                src={img12} 
                alt="Cards" 
                className="absolute top-0 left-0 w-[160px] h-[58px] max-w-none" 
              />
            </div>
            {/* Bottom row of payment image (Bank & Cash) */}
            <div className="w-[160px] h-[28px] overflow-hidden relative">
              <img 
                src={img12} 
                alt="Bank Transfer & Cash on Delivery" 
                className="absolute bottom-0 left-0 w-[160px] h-[58px] max-w-none" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;