import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Bug, ShieldCheck, Zap, Layers, GitMerge } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user, loading } = useAuth();
  
  if (!loading && user) {
    if (user.role === 'Admin') return <Navigate to="/admin/dashboard" />;
    if (user.role === 'Developer') return <Navigate to="/developer/dashboard" />;
    return <Navigate to="/tester/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-primary/30">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-surface/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 w-max">
            <Bug className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">BugFlow AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
            <Link to="/register" className="px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-primary/20 transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen opacity-50 animate-pulse" />
        
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 py-20 relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Automate Bug Triage with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Intelligence</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            BugFlow AI uses SVM and NLP to instantly classify, localize, and assign bug reports to the right developers based on Git commit history.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/register" className="px-8 py-3.5 bg-primary hover:bg-blue-600 text-white font-semibold rounded-xl w-full sm:w-auto shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-0.5">
              Start Reporting
            </Link>
            <Link to="/login" className="px-8 py-3.5 bg-surface hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl w-full sm:w-auto transition-all flex items-center justify-center gap-2">
              <GitMerge className="w-5 h-5"/> Developer Login
            </Link>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-3 gap-6 relative z-10">
          <FeatureCard 
            icon={ShieldCheck} 
            title="Auto Classification" 
            desc="Our SVM models instantly filter out invalid bug reports and feature requests, reserving developer time for real issues."
            color="text-emerald-400"
            bg="bg-emerald-400/10"
          />
          <FeatureCard 
            icon={Zap} 
            title="Intelligent Localization" 
            desc="Matches bug descriptions to source code files automatically using TF-IDF, pointing developers exactly where to look."
            color="text-amber-400"
            bg="bg-amber-400/10"
          />
          <FeatureCard 
            icon={Layers} 
            title="Smart Assignment" 
            desc="Analyzes commit history to assign the bug to the most experienced developer for the localized files."
            color="text-blue-400"
            bg="bg-blue-400/10"
          />
        </div>
      </main>
      
      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-800/50">
        <p>&copy; {new Date().getFullYear()} BugFlow AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, color, bg }) => (
  <div className="p-6 rounded-2xl bg-surface/40 border border-slate-800 backdrop-blur-sm hover:bg-surface/80 transition-all group">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${bg} ${color} group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-100">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default Landing;
