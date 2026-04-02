import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): string | null => {
    if (!username.trim()) return 'Please enter your email or username.';
    if (!password) return 'Please enter your password.';
    if (password.length < 3) return 'Password must be at least 3 characters.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      // Dummy logic from AuthContext will handle this
      await login(username.trim(), password);
      navigate('/app/dashboard', { replace: true });
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col">
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 lg:px-8 py-5"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={18} />
          Back to home
        </Link>
      </motion.div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-gray-100"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-sm mb-4">
              T
            </div>
            <h1 className="text-2xl font-extrabold text-text tracking-tight">Welcome back</h1>
            <p className="text-sm text-text-muted mt-1">Sign in to your TeachMate account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-500 text-xs font-bold">!</span>
              </div>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username / Email Field */}
            <div className="mb-4">
              <label htmlFor="login-username" className="block text-sm font-semibold text-text mb-2">
                Email or Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                placeholder="Enter your email or username"
                autoComplete="username"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label htmlFor="login-password" className="block text-sm font-semibold text-text mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm pr-12"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                />
                <span className="text-sm text-text-muted group-hover:text-text transition-colors">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-base rounded-2xl
                         transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Bottom Divider */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-text-muted">
              Need an account?{' '}
              <span className="font-medium text-primary">
                Contact your administrator
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
