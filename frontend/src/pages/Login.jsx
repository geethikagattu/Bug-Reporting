import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bug, GitMerge, ArrowRight, Loader2 } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check URL params for GitHub Auth Error
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'github_auth_failed') {
      setError('GitHub authentication failed.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await login(email, password);
      // Wait for AuthContext routing guard to pick up the user, or strictly push
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to login');
      setIsSubmitting(false);
    }
  };

  const handleGithubLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/github`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
            <Bug className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
          <p className="text-slate-400 mt-2">Sign in to your BugFlow AI account</p>
        </div>

        <div className="bg-surface border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <button 
            onClick={handleGithubLogin}
            className="w-full bg-[#24292e] hover:bg-[#2f363d] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-3 font-medium transition-colors mb-6"
          >
            <GitMerge className="w-5 h-5" />
            Continue with GitHub
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm font-medium leading-6">
              <span className="bg-surface px-6 text-slate-500">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <ErrorMessage message={error} />
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="email">Email Address</label>
              <input 
                id="email" 
                type="email" 
                required 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="password">Password</label>
              <input 
                id="password" 
                type="password" 
                required 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-blue-600 text-white font-medium rounded-xl py-3 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          Don't have an account? <Link to="/register" className="text-primary hover:text-blue-400 font-medium transition-colors">Sign up now</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
