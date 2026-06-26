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
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

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
    setIsGoogleAccount(false);
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
        // Detect Google-only account block and show special UI
        if (data.error && data.error.includes('Google Sign-In')) {
          setIsGoogleAccount(true);
        } else {
          setError(data.error || 'Failed to send OTP code.');
        }
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
      <div className="fixed inset-0 z-50 flex justify-end font-roboto">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={closeAuthModal}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer Content */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="relative w-full max-w-md bg-white p-8 shadow-2xl z-10 h-full overflow-y-auto rounded-none flex flex-col"
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
            <div className="space-y-6">
              {forgotPasswordStep === 1 && (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-6">
                  <div className="relative">
                    <input
                      type="email"
                      id="forgot-email"
                      required
                      placeholder=" "
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="peer block w-full px-4 pt-6 pb-2 text-gray-900 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-0 focus:border-black transition"
                    />
                    <label
                      htmlFor="forgot-email"
                      className="absolute text-sm text-gray-500 duration-150 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 pointer-events-none"
                    >
                      Email Address
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black text-white hover:opacity-90 active:opacity-95 font-bold text-sm tracking-wide rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-opacity focus:outline-none disabled:opacity-50"
                  >
                    {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-white" /> : 'Request Verification Code'}
                  </button>
                </form>
              )}

              {forgotPasswordStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      id="forgot-otp"
                      required
                      maxLength="6"
                      placeholder=" "
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="peer block w-full px-4 pt-6 pb-2 text-center tracking-widest text-lg font-bold text-gray-900 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-0 focus:border-black transition"
                    />
                    <label
                      htmlFor="forgot-otp"
                      className="absolute text-sm text-gray-500 duration-150 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 pointer-events-none"
                    >
                      Enter 6-Digit OTP Code
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black text-white hover:opacity-90 active:opacity-95 font-bold text-sm tracking-wide rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-opacity focus:outline-none disabled:opacity-50"
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
                <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
                  <div className="relative">
                    <input
                      type="password"
                      id="reset-new-password"
                      required
                      placeholder=" "
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="peer block w-full px-4 pt-6 pb-2 text-gray-900 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-0 focus:border-black transition"
                    />
                    <label
                      htmlFor="reset-new-password"
                      className="absolute text-sm text-gray-500 duration-150 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 pointer-events-none"
                    >
                      New Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      id="reset-confirm-new-password"
                      required
                      placeholder=" "
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="peer block w-full px-4 pt-6 pb-2 text-gray-900 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-0 focus:border-black transition"
                    />
                    <label
                      htmlFor="reset-confirm-new-password"
                      className="absolute text-sm text-gray-500 duration-150 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 pointer-events-none"
                    >
                      Confirm New Password
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black text-white hover:opacity-90 active:opacity-95 font-bold text-sm tracking-wide rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-opacity focus:outline-none disabled:opacity-50"
                  >
                    {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-white" /> : 'Reset Password'}
                  </button>
                </form>
              )}

              {/* Google Account Notice Card */}
              {isGoogleAccount && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center gap-3 text-center">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <p className="text-sm font-bold text-gray-800">Google Account Detected</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This account uses <strong>Google Sign-In</strong>.<br/>
                    No password is needed — just sign in with Google.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setForgotPasswordStep(1);
                      setIsGoogleAccount(false);
                      setError('');
                      setSuccessMessage('');
                      setResendCountdown(0);
                    }}
                    className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer focus:outline-none"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotPasswordStep(1);
                  setIsGoogleAccount(false);
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type="email"
                    id="auth-email"
                    required
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="peer block w-full px-4 pt-6 pb-2 text-gray-900 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-0 focus:border-black transition"
                  />
                  <label
                    htmlFor="auth-email"
                    className="absolute text-sm text-gray-500 duration-150 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 pointer-events-none"
                  >
                    Email Address
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="password"
                    id="auth-password"
                    required
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer block w-full px-4 pt-6 pb-2 text-gray-900 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-0 focus:border-black transition"
                  />
                  <label
                    htmlFor="auth-password"
                    className="absolute text-sm text-gray-500 duration-150 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 pointer-events-none"
                  >
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
                      className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-black transition-colors focus:outline-none cursor-pointer z-20"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {isSignUp && (
                  <div className="relative">
                    <input
                      type="password"
                      id="auth-confirm-password"
                      required
                      placeholder=" "
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="peer block w-full px-4 pt-6 pb-2 text-gray-900 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-0 focus:border-black transition"
                    />
                    <label
                      htmlFor="auth-confirm-password"
                      className="absolute text-sm text-gray-500 duration-150 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 pointer-events-none"
                    >
                      Confirm Password
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-4 bg-black text-white hover:opacity-90 active:opacity-95 font-bold text-sm tracking-wide rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-opacity focus:outline-none disabled:opacity-50"
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
