import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

// Map Firebase error codes to user-friendly messages
const getErrorMessage = (errorCode: string): string => {
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/user-not-found': 'No account exists with this email. Check the email address or create an account first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check both and try again.',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    'auth/operation-not-allowed': 'Login is currently unavailable. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/internal-error': 'An error occurred. Please try again later.',
  };
  return errorMap[errorCode] || 'Login failed. Please check your email and password.';
};

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  
  // Destructured login and auth states
  const { login, isLoading: authLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard when user logs in
  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      navigate(`/dashboard/${user.role}`, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // Email validation logic
  const validateEmail = (value: string): string => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  // Password validation logic
  const validatePassword = (value: string): string => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setGeneralError(''); 
    setEmailError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setGeneralError('');
    setPasswordError('');
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setEmailError(emailErr);
      setPasswordError(passwordErr);
      return;
    }

    try {
      console.log('[LOGIN] Submitting login form for:', email);
      await login(email.trim(), password);
    } catch (err: any) {
      const errorCode = err?.code || '';
      const errorMsg = err?.message || 'Login failed. Please check your email and password.';
      const resolvedMessage = errorCode ? getErrorMessage(errorCode) : errorMsg;
      
      console.error('[LOGIN] Form login error:', { code: errorCode, message: errorMsg });
      setGeneralError(resolvedMessage);
    }
  };

  // FIXED: Removed duplicate try/catch and added missing closing braces
  const quickLogin = async (credentials: { email: string; password: string }) => {
    setGeneralError('');
    setEmailError('');
    setPasswordError('');
    try {
      console.log('[LOGIN] Quick login attempt for:', credentials.email);
      // Note: We use authLoading from the context instead of a local setIsLoading
      await login(credentials.email.trim(), credentials.password);
    } catch (err: any) {
      const errorCode = err?.code || '';
      const errorMsg = err?.message || 'Login failed. Please check your email and password.';
      const resolvedMessage = errorCode ? getErrorMessage(errorCode) : errorMsg;
      
      console.error('[LOGIN] Quick login error:', { code: errorCode, message: errorMsg, email: credentials.email });
      setGeneralError(resolvedMessage);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-orange-700 font-medium">Signing in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 text-orange-800">
          <div className="flex justify-center gap-4 mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rglFWmLitQbBPWPvlaUmQHDHI2YiM8.png"
              alt="University of Cabuyao"
              className="h-16 w-16 rounded-full shadow-lg border border-orange-200"
            />
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JiGNt42HwaPEYoifHlLe8u2pfYzP0m.png"
              alt="College of Computing Studies"
              className="h-16 w-16 rounded-full shadow-lg border border-orange-200"
            />
          </div>
          <h1 className="text-3xl font-bold text-orange-900 mb-2">Education Management System</h1>
          <p className="text-orange-700">Pamantasan ng Cabuyao</p>
        </div>

        <div className="bg-white/95 rounded-xl shadow-2xl p-8 mb-6 backdrop-blur">
          <h2 className="text-2xl font-bold text-orange-700 mb-6">Sign In</h2>

          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-red-700 text-sm font-medium">Unable to sign in</p>
                <p className="text-red-600 text-sm mt-1">{generalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                  emailError ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="student@example.com"
              />
              {emailError && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {emailError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                  passwordError ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="••••••••"
              />
              {passwordError && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-2.5 rounded-lg transition-colors mt-4 disabled:opacity-50"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Demo Accounts Section */}
        <div className="bg-white/90 rounded-xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center uppercase tracking-wider">Demo Accounts</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => quickLogin({ email: 'admin@example.com', password: 'admin123' })}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-300 text-white py-2 rounded-lg text-sm font-medium transition"
            >
               Admin Login
            </button>
            <button
              onClick={() => quickLogin({ email: 'student@example.com', password: 'student123' })}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-300 text-white py-2 rounded-lg text-sm font-medium transition"
            >
               Student Login
            </button>
            <button
              onClick={() => quickLogin({ email: 'faculty@example.com', password: 'faculty123' })}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-300 text-white py-2 rounded-lg text-sm font-medium transition"
            >
               Faculty Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};