import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import logo from '../logo/Devclothes.jpg';
import API_BASE from '../../config';
import { GoogleLogin } from '@react-oauth/google';

const AuthModal = () => {
  const { authModalOpen, closeAuthModal, login, register, googleLogin } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Reset states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1 = request otp, 2 = verify otp, 3 = reset password
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

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
    setIsForgotPassword(false);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleForgotPasswordRequest = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP code.');
      } else {
        setForgotPasswordStep(2);
        setSuccessMessage(forgotPasswordStep === 2 ? 'A new verification code has been sent to your email.' : 'A 6-digit verification code has been sent to your email.');
        setResendCountdown(60); // Start 60-second countdown cooldown
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!otpCode) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid or expired verification code.');
      } else {
        setForgotPasswordStep(3);
        setSuccessMessage('Verification code verified successfully! Set your new password.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!newPassword || !confirmNewPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
      } else {
        setSuccessMessage('Password reset successfully! Redirecting...');
        setTimeout(() => {
          setIsForgotPassword(false);
          setForgotPasswordStep(1);
          setSuccessMessage('');
          setError('');
          setPassword('');
          setOtpCode('');
          setNewPassword('');
          setConfirmNewPassword('');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
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
          {!isForgotPassword && (
            <div className="flex border-b border-gray-100 mb-6">
              <button
                onClick={() => handleTabChange(false)}
                className={`flex-1 pb-3 text-sm font-semibold transition-all relative cursor-pointer focus:outline-none ${!isSignUp ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
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
                className={`flex-1 pb-3 text-sm font-semibold transition-all relative cursor-pointer focus:outline-none ${isSignUp ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
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
          )}

          {isForgotPassword && (
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
              <p className="text-xs text-gray-400 mt-1">Follow the instructions to verify your account</p>
            </div>
          )}

          {/* Notification Alert Messages */}
          {(error || successMessage) && (
            <div className={`p-3.5 mb-4 text-xs font-semibold rounded-xl border flex items-center justify-between transition-all ${
              error 
                ? 'text-red-600 bg-red-50 border-red-100' 
                : 'text-emerald-700 bg-emerald-50 border-emerald-100'
            }`}>
              <span>{error || successMessage}</span>
            </div>
          )}

          {/* --- VIEW: Forgot Password Flow --- */}
          {isForgotPassword ? (
            <div className="space-y-4">
              {forgotPasswordStep === 1 && (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
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
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-black text-white hover:opacity-90 active:opacity-95 font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-opacity focus:outline-none disabled:opacity-50"
                  >
                    {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-white" /> : 'Request Verification Code'}
                  </button>
                </form>
              )}

              {forgotPasswordStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-gray-50 text-center tracking-widest text-lg font-bold text-gray-900 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:border-black focus:outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-black text-white hover:opacity-90 active:opacity-95 font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-opacity focus:outline-none disabled:opacity-50"
                  >
                    {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-white" /> : 'Verify Code'}
                  </button>
                  <div className="text-center mt-3">
                    {resendCountdown > 0 ? (
                      <span className="text-xs text-gray-400 font-medium">
                        Didn't receive the code? Resend in <span className="font-bold text-gray-600">{resendCountdown}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleForgotPasswordRequest()}
                        disabled={loading}
                        className="text-xs font-bold text-black hover:underline focus:outline-none cursor-pointer transition-all disabled:opacity-50"
                      >
                        Didn't receive the code? Resend Code
                      </button>
                    )}
                  </div>
                </form>
              )}

              {forgotPasswordStep === 3 && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-black focus:outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-black focus:outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-black text-white hover:opacity-90 active:opacity-95 font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-opacity focus:outline-none disabled:opacity-50"
                  >
                    {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-white" /> : 'Reset Password'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotPasswordStep(1);
                  setError('');
                  setSuccessMessage('');
                  setResendCountdown(0);
                }}
                className="w-full text-center text-xs font-bold text-black hover:underline focus:outline-none cursor-pointer mt-2"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            /* --- VIEW: Standard login/signup form --- */
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setForgotPasswordStep(1);
                          setError('');
                          setSuccessMessage('');
                        }}
                        className="text-xs text-gray-400 hover:text-black transition-colors focus:outline-none cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
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

              {/* Divider separator */}
              <div className="flex items-center my-5">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="mx-4 text-xs text-gray-400 font-semibold uppercase tracking-wider">or</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Google login component integration */}
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    setLoading(true);
                    setError('');
                    try {
                      const res = await googleLogin(credentialResponse.credential);
                      if (!res.success) {
                        setError(res.error);
                      } else {
                        // Clear fields on success
                        setEmail('');
                        setPassword('');
                        setConfirmPassword('');
                      }
                    } catch {
                      setError('Google authentication failed. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => {
                    setError('Google Sign-In failed. Please try again.');
                  }}
                  theme="outline"
                  size="large"
                  width="100%"
                  shape="circle"
                />
              </div>

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
                    New to Devclothes?{' '}
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
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
