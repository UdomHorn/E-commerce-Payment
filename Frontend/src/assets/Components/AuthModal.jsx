import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import logo from '../logo/Devclothes.jpg';

const AuthModal = () => {
  const { authModalOpen, closeAuthModal, login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await register(email, password);
      } else {
        result = await login(email, password);
      }

      if (!result.success) {
        setError(result.error);
      } else {
        // Clear fields on success
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (signUpMode) => {
    setIsSignUp(signUpMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center font-roboto">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl overflow-hidden mx-4"
        >
          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors p-2 cursor-pointer focus:outline-none"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xl" />
          </button>

          {/* Logo Branding */}
          <div className="flex justify-center mb-6">
            <img src={logo} alt="TEN11 Logo" className="w-[100px] object-contain" />
          </div>

          {/* Auth Tabs */}
          <div className="flex border-b border-gray-100 mb-6">
            <button
              onClick={() => handleTabChange(false)}
              className={`flex-1 pb-3 text-sm font-semibold transition-all relative cursor-pointer focus:outline-none ${!isSignUp ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Sign In
              {!isSignUp && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                />
              )}
            </button>
            <button
              onClick={() => handleTabChange(true)}
              className={`flex-1 pb-3 text-sm font-semibold transition-all relative cursor-pointer focus:outline-none ${isSignUp ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Create Account
              {isSignUp && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                />
              )}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-black focus:outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-black focus:outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-black focus:outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-black text-white hover:opacity-90 active:opacity-95 font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-opacity focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-white" />
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer toggle text */}
          <div className="text-center mt-6 text-xs text-gray-500">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange(false)}
                  className="font-bold text-black hover:underline cursor-pointer focus:outline-none"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                New to TEN11?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange(true)}
                  className="font-bold text-black hover:underline cursor-pointer focus:outline-none"
                >
                  Create an account
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
