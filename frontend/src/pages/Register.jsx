import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bug, ArrowRight, Loader2, Shield } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '', role: 'Tester' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirm) {
        return setError("Passwords do not match");
    }

    setIsSubmitting(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to register account');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
            <Bug className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create an account</h2>
        </div>

        <div className="bg-surface border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorMessage message={error} />
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="name">Full Name</label>
              <input 
                id="name" 
                type="text" 
                required 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white"
                value={formData.name} onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="email">Email Address</label>
              <input 
                id="email" 
                type="email" 
                required 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white"
                value={formData.email} onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="password">Password</label>
                  <input 
                    id="password" type="password" required 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white"
                    value={formData.password} onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="confirm">Confirm</label>
                  <input 
                    id="confirm" type="password" required 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white"
                    value={formData.confirm} onChange={handleChange}
                  />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.role === 'Tester' ? 'border-primary bg-primary/10' : 'border-slate-700 bg-slate-900/50'}`}>
                    <input type="radio" name="role" id="role" value="Tester" checked={formData.role === 'Tester'} onChange={handleChange} className="hidden" />
                    <span className={`text-sm font-medium ${formData.role === 'Tester' ? 'text-primary' : 'text-slate-400'}`}>Tester</span>
                </label>
                <label className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.role === 'Developer' ? 'border-primary bg-primary/10' : 'border-slate-700 bg-slate-900/50'}`}>
                    <input type="radio" name="role" id="role" value="Developer" checked={formData.role === 'Developer'} onChange={handleChange} className="hidden" />
                    <span className={`text-sm font-medium ${formData.role === 'Developer' ? 'text-primary' : 'text-slate-400'}`}>Developer</span>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-blue-600 text-white font-medium rounded-xl py-3 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Sign up <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account? <Link to="/login" className="text-primary hover:text-blue-400 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
